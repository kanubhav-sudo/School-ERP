/**
 * Academic Session Service
 *
 * All business logic for academic sessions lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * @module services/academic-session
 */

import { ConflictError, NotFoundError } from '../core/errors'
import type {
  CreateAcademicSessionInput,
  UpdateAcademicSessionInput,
  ListAcademicSessionsInput,
} from '../validators/academic-session.validator'

// ─── List ─────────────────────────────────────────────────────

export async function listAcademicSessions(db: any, filters: ListAcademicSessionsInput) {
  const { page, limit, search, isActive } = filters

  const skip = (page - 1) * limit

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [sessions, total] = await Promise.all([
    db.academicSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    }),
    db.academicSession.count({ where }),
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

export async function getAcademicSessionById(db: any, id: string) {
  const session = await db.academicSession.findFirst({ where: { id } })
  if (!session) throw new NotFoundError(`Academic session not found`)
  return session
}

// ─── Get Active ───────────────────────────────────────────────

export async function getActiveAcademicSession(db: any) {
  const session = await db.academicSession.findFirst({ where: { isActive: true } })
  return session // May be null if none is active
}

// ─── Create ───────────────────────────────────────────────────

export async function createAcademicSession(db: any, data: CreateAcademicSessionInput) {
  // Check for duplicate name (case-insensitive)
  const existing = await db.academicSession.findFirst({
    where: { name: { equals: data.name, mode: 'insensitive' } },
  })
  if (existing) throw new ConflictError(`Academic session "${data.name}" already exists`)

  // If setting as active, deactivate all others first
  if (data.isActive) {
    await db.academicSession.updateMany({ data: { isActive: false } })
  }

  try {
    return await db.academicSession.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? false,
      },
    })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new ConflictError(`Academic session "${data.name}" already exists`)
    }
    throw err
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateAcademicSession(db: any, id: string, data: UpdateAcademicSessionInput) {
  // Ensure the session exists
  await getAcademicSessionById(db, id)

  // Check for duplicate name (case-insensitive, exclude current session)
  if (data.name) {
    const duplicate = await db.academicSession.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' }, NOT: { id } },
    })
    if (duplicate) throw new ConflictError(`Academic session "${data.name}" already exists`)
  }

  // If setting as active, deactivate all others first
  if (data.isActive === true) {
    await db.academicSession.updateMany({
      where: { NOT: { id } },
      data: { isActive: false },
    })
  }

  try {
    return await db.academicSession.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new ConflictError(`Academic session "${data.name}" already exists`)
    }
    throw err
  }
}

// ─── Set Active ───────────────────────────────────────────────

export async function setActiveAcademicSession(db: any, id: string) {
  await getAcademicSessionById(db, id)

  // Deactivate all, then activate target
  await db.academicSession.updateMany({ data: { isActive: false } })
  return db.academicSession.update({ where: { id }, data: { isActive: true } })
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteAcademicSession(db: any, id: string) {
  const session = await getAcademicSessionById(db, id)

  if (session.isActive) {
    throw new ConflictError(
      'Cannot delete the active academic session. Set another session as active first.'
    )
  }

  return db.academicSession.delete({ where: { id } })
}

// ─── Stats ────────────────────────────────────────────────────

export async function getAcademicSessionCount(db: any) {
  return db.academicSession.count()
}
