/**
 * Fee Plan Service
 *
 * All business logic for fee plan management lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * MONETARY CONVENTION:
 *   - API inputs: whole rupees (integer)
 *   - Database storage: paise (multiply by 100)
 *   - API outputs: paise (frontend divides by 100 for display)
 *
 * @module services/fee-plan
 */

import { prisma } from '../database'
import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateFeePlanInput,
  UpdateFeePlanInput,
  ListFeePlansInput,
} from '../validators/fee-plan.validator'

// ─── Fee Plan Select Shape ─────────────────────────────────────

const feePlanSelect = {
  id: true,
  name: true,
  type: true,
  sessionId: true,
  classId: true,
  monthlyAmount: true,
  discountAmount: true,
  discountPercent: true,
  description: true,
  isActive: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  session: { select: { id: true, name: true, isActive: true } },
  class: { select: { id: true, name: true } },
  _count: { select: { students: true } },
} as const

// ─── List ──────────────────────────────────────────────────────

export async function listFeePlans(filters: ListFeePlansInput) {
  const { page, limit, sessionId, classId, type, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    isDeleted: false,
    ...(sessionId ? { sessionId } : {}),
    ...(classId ? { classId } : {}),
    ...(type ? { type } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [feePlans, total] = await Promise.all([
    prisma.feePlan.findMany({
      where,
      select: feePlanSelect,
      skip,
      take: limit,
      orderBy: [{ session: { name: 'desc' } }, { class: { displayOrder: 'asc' } }, { name: 'asc' }],
    }),
    prisma.feePlan.count({ where }),
  ])

  return {
    feePlans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getFeePlanById(id: string) {
  const feePlan = await prisma.feePlan.findFirst({
    where: { id, isDeleted: false },
    select: feePlanSelect,
  })
  if (!feePlan) throw new NotFoundError('Fee plan not found')
  return feePlan
}

// ─── Create ───────────────────────────────────────────────────

export async function createFeePlan(data: CreateFeePlanInput, actorId: string) {
  // Check for duplicate name within same session + class
  const existing = await prisma.feePlan.findFirst({
    where: {
      name: data.name,
      sessionId: data.sessionId,
      classId: data.classId,
      isDeleted: false,
    },
  })
  if (existing) {
    throw new ConflictError(
      `A fee plan named "${data.name}" already exists for this class and session`
    )
  }

  // Convert rupees to paise for storage
  const feePlan = await prisma.feePlan.create({
    data: {
      name: data.name,
      type: data.type,
      sessionId: data.sessionId,
      classId: data.classId,
      monthlyAmount: data.monthlyAmount * 100, // rupees → paise
      discountAmount: (data.discountAmount ?? 0) * 100, // rupees → paise
      discountPercent: data.discountPercent ?? 0,
      description: data.description,
      isActive: data.isActive ?? true,
      createdById: actorId,
    },
    select: feePlanSelect,
  })

  return feePlan
}

// ─── Update ───────────────────────────────────────────────────

export async function updateFeePlan(id: string, data: UpdateFeePlanInput, actorId: string) {
  await getFeePlanById(id)

  // If name + session + class is changing, check for duplicate
  if (data.name || data.sessionId || data.classId) {
    const current = await prisma.feePlan.findUnique({ where: { id } })
    const checkName = data.name ?? current!.name
    const checkSessionId = data.sessionId ?? current!.sessionId
    const checkClassId = data.classId ?? current!.classId

    const dup = await prisma.feePlan.findFirst({
      where: {
        name: checkName,
        sessionId: checkSessionId,
        classId: checkClassId,
        isDeleted: false,
        NOT: { id },
      },
    })
    if (dup) {
      throw new ConflictError(
        `A fee plan named "${checkName}" already exists for this class and session`
      )
    }
  }

  return prisma.feePlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.sessionId !== undefined && { sessionId: data.sessionId }),
      ...(data.classId !== undefined && { classId: data.classId }),
      ...(data.monthlyAmount !== undefined && { monthlyAmount: data.monthlyAmount * 100 }),
      ...(data.discountAmount !== undefined && { discountAmount: data.discountAmount * 100 }),
      ...(data.discountPercent !== undefined && { discountPercent: data.discountPercent }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedById: actorId,
    },
    select: feePlanSelect,
  })
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteFeePlan(id: string, actorId: string) {
  await getFeePlanById(id)

  // Prevent deletion if active students are assigned to this plan
  const assignedCount = await prisma.student.count({
    where: { feePlanId: id, deletedAt: null },
  })
  if (assignedCount > 0) {
    throw new ConflictError(
      `Cannot delete fee plan: ${assignedCount} student(s) are assigned to this plan. Remove assignments first.`
    )
  }

  return prisma.feePlan.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: actorId,
      isActive: false,
    },
  })
}
