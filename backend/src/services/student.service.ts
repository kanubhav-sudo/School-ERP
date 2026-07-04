/**
 * Student Service
 *
 * All business logic for student management lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * @module services/student
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateStudentInput,
  UpdateStudentInput,
  ListStudentsInput,
} from '../validators/student.validator'

// ─── Student Select Shape ─────────────────────────────────────

const studentSelect = {
  id: true,
  admissionNumber: true,
  rollNumber: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  bloodGroup: true,
  phone: true,
  email: true,
  photoUrl: true,
  fatherName: true,
  fatherPhone: true,
  motherName: true,
  motherPhone: true,
  guardianName: true,
  guardianPhone: true,
  guardianRelation: true,
  emergencyContact: true,
  emergencyPhone: true,
  address: true,
  sessionId: true,
  classId: true,
  sectionId: true,
  admissionDate: true,
  status: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  session: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
} as const

// ─── List ─────────────────────────────────────────────────────

export async function listStudents(filters: ListStudentsInput) {
  const { page, limit, search, sessionId, classId, sectionId, status, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { admissionNumber: { contains: search, mode: 'insensitive' as const } },
            { rollNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(sessionId ? { sessionId } : {}),
    ...(classId ? { classId } : {}),
    ...(sectionId ? { sectionId } : {}),
    ...(status ? { status } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      select: studentSelect,
      skip,
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.student.count({ where }),
  ])

  return {
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getStudentById(id: string) {
  const student = await prisma.student.findFirst({
    where: { id, deletedAt: null },
    select: studentSelect,
  })
  if (!student) throw new NotFoundError(`Student not found`)
  return student
}

// ─── Create ───────────────────────────────────────────────────

export async function createStudent(data: CreateStudentInput) {
  // Check for duplicate admission number
  const existing = await prisma.student.findUnique({
    where: { admissionNumber: data.admissionNumber },
  })
  if (existing) {
    throw new ConflictError(`Admission number "${data.admissionNumber}" is already in use`)
  }

  return prisma.student.create({
    data: {
      admissionNumber: data.admissionNumber,
      rollNumber: data.rollNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      bloodGroup: data.bloodGroup,
      phone: data.phone,
      email: data.email,
      fatherName: data.fatherName,
      fatherPhone: data.fatherPhone,
      motherName: data.motherName,
      motherPhone: data.motherPhone,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      guardianRelation: data.guardianRelation,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      address: data.address,
      sessionId: data.sessionId,
      classId: data.classId,
      sectionId: data.sectionId,
      admissionDate: new Date(data.admissionDate),
      status: data.status,
      notes: data.notes,
      isActive: data.isActive,
    },
    select: studentSelect,
  })
}

// ─── Update ───────────────────────────────────────────────────

export async function updateStudent(id: string, data: UpdateStudentInput) {
  await getStudentById(id)

  // Check duplicate admission number
  if (data.admissionNumber) {
    const dup = await prisma.student.findFirst({
      where: { admissionNumber: data.admissionNumber, NOT: { id } },
    })
    if (dup) throw new ConflictError(`Admission number "${data.admissionNumber}" is already in use`)
  }

  return prisma.student.update({
    where: { id },
    data: {
      ...(data.admissionNumber !== undefined && { admissionNumber: data.admissionNumber }),
      ...(data.rollNumber !== undefined && { rollNumber: data.rollNumber }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.dateOfBirth !== undefined && {
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      }),
      ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.fatherName !== undefined && { fatherName: data.fatherName }),
      ...(data.fatherPhone !== undefined && { fatherPhone: data.fatherPhone }),
      ...(data.motherName !== undefined && { motherName: data.motherName }),
      ...(data.motherPhone !== undefined && { motherPhone: data.motherPhone }),
      ...(data.guardianName !== undefined && { guardianName: data.guardianName }),
      ...(data.guardianPhone !== undefined && { guardianPhone: data.guardianPhone }),
      ...(data.guardianRelation !== undefined && { guardianRelation: data.guardianRelation }),
      ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
      ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.sessionId !== undefined && { sessionId: data.sessionId }),
      ...(data.classId !== undefined && { classId: data.classId }),
      ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
      ...(data.admissionDate !== undefined && { admissionDate: new Date(data.admissionDate) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: studentSelect,
  })
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteStudent(id: string) {
  await getStudentById(id)

  return prisma.student.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  })
}
