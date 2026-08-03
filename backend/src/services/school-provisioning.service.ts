/**
 * School Provisioning Service — CloudEMS Platform v4
 *
 * Implements the transactional provisioning pipeline:
 *
 *   1. Create School record  (status = PROVISIONING)
 *   2. Commit to DB
 *   3. Run provisioning steps inside $transaction
 *      - SchoolSettings
 *      - SchoolFeatures
 *      - Class Template (configurable, NOT hardcoded)
 *      - Platform Admin User for the school
 *   4a. SUCCESS → Update status = ACTIVE, provisionedAt = now()
 *   4b. FAILURE → Update status = FAILED, failureReason = error message
 *
 * This ensures every provisioning attempt is traceable — even failures.
 *
 * @module services/school-provisioning
 */

import prisma from '../database/prisma'
import { SchoolStatus } from '../generated/prisma'
import { ConflictError, ValidationError } from '../core/errors'
import { hashPassword } from './auth.service'
import { writeAuditLog } from './audit.service'
import slugify from 'slugify'

// ─── Input Types ──────────────────────────────────────────────

export interface ClassTemplate {
  name: string
  sections: string[]
}

export interface SchoolBranding {
  logoUrl?: string
  primaryColor?: string
  accentColor?: string
}

export interface ProvisionSchoolInput {
  /** School display name */
  name: string
  /** Custom slug; auto-generated from name if omitted */
  slug?: string
  /** School type (PRIMARY, SECONDARY, K12, etc.) */
  schoolType?: string
  /** Contact info */
  contactEmail?: string
  contactPhone?: string
  website?: string
  /** Location */
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  /** Custom domain (optional) */
  customDomain?: string
  /** Branding */
  branding?: SchoolBranding
  /** Settings overrides */
  settings?: {
    principalName?: string
    sessionStartMonth?: number
    workingDays?: string[]
    dateFormat?: string
    timeZone?: string
    currency?: string
  }
  /** Feature flags override */
  features?: {
    transportModule?: boolean
    libraryModule?: boolean
    hostelModule?: boolean
    inventoryModule?: boolean
    payrollModule?: boolean
    onlineExamModule?: boolean
  }
  /** Configurable class template — NOT hardcoded */
  classTemplate?: ClassTemplate[]
  /** Initial school admin credentials */
  adminUser: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    password: string
  }
  /** ID of the SUPER_ADMIN performing the provisioning */
  createdByUserId?: string
}

// ─── Slug Generator ───────────────────────────────────────────

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true })
  let candidate = base
  let attempt = 0

  while (true) {
    const existing = await prisma.school.findUnique({ where: { slug: candidate } })
    if (!existing) return candidate
    attempt++
    candidate = `${base}-${attempt}`
  }
}

// ─── Default Class Template ───────────────────────────────────

const DEFAULT_CLASS_TEMPLATE: ClassTemplate[] = [
  { name: 'Class 1', sections: ['A', 'B'] },
  { name: 'Class 2', sections: ['A', 'B'] },
  { name: 'Class 3', sections: ['A', 'B'] },
  { name: 'Class 4', sections: ['A', 'B'] },
  { name: 'Class 5', sections: ['A', 'B'] },
  { name: 'Class 6', sections: ['A'] },
  { name: 'Class 7', sections: ['A'] },
  { name: 'Class 8', sections: ['A'] },
  { name: 'Class 9', sections: ['A'] },
  { name: 'Class 10', sections: ['A'] },
]

// ─── Main Provisioning Function ───────────────────────────────

/**
 * Provisions a new school in a two-phase commit pattern:
 * Phase 1: Create the School record immediately (status = PROVISIONING)
 * Phase 2: Run all sub-provisioning steps in a transaction
 */
export async function provisionSchool(input: ProvisionSchoolInput) {
  // ── Validate admin email uniqueness ───────────────────────
  const existingAdminUser = await prisma.user.findUnique({
    where: { email: input.adminUser.email },
  })
  if (existingAdminUser) {
    throw new ConflictError(`An account with email ${input.adminUser.email} already exists`)
  }

  // ── Generate slug ─────────────────────────────────────────
  const slug = input.slug
    ? input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : await generateUniqueSlug(input.name)

  // ── Check slug uniqueness ─────────────────────────────────
  if (input.slug) {
    const slugExists = await prisma.school.findUnique({ where: { slug } })
    if (slugExists) throw new ConflictError(`Slug "${slug}" is already taken`)
  }

  // ── Check domain uniqueness ───────────────────────────────
  if (input.customDomain) {
    const domainExists = await prisma.school.findUnique({
      where: { customDomain: input.customDomain },
    })
    if (domainExists)
      throw new ConflictError(`Custom domain "${input.customDomain}" is already registered`)
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 1: Create School record immediately (status = PROVISIONING)
  // This gives us a trackable record even if provisioning fails.
  // ═══════════════════════════════════════════════════════════
  const school = await prisma.school.create({
    data: {
      name: input.name,
      slug,
      status: SchoolStatus.PROVISIONING,
      schoolType: input.schoolType,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      website: input.website,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country ?? 'India',
      pincode: input.pincode,
      customDomain: input.customDomain,
      logoUrl: input.branding?.logoUrl,
      isActive: false, // not active until provisioning succeeds
    },
  })

  // ═══════════════════════════════════════════════════════════
  // PHASE 2: Run provisioning in a transaction
  // ═══════════════════════════════════════════════════════════
  try {
    await prisma.$transaction(async (tx) => {
      // 1. School Settings
      await tx.schoolSettings.create({
        data: {
          schoolId: school.id,
          logoUrl: input.branding?.logoUrl,
          primaryColor: input.branding?.primaryColor ?? '#4F46E5',
          accentColor: input.branding?.accentColor ?? '#06B6D4',
          principalName: input.settings?.principalName,
          address: input.address,
          city: input.city,
          state: input.state,
          country: input.country ?? 'India',
          pincode: input.pincode,
          phone: input.contactPhone,
          email: input.contactEmail,
          sessionStartMonth: input.settings?.sessionStartMonth ?? 4,
          workingDays: input.settings?.workingDays ?? [
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
          ],
          dateFormat: input.settings?.dateFormat ?? 'DD/MM/YYYY',
          timeZone: input.settings?.timeZone ?? 'Asia/Kolkata',
          currency: input.settings?.currency ?? 'INR',
        },
      })

      // 2. School Features
      await tx.schoolFeatures.create({
        data: {
          schoolId: school.id,
          attendanceModule: true,
          feesModule: true,
          examModule: true,
          homeworkModule: true,
          noticeModule: true,
          transportModule: input.features?.transportModule ?? false,
          libraryModule: input.features?.libraryModule ?? false,
          hostelModule: input.features?.hostelModule ?? false,
          inventoryModule: input.features?.inventoryModule ?? false,
          payrollModule: input.features?.payrollModule ?? false,
          onlineExamModule: input.features?.onlineExamModule ?? false,
        },
      })

      // 3. Class Template (configurable — uses input or default)
      const template = input.classTemplate?.length ? input.classTemplate : DEFAULT_CLASS_TEMPLATE

      for (let i = 0; i < template.length; i++) {
        const classItem = template[i]
        const createdClass = await tx.class.create({
          data: {
            schoolId: school.id,
            name: classItem.name,
            displayOrder: i + 1,
            isActive: true,
          },
        })

        for (const sectionName of classItem.sections) {
          await tx.section.create({
            data: {
              schoolId: school.id,
              classId: createdClass.id,
              name: sectionName,
              capacity: 40,
              isActive: true,
            },
          })
        }
      }

      // 4. Admin User for this school
      const passwordHash = await hashPassword(input.adminUser.password)
      const adminUsername = `${input.adminUser.firstName.toLowerCase()}.${slug}.admin`

      await tx.user.create({
        data: {
          schoolId: school.id,
          username: adminUsername,
          email: input.adminUser.email,
          phone: input.adminUser.phone,
          passwordHash,
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
          mustChangePassword: true,
        },
      })
    })

    // ═══════════════════════════════════════════════════════════
    // PHASE 2 SUCCESS: Update school status to ACTIVE
    // ═══════════════════════════════════════════════════════════
    const activatedSchool = await prisma.school.update({
      where: { id: school.id },
      data: {
        status: SchoolStatus.ACTIVE,
        isActive: true,
        provisionedAt: new Date(),
      },
      include: {
        settings: true,
        features: true,
      },
    })

    // Write platform audit log
    await writeAuditLog({
      userId: input.createdByUserId,
      role: 'SUPER_ADMIN',
      module: 'PLATFORM',
      action: 'SCHOOL_PROVISIONED',
      entity: 'School',
      entityId: school.id,
      result: 'SUCCESS',
      newValue: { name: activatedSchool.name, slug: activatedSchool.slug },
    })

    return activatedSchool
  } catch (error) {
    // ═══════════════════════════════════════════════════════════
    // PHASE 2 FAILURE: Update school status to FAILED
    // ═══════════════════════════════════════════════════════════
    const reason = error instanceof Error ? error.message : 'Unknown provisioning error'

    await prisma.school.update({
      where: { id: school.id },
      data: {
        status: SchoolStatus.FAILED,
        failureReason: reason,
        isActive: false,
      },
    })

    // Write failure audit log
    await writeAuditLog({
      userId: input.createdByUserId,
      role: 'SUPER_ADMIN',
      module: 'PLATFORM',
      action: 'SCHOOL_PROVISION_FAILED',
      entity: 'School',
      entityId: school.id,
      result: 'FAILURE',
      newValue: { reason },
    })

    // Re-throw so the controller can return the right HTTP response
    throw error
  }
}

// ─── Re-Provision (retry a FAILED school) ─────────────────────

/**
 * Retries provisioning for a school that is in FAILED state.
 * Sets status back to PROVISIONING, then runs the provisioning pipeline.
 */
export async function reprovisionSchool(
  schoolId: string,
  input: Omit<ProvisionSchoolInput, 'name' | 'slug'>
): Promise<void> {
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new ValidationError('School not found')
  if (school.status !== SchoolStatus.FAILED) {
    throw new ValidationError('Only schools in FAILED status can be re-provisioned')
  }

  // Clean up failed provisioning artefacts
  await prisma.$transaction([
    prisma.schoolSettings.deleteMany({ where: { schoolId } }),
    prisma.schoolFeatures.deleteMany({ where: { schoolId } }),
    prisma.class.deleteMany({ where: { schoolId } }),
    prisma.user.deleteMany({ where: { schoolId, role: 'ADMIN' } }),
  ])

  // Reset to provisioning
  await prisma.school.update({
    where: { id: schoolId },
    data: { status: SchoolStatus.PROVISIONING, failureReason: null },
  })

  // Re-run with the original school name/slug
  await provisionSchool({
    ...input,
    name: school.name,
    slug: school.slug,
    adminUser: input.adminUser,
  })
}
