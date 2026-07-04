/**
 * Attendance Service
 *
 * All business logic for attendance management lives here.
 * Controllers remain thin and delegate to these functions.
 *
 * Key design:
 *   - Attendance (parent) = one sheet per section per day.
 *   - AttendanceRecord (child) = one row per student.
 *   - markAttendance uses upsert on parent + upsertMany on children,
 *     so re-submitting the same day's attendance safely overwrites.
 *
 * @module services/attendance
 */

import prisma from '../database/prisma'
import { NotFoundError, ValidationError } from '../core/errors'
import type { MarkAttendanceInput, GetAttendanceInput } from '../validators/attendance.validator'

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD string into a Date object representing midnight UTC
 * for use with Prisma @db.Date fields.
 */
function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

// ─── Mark Attendance (Upsert) ─────────────────────────────────

export async function markAttendance(input: MarkAttendanceInput, userId?: string) {
  const { date, sectionId, records } = input

  // 1. Verify section exists
  const section = await prisma.section.findFirst({
    where: { id: sectionId, isActive: true },
    select: { id: true },
  })
  if (!section) {
    throw new NotFoundError('Section not found or inactive')
  }

  // 2. Verify all studentIds belong to the requested section and are active
  const studentIds = records.map((r) => r.studentId)
  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      sectionId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  })

  if (students.length !== studentIds.length) {
    const foundIds = new Set(students.map((s) => s.id))
    const invalidIds = studentIds.filter((id) => !foundIds.has(id))
    throw new ValidationError('Some student IDs are invalid or do not belong to this section', [
      {
        message: `Invalid student IDs: ${invalidIds.join(', ')}`,
        path: ['records'],
      },
    ])
  }

  const parsedDate = parseDate(date)

  // 3. Upsert the parent Attendance row
  const attendance = await prisma.attendance.upsert({
    where: {
      sectionId_date: { sectionId, date: parsedDate },
    },
    create: {
      date: parsedDate,
      sectionId,
      recordedById: userId ?? sectionId, // fallback; auth middleware ensures userId exists
      createdById: userId ?? null,
      updatedById: userId ?? null,
    },
    update: {
      recordedById: userId ?? sectionId,
      updatedById: userId ?? null,
      isDeleted: false,
      deletedAt: null,
      deletedById: null,
    },
    select: { id: true },
  })

  // 4. Upsert each child AttendanceRecord
  await Promise.all(
    records.map((record) =>
      prisma.attendanceRecord.upsert({
        where: {
          attendanceId_studentId: {
            attendanceId: attendance.id,
            studentId: record.studentId,
          },
        },
        create: {
          attendanceId: attendance.id,
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks ?? null,
        },
        update: {
          status: record.status,
          remarks: record.remarks ?? null,
        },
      })
    )
  )

  // 5. Return the full attendance sheet
  return getAttendanceSheet(sectionId, date)
}

// ─── Get Attendance ───────────────────────────────────────────

/**
 * Fetch a single attendance sheet for a section on a specific date,
 * including all student records. Returns null if not yet recorded.
 */
export async function getAttendanceSheet(sectionId: string, date: string) {
  const parsedDate = parseDate(date)

  const sheet = await prisma.attendance.findFirst({
    where: {
      sectionId,
      date: parsedDate,
      isDeleted: false,
    },
    select: {
      id: true,
      date: true,
      sectionId: true,
      recordedById: true,
      createdAt: true,
      updatedAt: true,
      section: { select: { id: true, name: true } },
      records: {
        select: {
          id: true,
          status: true,
          remarks: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
              rollNumber: true,
            },
          },
        },
        orderBy: [{ student: { rollNumber: 'asc' } }],
      },
    },
  })

  return sheet
}

/**
 * List attendance sheets for a section, optionally filtered by date.
 * Used by teachers/admins to see historical records.
 */
export async function listAttendance(filters: GetAttendanceInput) {
  const { sectionId, date } = filters

  const sheets = await prisma.attendance.findMany({
    where: {
      isDeleted: false,
      ...(sectionId ? { sectionId } : {}),
      ...(date ? { date: parseDate(date) } : {}),
    },
    select: {
      id: true,
      date: true,
      sectionId: true,
      recordedById: true,
      createdAt: true,
      updatedAt: true,
      section: { select: { id: true, name: true } },
      records: {
        select: {
          id: true,
          status: true,
          remarks: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
              rollNumber: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  })

  return sheets
}
