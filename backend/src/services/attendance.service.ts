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

  // Guard: authenticated routes always have userId; defensive check
  if (!userId) {
    throw new ValidationError('Authentication required to mark attendance', [
      { message: 'User ID is required', path: ['userId'] },
    ])
  }

  // 3. Upsert the parent Attendance row
  const attendance = await prisma.attendance.upsert({
    where: {
      sectionId_date: { sectionId, date: parsedDate },
    },
    create: {
      date: parsedDate,
      sectionId,
      recordedById: userId,
      createdById: userId,
      updatedById: userId,
    },
    update: {
      recordedById: userId,
      updatedById: userId,
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

// ─── Attendance Summary ───────────────────────────────────────

/**
 * Return per-student attendance summary for a section between startDate and endDate.
 * Counts occurrences of each status for each student.
 */
export async function getAttendanceSummary(
  sectionId: string,
  startDate?: string,
  endDate?: string
) {
  // Verify section exists
  const section = await prisma.section.findFirst({
    where: { id: sectionId, isActive: true },
    select: { id: true, name: true },
  })
  if (!section) throw new NotFoundError('Section not found or inactive')

  const whereDate: Record<string, Date> = {}
  if (startDate) whereDate.gte = parseDate(startDate)
  if (endDate) whereDate.lte = parseDate(endDate)

  // Fetch all records for all attendance sheets in the section+date range
  const records = await prisma.attendanceRecord.findMany({
    where: {
      attendance: {
        sectionId,
        isDeleted: false,
        ...(Object.keys(whereDate).length > 0 ? { date: whereDate } : {}),
      },
    },
    select: {
      status: true,
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
  })

  // Aggregate per-student
  const summaryMap = new Map<
    string,
    {
      student: {
        id: string
        firstName: string
        lastName: string
        admissionNumber: string
        rollNumber: string | null
      }
      PRESENT: number
      ABSENT: number
      LATE: number
      HALF_DAY: number
      total: number
    }
  >()

  for (const record of records) {
    const { student, status } = record
    if (!summaryMap.has(student.id)) {
      summaryMap.set(student.id, {
        student,
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        HALF_DAY: 0,
        total: 0,
      })
    }
    const entry = summaryMap.get(student.id)!
    entry[status as 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'] += 1
    entry.total += 1
  }

  return {
    section,
    summary: Array.from(summaryMap.values()).sort((a, b) =>
      (a.student.rollNumber ?? '').localeCompare(b.student.rollNumber ?? '')
    ),
  }
}
