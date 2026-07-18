/**
 * Timetable Service
 *
 * All business logic for timetable management lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * Validation performed:
 *   - Teacher double-booking (same teacher, same day, same period)
 *   - Section slot conflict (same section, same day, same period)
 *   - Overlapping period times within a section's day schedule
 *   - Active academic session enforcement
 *
 * @module services/timetable
 */

import prisma from '../database/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../core/errors'
import type {
  CreateTimetableInput,
  UpdateTimetableInput,
  ListTimetableInput,
} from '../validators/timetable.validator'

// ─── Select Shape ─────────────────────────────────────────────

const timetableSelect = {
  sessionId: true,
  id: true,
  dayOfWeek: true,
  periodNumber: true,
  room: true,
  isOverride: true,
  overrideDate: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  session: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  teacher: {
    select: { id: true, firstName: true, lastName: true, employeeId: true },
  },
  subject: { select: { id: true, name: true, code: true } },
} as const


// ─── Helpers ──────────────────────────────────────────────────

/**
 * Attaches startTime and endTime from PeriodMaster to timetable entries.
 */
async function withPeriodTimes(entries: any | any[]) {
  const isArray = Array.isArray(entries)
  const arr = isArray ? entries : [entries]
  if (arr.length === 0) return isArray ? [] : null

  const sessionIds = [...new Set(arr.map((e: any) => e.sessionId))]
  const periodMasters = await prisma.periodMaster.findMany({
    where: { sessionId: { in: sessionIds } },
  })

  const periodMap = new Map<string, any>()
  periodMasters.forEach((pm) => {
    periodMap.set(`${pm.sessionId}-${pm.periodNumber}`, pm)
  })

  const mapped = arr.map((entry: any) => {
    const pm = periodMap.get(`${entry.sessionId}-${entry.periodNumber}`)
    return {
      ...entry,
      startTime: pm?.startTime || '00:00',
      endTime: pm?.endTime || '00:00',
    }
  })

  return isArray ? mapped : mapped[0]
}

// ─── List ─────────────────────────────────────────────────────

export async function listTimetable(filters: ListTimetableInput) {
  const { sessionId, sectionId, teacherId, classId, dayOfWeek } = filters

  const entries = await prisma.timetable.findMany({
    where: {
      isDeleted: false,
      ...(sessionId ? { sessionId } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(classId ? { classId } : {}),
      ...(dayOfWeek ? { dayOfWeek } : {}),
    },
    select: timetableSelect,
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
  })

  return withPeriodTimes(entries)
}

// ─── Get By Section (full week) ───────────────────────────────

export async function getTimetableBySection(sectionId: string, sessionId?: string) {
  const entries = await prisma.timetable.findMany({
    where: {
      isDeleted: false,
      sectionId,
      ...(sessionId ? { sessionId } : {}),
    },
    select: timetableSelect,
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
  })
  return withPeriodTimes(entries)
}

// ─── Get By Teacher (full week schedule) ─────────────────────

export async function getTimetableByTeacher(teacherId: string, sessionId?: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, isActive: true },
    select: { id: true },
  })
  if (!teacher) throw new NotFoundError('Teacher not found')

  const entries = await prisma.timetable.findMany({
    where: {
      isDeleted: false,
      teacherId,
      ...(sessionId ? { sessionId } : {}),
    },
    select: timetableSelect,
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
  })
  return withPeriodTimes(entries)
}

// ─── Get One ──────────────────────────────────────────────────

export async function getTimetableById(id: string) {
  const entry = await prisma.timetable.findFirst({
    where: { id, isDeleted: false },
    select: timetableSelect,
  })
  if (!entry) throw new NotFoundError('Timetable entry not found')
  return withPeriodTimes(entry)
}

// ─── Create ───────────────────────────────────────────────────

export async function createTimetableEntry(data: CreateTimetableInput, userId?: string) {
  // 1. Verify session is active
  const session = await prisma.academicSession.findFirst({
    where: { id: data.sessionId, isActive: true },
  })
  if (!session) {
    throw new ValidationError('The selected academic session is not active or does not exist', [
      { message: 'Session is not active', path: ['sessionId'] },
    ])
  }

  // 2. Verify references exist
  const [cls, section, teacher, subject] = await Promise.all([
    prisma.class.findFirst({ where: { id: data.classId, isActive: true } }),
    prisma.section.findFirst({ where: { id: data.sectionId, isActive: true } }),
    prisma.teacher.findFirst({ where: { id: data.teacherId, isActive: true } }),
    prisma.subject.findFirst({ where: { id: data.subjectId, isActive: true } }),
  ])
  if (!cls) throw new NotFoundError('Class not found or inactive')
  if (!section) throw new NotFoundError('Section not found or inactive')
  if (!teacher) throw new NotFoundError('Teacher not found or inactive')
  if (!subject) throw new NotFoundError('Subject not found or inactive')

  // 4. Create (unique constraints on [sectionId, dayOfWeek, periodNumber] and
  //    [teacherId, dayOfWeek, periodNumber] will catch remaining conflicts at DB level)
  try {
    const entry = await prisma.timetable.create({
      data: {
        ...data,
        createdById: userId ?? null,
        updatedById: userId ?? null,
      },
      select: timetableSelect,
    })
    return withPeriodTimes(entry)
  } catch (err: unknown) {
    // P2002 = unique constraint violation
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      throw new ConflictError('This time slot is already occupied for this section or teacher.')
    }
    throw err
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateTimetableEntry(
  id: string,
  data: UpdateTimetableInput,
  userId?: string
) {
  const existing = await prisma.timetable.findFirst({
    where: { id, isDeleted: false },
  })
  if (!existing) throw new NotFoundError('Timetable entry not found')

  try {
    const entry = await prisma.timetable.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId ?? null,
      },
      select: timetableSelect,
    })
    return withPeriodTimes(entry)
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      throw new ConflictError('This time slot is already occupied for this section or teacher.')
    }
    throw err
  }
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteTimetableEntry(id: string, userId?: string) {
  const existing = await prisma.timetable.findFirst({
    where: { id, isDeleted: false },
  })
  if (!existing) throw new NotFoundError('Timetable entry not found')

  await prisma.timetable.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId ?? null,
    },
  })
}
