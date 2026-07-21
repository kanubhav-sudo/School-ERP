/**
 * Admin Dashboard Service
 *
 * Provides aggregated statistics for the admin dashboard.
 * All queries are independent and failures are handled gracefully.
 *
 * @module services/admin-dashboard
 */

import prisma from '../database/prisma'

export async function getDashboardStats() {
  // Run each count independently to isolate failures
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSections,
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true, deletedAt: null } }).catch(() => 0),
    prisma.teacher.count({ where: { isActive: true, deletedAt: null } }).catch(() => 0),
    prisma.class.count({ where: { isActive: true } }).catch(() => 0),
    prisma.section.count({ where: { isActive: true } }).catch(() => 0),
  ])

  // Get current active session
  const activeSession = await prisma.academicSession.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  }).catch(() => null)

  // Count active notices
  const activeNotices = await prisma.notice.count({
    where: {
      isDeleted: false,
      OR: [
        { expiresAt: { gt: new Date() } },
        { expiresAt: null },
      ],
    },
  }).catch(() => 0)

  let totalPendingFees = 0
  let totalCollectedFees = 0
  let todaysAttendance = 0

  if (activeSession) {
    // Fee aggregation
    try {
      const feeStats = await prisma.feeRecord.aggregate({
        where: { sessionId: activeSession.id },
        _sum: {
          balanceAmount: true,
          paidAmount: true,
        },
      })
      totalPendingFees = Number(feeStats._sum.balanceAmount ?? 0)
      totalCollectedFees = Number(feeStats._sum.paidAmount ?? 0)
    } catch {
      // Fee aggregation failed — leave at 0
    }

    // Today's attendance count
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      todaysAttendance = await prisma.attendance.count({
        where: {
          date: today,
          isDeleted: false,
        },
      })
    } catch {
      // Attendance count failed — leave at 0
    }
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
