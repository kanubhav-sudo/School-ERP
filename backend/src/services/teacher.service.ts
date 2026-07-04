/**
 * Teacher Service
 *
 * All business logic for teacher management lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * @module services/teacher
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateTeacherInput,
  UpdateTeacherInput,
  ListTeachersInput,
  CreateTeacherAssignmentInput,
} from '../validators/teacher.validator'

// ─── Teacher Select Shape ─────────────────────────────────────

const teacherSelect = {
  id: true,
  employeeId: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  phone: true,
  email: true,
  qualification: true,
  experienceYears: true,
  department: true,
  joiningDate: true,
  employmentStatus: true,
  address: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  assignments: {
    select: {
      id: true,
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  },
} as const

// ─── List ─────────────────────────────────────────────────────

export async function listTeachers(filters: ListTeachersInput) {
  const { page, limit, search, department, employmentStatus, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { employeeId: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(department ? { department: { contains: department, mode: 'insensitive' as const } } : {}),
    ...(employmentStatus ? { employmentStatus } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      select: teacherSelect,
      skip,
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.teacher.count({ where }),
  ])

  return {
    teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getTeacherById(id: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, deletedAt: null },
    select: teacherSelect,
  })
  if (!teacher) throw new NotFoundError(`Teacher not found`)
  return teacher
}

// ─── Create ───────────────────────────────────────────────────

export async function createTeacher(data: CreateTeacherInput) {
  // Check for duplicate employeeId
  const existingById = await prisma.teacher.findUnique({
    where: { employeeId: data.employeeId },
  })
  if (existingById) {
    throw new ConflictError(`Employee ID "${data.employeeId}" is already in use`)
  }

  // Check for duplicate email
  const existingByEmail = await prisma.teacher.findUnique({ where: { email: data.email } })
  if (existingByEmail) {
    throw new ConflictError(`Email "${data.email}" is already in use`)
  }

  const teacher = await prisma.teacher.create({
    data: {
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      phone: data.phone,
      email: data.email,
      qualification: data.qualification,
      experienceYears: data.experienceYears,
      department: data.department,
      joiningDate: new Date(data.joiningDate),
      employmentStatus: data.employmentStatus,
      address: data.address,
      notes: data.notes,
      isActive: data.isActive,
    },
    select: teacherSelect,
  })

  return teacher
}

// ─── Update ───────────────────────────────────────────────────

export async function updateTeacher(id: string, data: UpdateTeacherInput) {
  await getTeacherById(id)

  // Check duplicate employeeId
  if (data.employeeId) {
    const dup = await prisma.teacher.findFirst({
      where: { employeeId: data.employeeId, NOT: { id } },
    })
    if (dup) throw new ConflictError(`Employee ID "${data.employeeId}" is already in use`)
  }

  // Check duplicate email
  if (data.email) {
    const dup = await prisma.teacher.findFirst({
      where: { email: data.email, NOT: { id } },
    })
    if (dup) throw new ConflictError(`Email "${data.email}" is already in use`)
  }

  return prisma.teacher.update({
    where: { id },
    data: {
      ...(data.employeeId !== undefined && { employeeId: data.employeeId }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.dateOfBirth !== undefined && {
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.qualification !== undefined && { qualification: data.qualification }),
      ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.joiningDate !== undefined && { joiningDate: new Date(data.joiningDate) }),
      ...(data.employmentStatus !== undefined && { employmentStatus: data.employmentStatus }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: teacherSelect,
  })
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteTeacher(id: string) {
  await getTeacherById(id)

  return prisma.teacher.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  })
}

// ─── Assignments ──────────────────────────────────────────────

export async function addTeacherAssignment(teacherId: string, data: CreateTeacherAssignmentInput) {
  await getTeacherById(teacherId)

  // Prevent duplicates
  const existing = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
    },
  })
  if (existing) throw new ConflictError('This assignment already exists')

  return prisma.teacherAssignment.create({
    data: {
      teacherId,
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
    },
    select: {
      id: true,
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  })
}

export async function removeTeacherAssignment(teacherId: string, assignmentId: string) {
  await getTeacherById(teacherId)

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
  })
  if (!assignment) throw new NotFoundError('Assignment not found')

  return prisma.teacherAssignment.delete({ where: { id: assignmentId } })
}
