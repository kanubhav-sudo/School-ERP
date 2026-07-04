/**
 * Class Service
 *
 * Business logic for class (grade) management.
 *
 * @module services/class
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateClassInput,
  UpdateClassInput,
  ListClassesInput,
} from '../validators/class.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listClasses(filters: ListClassesInput) {
  const { page, limit, search, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { sections: true } } },
    }),
    prisma.class.count({ where }),
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

export async function getClassById(id: string) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: { sections: { orderBy: { name: 'asc' } }, _count: { select: { sections: true } } },
  })
  if (!cls) throw new NotFoundError('Class not found')
  return cls
}

// ─── Create ───────────────────────────────────────────────────

export async function createClass(data: CreateClassInput) {
  const existing = await prisma.class.findUnique({ where: { name: data.name } })
  if (existing) throw new ConflictError(`Class "${data.name}" already exists`)

  return prisma.class.create({
    data: {
      name: data.name,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  })
}

// ─── Update ───────────────────────────────────────────────────

export async function updateClass(id: string, data: UpdateClassInput) {
  await getClassById(id)

  if (data.name) {
    const duplicate = await prisma.class.findFirst({
      where: { name: data.name, NOT: { id } },
    })
    if (duplicate) throw new ConflictError(`Class "${data.name}" already exists`)
  }

  return prisma.class.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteClass(id: string) {
  const cls = await getClassById(id)

  // Prevent deletion if sections exist
  if (cls._count.sections > 0) {
    throw new ConflictError('Cannot delete a class that has sections. Remove the sections first.')
  }

  return prisma.class.delete({ where: { id } })
}
