/**
 * Teacher Service
 *
 * All business logic for teacher management lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * @module services/teacher
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../core/errors'
import type {
  CreateTeacherInput,
  UpdateTeacherInput,
  ListTeachersInput,
  CreateTeacherAssignmentInput,
  UpdateTeacherAssignmentInput,
} from '../validators/teacher.validator'
import { getPaginationMeta, getPaginationSkip } from '../utils/pagination'

// ─── Teacher Select Shape ─────────────────────────────────────

const teacherSelect = {
  id: true,
  userId: true,
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
  bloodGroup: true,
  emergencyContact: true,
  emergencyPhone: true,
  photoUrl: true,
  designation: true,
  createdAt: true,
  updatedAt: true,
  assignments: {
    select: {
      id: true,
      sessionId: true,
      isClassTeacher: true,
      session: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  },
} as const

// ─── List ─────────────────────────────────────────────────────

export async function listTeachers(filters: ListTeachersInput) {
  const {
    page,
    limit,
    search,
    department,
    employmentStatus,
    isActive,
    sessionId,
    classId,
    subjectId,
  } = filters

  const skip = getPaginationSkip(page, limit)

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
    ...(sessionId || classId || subjectId
      ? {
          assignments: {
            some: {
              ...(sessionId ? { sessionId } : {}),
              ...(classId ? { classId } : {}),
              ...(subjectId ? { subjectId } : {}),
            },
          },
        }
      : {}),
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
    pagination: getPaginationMeta(page, limit, total),
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

import { createUserForTeacher } from './account.service'

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

  return await prisma.$transaction(async (tx) => {
    const teacher = await tx.teacher.create({
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
        designation: data.designation,
        joiningDate: new Date(data.joiningDate),
        employmentStatus: data.employmentStatus,
        address: data.address,
        bloodGroup: data.bloodGroup ?? null,
        emergencyContact: data.emergencyContact ?? null,
        emergencyPhone: data.emergencyPhone ?? null,
        photoUrl: data.photoUrl ?? null,
        notes: data.notes,
        isActive: data.isActive,
      },
      select: teacherSelect,
    })

    const credentials = await createUserForTeacher(teacher.id, tx)

    // We update the teacher object to reflect the new userId so it's correct in the response.
    // In our DB, createUserForTeacher updates the teacher row. We can just set it here to save a query.
    // Actually, we can just fetch it again to be safe.
    const finalTeacher = await tx.teacher.findUnique({
      where: { id: teacher.id },
      select: teacherSelect,
    })

    return { teacher: finalTeacher!, credentials }
  })
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
      ...(data.designation !== undefined && { designation: data.designation }),
      ...(data.joiningDate !== undefined && { joiningDate: new Date(data.joiningDate) }),
      ...(data.employmentStatus !== undefined && { employmentStatus: data.employmentStatus }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
      ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
      ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
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

  // Validate session exists
  const session = await prisma.academicSession.findUnique({ where: { id: data.sessionId } })
  if (!session) throw new NotFoundError('Academic session not found')

  // Validate section belongs to class
  const section = await prisma.section.findFirst({
    where: { id: data.sectionId, classId: data.classId },
  })
  if (!section) throw new ValidationError('Section does not belong to the selected class', [])

  // Prevent duplicates
  const existing = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      sessionId: data.sessionId,
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
    },
  })
  if (existing) throw new ConflictError('This assignment already exists')

  // Check class teacher uniqueness if setting isClassTeacher
  if (data.isClassTeacher) {
    const existingClassTeacher = await prisma.teacherAssignment.findFirst({
      where: {
        sessionId: data.sessionId,
        classId: data.classId,
        sectionId: data.sectionId,
        isClassTeacher: true,
      },
    })
    if (existingClassTeacher) {
      throw new ConflictError(
        'A class teacher is already assigned to this section for this session'
      )
    }
  }

  return prisma.teacherAssignment.create({
    data: {
      teacherId,
      sessionId: data.sessionId,
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      isClassTeacher: data.isClassTeacher,
    },
    select: {
      id: true,
      sessionId: true,
      isClassTeacher: true,
      session: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  })
}

export async function updateTeacherAssignment(
  teacherId: string,
  assignmentId: string,
  data: UpdateTeacherAssignmentInput
) {
  const assignment = await prisma.teacherAssignment.findUnique({
    where: { id: assignmentId, teacherId },
  })
  if (!assignment) throw new NotFoundError('Assignment not found')

  const sessionId = data.sessionId ?? assignment.sessionId
  const classId = data.classId ?? assignment.classId
  const sectionId = data.sectionId ?? assignment.sectionId
  const subjectId = data.subjectId ?? assignment.subjectId
  const isClassTeacher = data.isClassTeacher ?? assignment.isClassTeacher

  // Validate section belongs to class if section or class changed
  if (data.classId || data.sectionId) {
    const section = await prisma.section.findFirst({
      where: { id: sectionId, classId },
    })
    if (!section) throw new ValidationError('Section does not belong to the selected class', [])
  }

  // Prevent duplicates (excluding self)
  const existing = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      sessionId,
      classId,
      sectionId,
      subjectId,
      id: { not: assignmentId },
    },
  })
  if (existing) throw new ConflictError('This assignment already exists for this teacher')

  // Check class teacher uniqueness if setting isClassTeacher
  if (isClassTeacher) {
    const existingClassTeacher = await prisma.teacherAssignment.findFirst({
      where: {
        sessionId,
        classId,
        sectionId,
        isClassTeacher: true,
        id: { not: assignmentId },
      },
    })
    if (existingClassTeacher) {
      throw new ConflictError(
        'A class teacher is already assigned to this section for this session'
      )
    }
  }

  return prisma.teacherAssignment.update({
    where: { id: assignmentId },
    data: {
      sessionId,
      classId,
      sectionId,
      subjectId,
      isClassTeacher,
    },
    select: {
      id: true,
      sessionId: true,
      isClassTeacher: true,
      session: { select: { id: true, name: true } },
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

// ─── Stats ────────────────────────────────────────────────────

export async function getTeacherStats(sessionId?: string) {
  const [total, active, inactive, classTeachers] = await Promise.all([
    prisma.teacher.count({ where: { deletedAt: null } }),
    prisma.teacher.count({ where: { deletedAt: null, isActive: true } }),
    prisma.teacher.count({ where: { deletedAt: null, isActive: false } }),
    prisma.teacher.count({
      where: {
        deletedAt: null,
        assignments: {
          some: {
            isClassTeacher: true,
            ...(sessionId ? { sessionId } : {}),
          },
        },
      },
    }),
  ])

  return { total, active, inactive, classTeachers }
}

// ─── Timetable & Sections ─────────────────────────────────────

export async function getTeacherTimetable(teacherId: string, sessionId?: string) {
  await getTeacherById(teacherId)

  return prisma.timetable.findMany({
    where: {
      teacherId,
      isDeleted: false,
      ...(sessionId ? { sessionId } : {}),
    },
    include: {
      session: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
}

export async function getTeacherSections(teacherId: string, sessionId?: string) {
  await getTeacherById(teacherId)

  return prisma.teacherAssignment.findMany({
    where: {
      teacherId,
      ...(sessionId ? { sessionId } : {}),
    },
    include: {
      session: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { section: { name: 'asc' } }],
  })
}
