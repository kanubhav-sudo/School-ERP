/**
 * Class Service
 *
 * Business logic for class (grade) management.
 *
 * @module services/class
 */

import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateClassInput,
  UpdateClassInput,
  ListClassesInput,
} from '../validators/class.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listClasses(db: any, filters: ListClassesInput) {
  const { page, limit, search, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [classes, total] = await Promise.all([
    db.class.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { sections: true } } },
    }),
    db.class.count({ where }),
  ])

  return {
    classes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getClassById(db: any, id: string) {
  const cls = await db.class.findFirst({
    where: { id },
    include: { sections: { orderBy: { name: 'asc' } }, _count: { select: { sections: true } } },
  })
  if (!cls) throw new NotFoundError('Class not found')
  return cls
}

// ─── Create ───────────────────────────────────────────────────

export async function createClass(db: any, data: CreateClassInput) {
  const existing = await db.class.findFirst({ where: { name: data.name } })
  if (existing) throw new ConflictError(`Class "${data.name}" already exists`)

  return db.class.create({
    data: {
      name: data.name,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  })
}

// ─── Update ───────────────────────────────────────────────────

export async function updateClass(db: any, id: string, data: UpdateClassInput) {
  await getClassById(db, id)

  if (data.name) {
    const duplicate = await db.class.findFirst({
      where: { name: data.name, NOT: { id } },
    })
    if (duplicate) throw new ConflictError(`Class "${data.name}" already exists`)
  }

  return db.class.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteClass(db: any, id: string) {
  const cls = await getClassById(db, id)

  // Prevent deletion if sections exist
  if (cls._count.sections > 0) {
    throw new ConflictError('Cannot delete a class that has sections. Remove the sections first.')
  }

  return db.class.delete({ where: { id } })
}
