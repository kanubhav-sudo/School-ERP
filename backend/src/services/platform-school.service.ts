/**
 * Platform School Management Service — CloudEMS Platform v4
 *
 * CRUD and lifecycle management for schools.
 * Exposes operations consumed by platform-level (SUPER_ADMIN) controllers.
 *
 * @module services/platform-school
 */

import prisma from '../database/prisma'
import { SchoolStatus, Prisma } from '../generated/prisma'
import { NotFoundError, ConflictError, ValidationError } from '../core/errors'

// ─── List / Paginate Schools ──────────────────────────────────

export interface ListSchoolsFilter {
  status?: SchoolStatus
  search?: string
  page?: number
  limit?: number
}

export async function listSchools(filter: ListSchoolsFilter = {}) {
  const { status, search, page = 1, limit = 20 } = filter

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
        { contactEmail: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        settings: {
          select: { principalName: true, city: true, state: true, country: true, phone: true },
        },
        features: true,
        _count: {
          select: { users: true, students: true, teachers: true },
        },
      },
    }),
    prisma.school.count({ where }),
  ])

  return {
    schools,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get Single School ────────────────────────────────────────

export async function getSchoolById(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      settings: true,
      features: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          users: true,
          students: true,
          teachers: true,
          classes: true,
        },
      },
    },
  })

  if (!school) throw new NotFoundError('School not found')
  return school
}

// ─── Update School Info ───────────────────────────────────────

export interface UpdateSchoolInput {
  name?: string
  schoolType?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  customDomain?: string | null
  logoUrl?: string
}

export async function updateSchool(schoolId: string, input: UpdateSchoolInput) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new NotFoundError('School not found')

  // Check domain uniqueness if changing domain
  if (input.customDomain && input.customDomain !== school.customDomain) {
    const domainExists = await prisma.school.findUnique({
      where: { customDomain: input.customDomain },
    })
    if (domainExists)
      throw new ConflictError(`Custom domain "${input.customDomain}" is already registered`)
  }

  return prisma.school.update({
    where: { id: schoolId },
    data: {
      ...(input.name && { name: input.name }),
      schoolType: input.schoolType,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      website: input.website,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country,
      pincode: input.pincode,
      customDomain: input.customDomain,
      logoUrl: input.logoUrl,
    },
    include: { settings: true, features: true },
  })
}

// ─── Update School Settings ───────────────────────────────────

export interface UpdateSchoolSettingsInput {
  principalName?: string
  primaryColor?: string
  accentColor?: string
  sessionStartMonth?: number
  workingDays?: string[]
  // Use unknown here; Prisma cast happens inside updateSchoolSettings()
  attendanceRules?: Record<string, unknown>
  gradingRules?: Record<string, unknown>
  dateFormat?: string
  timeZone?: string
  currency?: string
}

export async function updateSchoolSettings(schoolId: string, input: UpdateSchoolSettingsInput) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new NotFoundError('School not found')

  // JSON fields need a double-cast to satisfy Prisma's InputJsonValue constraint
  // (Record<string, unknown> → unknown → InputJsonValue)
  const jsonCast = (v: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined =>
    v !== undefined ? (v as unknown as Prisma.InputJsonValue) : undefined

  const { attendanceRules, gradingRules, ...rest } = input
  const safeInput = {
    ...rest,
    ...(attendanceRules !== undefined && { attendanceRules: jsonCast(attendanceRules) }),
    ...(gradingRules !== undefined && { gradingRules: jsonCast(gradingRules) }),
  }

  return prisma.schoolSettings.upsert({
    where: { schoolId },
    create: { schoolId, ...safeInput, country: 'India' },
    update: safeInput,
  })
}

// ─── Update School Features ───────────────────────────────────

export interface UpdateSchoolFeaturesInput {
  attendanceModule?: boolean
  feesModule?: boolean
  examModule?: boolean
  homeworkModule?: boolean
  noticeModule?: boolean
  transportModule?: boolean
  libraryModule?: boolean
  hostelModule?: boolean
  inventoryModule?: boolean
  payrollModule?: boolean
  onlineExamModule?: boolean
}

export async function updateSchoolFeatures(schoolId: string, input: UpdateSchoolFeaturesInput) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new NotFoundError('School not found')

  return prisma.schoolFeatures.upsert({
    where: { schoolId },
    create: { schoolId, ...input },
    update: input,
  })
}

// ─── School Status Transitions ────────────────────────────────

const VALID_STATUS_TRANSITIONS: Record<SchoolStatus, SchoolStatus[]> = {
  [SchoolStatus.PROVISIONING]: [SchoolStatus.ACTIVE, SchoolStatus.FAILED],
  [SchoolStatus.ACTIVE]: [SchoolStatus.INACTIVE, SchoolStatus.SUSPENDED, SchoolStatus.ARCHIVED],
  [SchoolStatus.INACTIVE]: [SchoolStatus.ACTIVE, SchoolStatus.ARCHIVED],
  [SchoolStatus.SUSPENDED]: [SchoolStatus.ACTIVE, SchoolStatus.ARCHIVED],
  [SchoolStatus.ARCHIVED]: [],
  [SchoolStatus.FAILED]: [SchoolStatus.PROVISIONING],
}

export async function changeSchoolStatus(
  schoolId: string,
  newStatus: SchoolStatus,
  reason?: string
) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new NotFoundError('School not found')

  const allowedTransitions = VALID_STATUS_TRANSITIONS[school.status]
  if (!allowedTransitions.includes(newStatus)) {
    throw new ValidationError(
      `Cannot transition school from ${school.status} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`
    )
  }

  return prisma.school.update({
    where: { id: schoolId },
    data: {
      status: newStatus,
      isActive: newStatus === SchoolStatus.ACTIVE,
      ...(newStatus === SchoolStatus.FAILED && reason && { failureReason: reason }),
      ...(newStatus === SchoolStatus.ACTIVE && { failureReason: null }),
    },
  })
}

// ─── Soft Delete (Archive) ────────────────────────────────────

export async function archiveSchool(schoolId: string) {
  return changeSchoolStatus(schoolId, SchoolStatus.ARCHIVED)
}

// ─── Platform Dashboard Metrics ───────────────────────────────

export async function getPlatformDashboardMetrics() {
  const [
    totalSchools,
    activeSchools,
    provisioningSchools,
    failedSchools,
    inactiveSchools,
    suspendedSchools,
    totalUsers,
    totalStudents,
    totalTeachers,
    recentSchools,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
    prisma.school.count({ where: { status: SchoolStatus.PROVISIONING } }),
    prisma.school.count({ where: { status: SchoolStatus.FAILED } }),
    prisma.school.count({ where: { status: SchoolStatus.INACTIVE } }),
    prisma.school.count({ where: { status: SchoolStatus.SUSPENDED } }),
    prisma.user.count(),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.school.findMany({
      where: { status: SchoolStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: { select: { students: true, teachers: true } },
      },
    }),
  ])

  return {
    schools: {
      total: totalSchools,
      active: activeSchools,
      provisioning: provisioningSchools,
      failed: failedSchools,
      inactive: inactiveSchools,
      suspended: suspendedSchools,
    },
    platform: {
      totalUsers,
      totalStudents,
      totalTeachers,
    },
    recentSchools,
    // Revenue placeholders (Phase 5 — billing)
    revenue: {
      mrr: null,
      arr: null,
      note: 'Revenue metrics are available after Phase 5 (Billing) implementation',
    },
  }
}
