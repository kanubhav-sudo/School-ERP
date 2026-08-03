/**
 * Subject Service
 *
 * Business logic for subject management.
 * Supports class-subject assignments (many-to-many).
 *
 * @module services/subject
 */

import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateSubjectInput,
  UpdateSubjectInput,
  ListSubjectsInput,
} from '../validators/subject.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listSubjects(db: any, filters: ListSubjectsInput) {
  const { page, limit, search, classId, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(classId ? { classSubjects: { some: { classId } } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [subjects, total] = await Promise.all([
    db.subject.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ name: 'asc' }],
      include: {
        classSubjects: {
          include: { class: { select: { id: true, name: true } } },
        },
        _count: { select: { classSubjects: true } },
      },
    }),
    db.subject.count({ where }),
  ])

  return {
    subjects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getSubjectById(db: any, id: string) {
  const subject = await db.subject.findFirst({
    where: { id },
    include: {
      classSubjects: {
        include: { class: { select: { id: true, name: true } } },
      },
    },
  })
  if (!subject) throw new NotFoundError('Subject not found')
  return subject
}

// ─── Create ───────────────────────────────────────────────────

export async function createSubject(db: any, data: CreateSubjectInput) {
  const existing = await db.subject.findFirst({ where: { code: data.code } })
  if (existing) throw new ConflictError(`Subject with code "${data.code}" already exists`)

  return db.subject.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  })
}

// ─── Update ───────────────────────────────────────────────────

export async function updateSubject(db: any, id: string, data: UpdateSubjectInput) {
  await getSubjectById(db, id)

  if (data.code) {
    const duplicate = await db.subject.findFirst({
      where: { code: data.code, NOT: { id } },
    })
    if (duplicate) throw new ConflictError(`Subject with code "${data.code}" already exists`)
  }

  return db.subject.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      classSubjects: {
        include: { class: { select: { id: true, name: true } } },
      },
    },
  })
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteSubject(db: any, id: string) {
  const subject = await getSubjectById(db, id)

  if (subject.classSubjects.length > 0) {
    throw new ConflictError(
      'Cannot delete a subject assigned to one or more classes. Remove class assignments first.'
    )
  }

  return db.subject.delete({ where: { id } })
}

// ─── Class Assignment ─────────────────────────────────────────

export async function assignSubjectToClass(db: any, subjectId: string, classId: string) {
  // Verify both exist
  await getSubjectById(db, subjectId)
  const cls = await db.class.findFirst({ where: { id: classId } })
  if (!cls) throw new NotFoundError('Class not found')

  // Check if already assigned
  const existing = await db.classSubject.findFirst({
    where: { classId, subjectId },
  })
  if (existing) throw new ConflictError('Subject is already assigned to this class')

  return db.classSubject.create({ data: { classId, subjectId } })
}

export async function removeSubjectFromClass(db: any, subjectId: string, classId: string) {
  const assignment = await db.classSubject.findFirst({
    where: { classId, subjectId },
  })
  if (!assignment) throw new NotFoundError('Assignment not found')

  return db.classSubject.delete({
    where: { classId_subjectId: { classId, subjectId } },
  })
}
