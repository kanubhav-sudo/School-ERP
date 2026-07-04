/**
 * Subject Service
 *
 * Business logic for subject management.
 * Supports class-subject assignments (many-to-many).
 *
 * @module services/subject
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateSubjectInput,
  UpdateSubjectInput,
  ListSubjectsInput,
} from '../validators/subject.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listSubjects(filters: ListSubjectsInput) {
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
    prisma.subject.findMany({
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
    prisma.subject.count({ where }),
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

export async function getSubjectById(id: string) {
  const subject = await prisma.subject.findUnique({
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

export async function createSubject(data: CreateSubjectInput) {
  const existing = await prisma.subject.findUnique({ where: { code: data.code } })
  if (existing) throw new ConflictError(`Subject with code "${data.code}" already exists`)

  return prisma.subject.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  })
}

// ─── Update ───────────────────────────────────────────────────

export async function updateSubject(id: string, data: UpdateSubjectInput) {
  await getSubjectById(id)

  if (data.code) {
    const duplicate = await prisma.subject.findFirst({
      where: { code: data.code, NOT: { id } },
    })
    if (duplicate) throw new ConflictError(`Subject with code "${data.code}" already exists`)
  }

  return prisma.subject.update({
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

export async function deleteSubject(id: string) {
  const subject = await getSubjectById(id)

  if (subject.classSubjects.length > 0) {
    throw new ConflictError(
      'Cannot delete a subject assigned to one or more classes. Remove class assignments first.'
    )
  }

  return prisma.subject.delete({ where: { id } })
}

// ─── Class Assignment ─────────────────────────────────────────

export async function assignSubjectToClass(subjectId: string, classId: string) {
  // Verify both exist
  await getSubjectById(subjectId)
  const cls = await prisma.class.findUnique({ where: { id: classId } })
  if (!cls) throw new NotFoundError('Class not found')

  // Check if already assigned
  const existing = await prisma.classSubject.findUnique({
    where: { classId_subjectId: { classId, subjectId } },
  })
  if (existing) throw new ConflictError('Subject is already assigned to this class')

  return prisma.classSubject.create({ data: { classId, subjectId } })
}

export async function removeSubjectFromClass(subjectId: string, classId: string) {
  const assignment = await prisma.classSubject.findUnique({
    where: { classId_subjectId: { classId, subjectId } },
  })
  if (!assignment) throw new NotFoundError('Assignment not found')

  return prisma.classSubject.delete({
    where: { classId_subjectId: { classId, subjectId } },
  })
}
