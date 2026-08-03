/**
 * Student Service
 *
 * All business logic for student management lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * @module services/student
 */

import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateStudentInput,
  UpdateStudentInput,
  ListStudentsInput,
} from '../validators/student.validator'
import { getPaginationMeta, getPaginationSkip } from '../utils/pagination'

// ─── Student Select Shape ─────────────────────────────────────

const studentSelect = {
  id: true,
  userId: true,
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
  feeCategory: true,
  feePlanId: true,
  siblingStudentId: true,
  siblingFeeAmount: true,
  admissionDate: true,
  status: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  session: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  feePlan: { select: { id: true, name: true, monthlyAmount: true } },
} as const

// ─── List ─────────────────────────────────────────────────────

export async function listStudents(db: any, filters: ListStudentsInput) {
  const { page, limit, search, sessionId, classId, sectionId, status, isActive } = filters

  const skip = getPaginationSkip(page, limit)

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
    db.student.findMany({
      where,
      select: studentSelect,
      skip,
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    db.student.count({ where }),
  ])

  return {
    students,
    pagination: getPaginationMeta(page, limit, total),
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getStudentById(db: any, id: string) {
  const student = await db.student.findFirst({
    where: { id, deletedAt: null },
    select: studentSelect,
  })
  if (!student) throw new NotFoundError(`Student not found`)
  return student
}

import { createUserForStudent } from './account.service'
import { generateFeeRecordsForStudent } from './fee-record.service'

export async function createStudent(db: any, data: CreateStudentInput) {
  // Check for duplicate admission number
  const existing = await db.student.findFirst({
    where: { admissionNumber: data.admissionNumber },
  })
  if (existing) {
    throw new ConflictError(`Admission number "${data.admissionNumber}" is already in use`)
  }

  // Validate FeePlan
  if (data.feePlanId) {
    const feePlan = await db.feePlan.findFirst({ where: { id: data.feePlanId } })
    if (!feePlan) throw new NotFoundError('Fee plan not found')
    if (feePlan.classId !== data.classId || feePlan.sessionId !== data.sessionId) {
      throw new ConflictError('Selected fee plan is not valid for this class and session')
    }
  }

  const student = await db.student.create({
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
      feeCategory: data.feeCategory,
      feePlanId: data.feePlanId,
      siblingStudentId: data.siblingStudentId,
      siblingFeeAmount: data.siblingFeeAmount,
      admissionDate: new Date(data.admissionDate),
      status: data.status,
      notes: data.notes,
      isActive: data.isActive,
    },
    select: studentSelect,
  })

  const credentials = await createUserForStudent(db, student.id)

  const finalStudent = await db.student.findFirst({
    where: { id: student.id },
    select: studentSelect,
  })

  // Generate fee records
  await generateFeeRecordsForStudent(student.id, db)

  return { student: finalStudent!, credentials }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateStudent(db: any, id: string, data: UpdateStudentInput) {
  await getStudentById(db, id)

  // Check duplicate admission number
  if (data.admissionNumber) {
    const dup = await db.student.findFirst({
      where: { admissionNumber: data.admissionNumber, NOT: { id } },
    })
    if (dup) throw new ConflictError(`Admission number "${data.admissionNumber}" is already in use`)
  }

  // Validate sibling not self
  if (data.siblingStudentId && data.siblingStudentId === id) {
    throw new ConflictError(`A student cannot be their own sibling`)
  }

  // Validate FeePlan matches class and session
  const student = await getStudentById(db, id)
  const finalClassId = data.classId !== undefined ? data.classId : student.classId
  const finalSessionId = data.sessionId !== undefined ? data.sessionId : student.sessionId
  const finalFeePlanId = data.feePlanId !== undefined ? data.feePlanId : student.feePlanId

  if (finalFeePlanId) {
    const feePlan = await db.feePlan.findFirst({ where: { id: finalFeePlanId } })
    if (feePlan && (feePlan.classId !== finalClassId || feePlan.sessionId !== finalSessionId)) {
      throw new ConflictError('Assigned fee plan is not valid for the new class or session')
    }
  }

  return db.student.update({
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
      ...(data.feeCategory !== undefined && { feeCategory: data.feeCategory }),
      ...(data.feePlanId !== undefined && { feePlanId: data.feePlanId }),
      ...(data.siblingStudentId !== undefined && { siblingStudentId: data.siblingStudentId }),
      ...(data.siblingFeeAmount !== undefined && { siblingFeeAmount: data.siblingFeeAmount }),
      ...(data.admissionDate !== undefined && { admissionDate: new Date(data.admissionDate) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: studentSelect,
  })
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteStudent(db: any, id: string) {
  await getStudentById(db, id)

  return db.student.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  })
}
