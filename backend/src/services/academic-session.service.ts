/**
 * Academic Session Service
 *
 * All business logic for academic sessions lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * @module services/academic-session
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateAcademicSessionInput,
  UpdateAcademicSessionInput,
  ListAcademicSessionsInput,
} from '../validators/academic-session.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listAcademicSessions(filters: ListAcademicSessionsInput) {
  const { page, limit, search, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [sessions, total] = await Promise.all([
    prisma.academicSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    }),
    prisma.academicSession.count({ where }),
  ])

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getAcademicSessionById(id: string) {
  const session = await prisma.academicSession.findUnique({ where: { id } })
  if (!session) throw new NotFoundError(`Academic session not found`)
  return session
}

// ─── Get Active ───────────────────────────────────────────────

export async function getActiveAcademicSession() {
  const session = await prisma.academicSession.findFirst({ where: { isActive: true } })
  return session // May be null if none is active
}

// ─── Create ───────────────────────────────────────────────────

export async function createAcademicSession(data: CreateAcademicSessionInput) {
  // Check for duplicate name
  const existing = await prisma.academicSession.findUnique({ where: { name: data.name } })
  if (existing) throw new ConflictError(`Academic session "${data.name}" already exists`)

  // If setting as active, deactivate all others first
  if (data.isActive) {
    await prisma.academicSession.updateMany({ data: { isActive: false } })
  }

  return prisma.academicSession.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive ?? false,
    },
  })
}

// ─── Update ───────────────────────────────────────────────────

export async function updateAcademicSession(id: string, data: UpdateAcademicSessionInput) {
  // Ensure the session exists
  await getAcademicSessionById(id)

  // Check for duplicate name (exclude the current session)
  if (data.name) {
    const duplicate = await prisma.academicSession.findFirst({
      where: { name: data.name, NOT: { id } },
    })
    if (duplicate) throw new ConflictError(`Academic session "${data.name}" already exists`)
  }

  // If setting as active, deactivate all others first
  if (data.isActive === true) {
    await prisma.academicSession.updateMany({
      where: { NOT: { id } },
      data: { isActive: false },
    })
  }

  return prisma.academicSession.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
}

// ─── Set Active ───────────────────────────────────────────────

export async function setActiveAcademicSession(id: string) {
  await getAcademicSessionById(id)

  // Deactivate all, then activate the target — atomic via transaction
  return prisma.$transaction([
    prisma.academicSession.updateMany({ data: { isActive: false } }),
    prisma.academicSession.update({ where: { id }, data: { isActive: true } }),
  ])
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteAcademicSession(id: string) {
  const session = await getAcademicSessionById(id)

  if (session.isActive) {
    throw new ConflictError(
      'Cannot delete the active academic session. Set another session as active first.'
    )
  }

  return prisma.academicSession.delete({ where: { id } })
}

// ─── Stats ────────────────────────────────────────────────────

export async function getAcademicSessionCount() {
  return prisma.academicSession.count()
}
