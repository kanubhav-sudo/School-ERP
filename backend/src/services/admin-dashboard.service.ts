/**
 * Admin Dashboard Service
 *
 * Provides aggregated statistics for the admin dashboard.
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
