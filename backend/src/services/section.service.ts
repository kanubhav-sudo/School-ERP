/**
 * Section Service
 *
 * Business logic for section management.
 * A section belongs to a class (e.g., Class X — Section A).
 *
 * @module services/section
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateSectionInput,
  UpdateSectionInput,
  ListSectionsInput,
} from '../validators/section.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listSections(filters: ListSectionsInput) {
  const { page, limit, search, classId, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(classId ? { classId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [sections, total] = await Promise.all([
    prisma.section.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ class: { displayOrder: 'asc' } }, { name: 'asc' }],
      include: { class: { select: { id: true, name: true } } },
    }),
    prisma.section.count({ where }),
  ])

  return {
    sections,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getSectionById(id: string) {
  const section = await prisma.section.findUnique({
    where: { id },
    include: { class: { select: { id: true, name: true } } },
  })
  if (!section) throw new NotFoundError('Section not found')
  return section
}

// ─── Create ───────────────────────────────────────────────────

export async function createSection(data: CreateSectionInput) {
  // Ensure the parent class exists
  const parentClass = await prisma.class.findUnique({ where: { id: data.classId } })
  if (!parentClass) throw new NotFoundError('Class not found')

  // Unique constraint: section name must be unique within the class
  const duplicate = await prisma.section.findFirst({
    where: { classId: data.classId, name: data.name },
  })
  if (duplicate) {
    throw new ConflictError(`Section "${data.name}" already exists in this class`)
  }

  return prisma.section.create({
    data: {
      name: data.name,
      classId: data.classId,
      capacity: data.capacity ?? 40,
      isActive: data.isActive ?? true,
    },
    include: { class: { select: { id: true, name: true } } },
  })
}

// ─── Update ───────────────────────────────────────────────────

export async function updateSection(id: string, data: UpdateSectionInput) {
  const section = await getSectionById(id)

  const resolvedClassId = data.classId ?? section.classId
  const resolvedName = data.name ?? section.name

  // If class or name changes, check uniqueness
  if (data.name || data.classId) {
    const duplicate = await prisma.section.findFirst({
      where: { classId: resolvedClassId, name: resolvedName, NOT: { id } },
    })
    if (duplicate) {
      throw new ConflictError(`Section "${resolvedName}" already exists in this class`)
    }
  }

  // If classId changing, verify the new class exists
  if (data.classId && data.classId !== section.classId) {
    const parentClass = await prisma.class.findUnique({ where: { id: data.classId } })
    if (!parentClass) throw new NotFoundError('Class not found')
  }

  return prisma.section.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.classId !== undefined && { classId: data.classId }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: { class: { select: { id: true, name: true } } },
  })
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteSection(id: string) {
  await getSectionById(id)
  return prisma.section.delete({ where: { id } })
}
