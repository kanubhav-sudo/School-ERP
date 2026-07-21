import prisma from '../database/prisma'

export async function getDashboardStats() {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSections,
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true, deletedAt: null } }),
    prisma.teacher.count({ where: { isActive: true, deletedAt: null } }),
    prisma.class.count({ where: { isActive: true } }),
    prisma.section.count({ where: { isActive: true } })
  ])

  // Get current active session
  const activeSession = await prisma.academicSession.findFirst({
    where: { isActive: true },
  })

  let totalPendingFees = 0
  let totalCollectedFees = 0
  let todaysAttendance = 0
  const activeNotices = await prisma.notice.count({
    where: {
      isDeleted: false,
      OR: [
        { expiresAt: { gt: new Date() } },
        { expiresAt: null }
      ]
    }
  })

  if (activeSession) {
    const feeStats = await prisma.feeRecord.aggregate({
      where: { sessionId: activeSession.id },
      _sum: {
        balanceAmount: true,
        paidAmount: true,
      }
    })
    totalPendingFees = feeStats._sum.balanceAmount || 0
    totalCollectedFees = feeStats._sum.paidAmount || 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    todaysAttendance = await prisma.attendance.count({
      where: {
        date: today,
        isDeleted: false,
      }
    })
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
    activeSessionName: activeSession?.name || 'No Active Session',
  }
}
