/**
 * Admin Dashboard Service
 *
 * Provides aggregated statistics, birthday data for the admin dashboard.
 * All queries are independent and failures are handled gracefully.
 *
 * @module services/admin-dashboard
 */

import { getElapsedAcademicMonths } from './fee-record.service'

export async function getDashboardStats(db: any) {
  // Run each count independently to isolate failures
  const [totalStudents, totalTeachers, totalClasses, totalSections, activeSession, activeNotices] =
    await Promise.all([
      db.student.count({ where: { isActive: true, deletedAt: null } }).catch(() => 0),
      db.teacher.count({ where: { isActive: true, deletedAt: null } }).catch(() => 0),
      db.class.count({ where: { isActive: true } }).catch(() => 0),
      db.section.count({ where: { isActive: true } }).catch(() => 0),
      db.academicSession
        .findFirst({
          where: { isActive: true },
          select: { id: true, name: true },
        })
        .catch(() => null),
      db.notice
        .count({
          where: {
            isDeleted: false,
            OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
          },
        })
        .catch(() => 0),
    ])

  let totalPendingFees = 0
  let totalCollectedFees = 0
  let todaysAttendance = 0

  if (activeSession) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const elapsedMonths = getElapsedAcademicMonths(today)

    const [pendingFeeStats, collectedFeeStats, attendanceCount] = await Promise.all([
      db.feeRecord
        .aggregate({
          where: {
            sessionId: activeSession.id,
            month: { in: elapsedMonths },
          },
          _sum: {
            balanceAmount: true,
          },
        })
        .catch(() => null),
      db.feeRecord
        .aggregate({
          where: {
            sessionId: activeSession.id,
          },
          _sum: {
            paidAmount: true,
          },
        })
        .catch(() => null),
      db.attendance
        .count({
          where: {
            date: today,
            isDeleted: false,
          },
        })
        .catch(() => 0),
    ])

    if (pendingFeeStats?._sum) {
      totalPendingFees = Number(pendingFeeStats._sum.balanceAmount ?? 0)
    }
    if (collectedFeeStats?._sum) {
      totalCollectedFees = Number(collectedFeeStats._sum.paidAmount ?? 0)
    }
    todaysAttendance = attendanceCount
  }

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSections,
    totalPendingFees,
    totalCollectedFees,
    todaysAttendance,
    activeNotices,
    activeSessionName: activeSession?.name ?? 'No Active Session',
  }
}

// ─── Birthday Helpers ──────────────────────────────────────────

/**
 * Build a date-range window for today or next N days
 * using MM-DD comparison (ignores year — birthday recurs annually).
 * Returns an array of MM-DD strings.
 */
function buildBirthdayMDRange(startOffset: number, endOffset: number): string[] {
  const dates: string[] = []
  for (let i = startOffset; i <= endOffset; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates.push(`${mm}-${dd}`)
  }
  return dates
}

/**
 * Filter people whose dateOfBirth MM-DD falls within the given MD strings.
 */
function matchesBirthdayMD(dateOfBirth: Date | null | undefined, mdSet: string[]): boolean {
  if (!dateOfBirth) return false
  const mm = String(dateOfBirth.getMonth() + 1).padStart(2, '0')
  const dd = String(dateOfBirth.getDate()).padStart(2, '0')
  return mdSet.includes(`${mm}-${dd}`)
}

// ─── Today's Birthdays ─────────────────────────────────────────

export async function getTodaysBirthdays(db: any) {
  const todayMD = buildBirthdayMDRange(0, 0)

  const [students, teachers] = await Promise.all([
    db.student.findMany({
      where: { isActive: true, deletedAt: null, dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
    }),
    db.teacher.findMany({
      where: { isActive: true, deletedAt: null, dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        designation: true,
      },
    }),
  ])

  const birthdayStudents = students
    .filter((s: any) => matchesBirthdayMD(s.dateOfBirth, todayMD))
    .map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      role: 'STUDENT' as const,
      class: s.class ? `${s.class.name}${s.section ? ` - ${s.section.name}` : ''}` : null,
      designation: null,
      dateOfBirth: s.dateOfBirth,
    }))

  const birthdayTeachers = teachers
    .filter((t: any) => matchesBirthdayMD(t.dateOfBirth, todayMD))
    .map((t: any) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      role: 'TEACHER' as const,
      class: null,
      designation: t.designation,
      dateOfBirth: t.dateOfBirth,
    }))

  return [...birthdayStudents, ...birthdayTeachers]
}

// ─── Upcoming Birthdays (Next 7 Days, Excludes Today) ─────────

export async function getUpcomingBirthdays(db: any) {
  const upcomingMDs = buildBirthdayMDRange(1, 7)

  const [students, teachers] = await Promise.all([
    db.student.findMany({
      where: { isActive: true, deletedAt: null, dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
    }),
    db.teacher.findMany({
      where: { isActive: true, deletedAt: null, dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        designation: true,
      },
    }),
  ])

  const upcoming = [
    ...students
      .filter((s: any) => matchesBirthdayMD(s.dateOfBirth, upcomingMDs))
      .map((s: any) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        role: 'STUDENT' as const,
        class: s.class ? `${s.class.name}${s.section ? ` - ${s.section.name}` : ''}` : null,
        designation: null,
        dateOfBirth: s.dateOfBirth,
      })),
    ...teachers
      .filter((t: any) => matchesBirthdayMD(t.dateOfBirth, upcomingMDs))
      .map((t: any) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        role: 'TEACHER' as const,
        class: null,
        designation: t.designation,
        dateOfBirth: t.dateOfBirth,
      })),
  ]

  // Sort by days until birthday
  return upcoming.sort((a, b) => {
    const daysA = getDaysUntilBirthday(a.dateOfBirth)
    const daysB = getDaysUntilBirthday(b.dateOfBirth)
    return daysA - daysB
  })
}

function getDaysUntilBirthday(dob: Date): number {
  const today = new Date()
  const birthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
  if (birthday < today) birthday.setFullYear(today.getFullYear() + 1)
  const diffMs = birthday.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
