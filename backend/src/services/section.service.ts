/**
 * Section Service
 *
 * Business logic for section management.
 * A section belongs to a class (e.g., Class X — Section A).
 *
 * @module services/section
 */

import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateSectionInput,
  UpdateSectionInput,
  ListSectionsInput,
} from '../validators/section.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listSections(db: any, filters: ListSectionsInput) {
  const { page, limit, search, classId, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(classId ? { classId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [sections, total] = await Promise.all([
    db.section.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ class: { displayOrder: 'asc' } }, { name: 'asc' }],
      include: { class: { select: { id: true, name: true } } },
    }),
    db.section.count({ where }),
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

export async function getSectionById(db: any, id: string) {
  const section = await db.section.findFirst({
    where: { id },
    include: { class: { select: { id: true, name: true } } },
  })
  if (!section) throw new NotFoundError('Section not found')
  return section
}

// ─── Create ───────────────────────────────────────────────────

export async function createSection(db: any, data: CreateSectionInput) {
  // Ensure the parent class exists
  const parentClass = await db.class.findFirst({ where: { id: data.classId } })
  if (!parentClass) throw new NotFoundError('Class not found')

  // Unique constraint: section name must be unique within the class
  const duplicate = await db.section.findFirst({
    where: { classId: data.classId, name: data.name },
  })
  if (duplicate) {
    throw new ConflictError(`Section "${data.name}" already exists in this class`)
  }

  return db.section.create({
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

export async function updateSection(db: any, id: string, data: UpdateSectionInput) {
  const section = await getSectionById(db, id)

  const resolvedClassId = data.classId ?? section.classId
  const resolvedName = data.name ?? section.name

  // If class or name changes, check uniqueness
  if (data.name || data.classId) {
    const duplicate = await db.section.findFirst({
      where: { classId: resolvedClassId, name: resolvedName, NOT: { id } },
    })
    if (duplicate) {
      throw new ConflictError(`Section "${resolvedName}" already exists in this class`)
    }
  }

  // If classId changing, verify the new class exists
  if (data.classId && data.classId !== section.classId) {
    const parentClass = await db.class.findFirst({ where: { id: data.classId } })
    if (!parentClass) throw new NotFoundError('Class not found')
  }

  return db.section.update({
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

export async function deleteSection(db: any, id: string) {
  await getSectionById(db, id)
  return db.section.delete({ where: { id } })
}
