/**
 * Student Portal Service
 *
 * Provides data fetching logic for the Student Portal.
 */

import prisma from '../database/prisma'
import { NotFoundError } from '../core/errors'

const MONTH_LABELS: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  6: 'June', 7: 'July', 8: 'August', 9: 'September',
  10: 'October', 11: 'November', 12: 'December'
}

function getMonthLabel(month: number): string {
  return MONTH_LABELS[month] || `Month ${month}`
}

export async function getStudentByUserId(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      session: true,
      class: true,
      section: true,
      feePlan: true,
    }
  })
  if (!student) {
    throw new NotFoundError('Student profile not found')
  }
  return student
}

export async function getDashboardData(userId: string) {
  const student = await getStudentByUserId(userId)
  
  // Attendance
  const totalDays = await prisma.attendanceRecord.count({
    where: { studentId: student.id }
  })
  const presentDays = await prisma.attendanceRecord.count({
    where: { studentId: student.id, status: 'PRESENT' }
  })
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

  // Fees
  const feesDue = await prisma.feeRecord.aggregate({
    where: { studentId: student.id, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
    _sum: { balanceAmount: true }
  })
  
  const nextPendingFee = await prisma.feeRecord.findFirst({
    where: { studentId: student.id, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
    orderBy: [ { year: 'asc' }, { month: 'asc' } ]
  })

  // Upcoming Exams
  const upcomingExams = await prisma.exam.count({
    where: { sessionId: student.sessionId! }
  })

  // Pending Assignments (homework assigned to student's section, not yet submitted)
  const sectionHomework = await prisma.homework.findMany({
    where: { sectionId: student.sectionId!, status: 'PUBLISHED' },
    select: { id: true }
  })
  const homeworkIds = sectionHomework.map(h => h.id)
  const submittedCount = homeworkIds.length > 0
    ? await prisma.homeworkSubmission.count({
        where: { studentId: student.id, homeworkId: { in: homeworkIds }, status: { in: ['SUBMITTED', 'GRADED'] } }
      })
    : 0
  const pendingAssignments = homeworkIds.length - submittedCount

  // Today's Timetable
  const today = new Date().getDay()
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const todayEnum = days[today] as any

  const todayTimetable = await prisma.timetable.findMany({
    where: { sectionId: student.sectionId!, dayOfWeek: todayEnum },
    include: { subject: true, teacher: true },
    orderBy: { periodNumber: 'asc' }
  })

  // Notice
  const latestNotice = await prisma.notice.findFirst({
    where: {
      isDeleted: false,
      OR: [
        { targetRoles: { has: 'STUDENT' } },
        { targetRoles: { isEmpty: true } }
      ],
      // We could add class filter if needed
    },
    orderBy: { publishedAt: 'desc' }
  })

  return {
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      className: student.class?.name || 'N/A',
      sectionName: student.section?.name || 'N/A',
      sessionName: student.session?.name || 'N/A',
      photoUrl: student.photoUrl,
    },
    stats: {
      attendancePercentage,
      presentDays,
      absentDays: totalDays - presentDays,
      upcomingExams,
      pendingAssignments,
      pendingFeeAmount: (feesDue._sum.balanceAmount || 0) / 100, // convert paise to unit
      pendingFromMonth: nextPendingFee ? `${getMonthLabel(nextPendingFee.month)} ${nextPendingFee.year}` : null
    },
    todayTimetable: todayTimetable.map(t => ({
      periodNumber: t.periodNumber,
      subjectName: t.subject.name,
      teacherName: `${t.teacher.firstName} ${t.teacher.lastName}`
    })),
    latestNotice
  }
}

export async function getMyProfile(userId: string) {
  const student = await getStudentByUserId(userId)
  return student
}

export async function getAttendance(userId: string) {
  const student = await getStudentByUserId(userId)
  
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id },
    include: { attendance: true },
    orderBy: { attendance: { date: 'desc' } }
  })

  const total = records.length
  const present = records.filter(r => r.status === 'PRESENT').length
  const percentage = total > 0 ? Math.round((present / total) * 100) : 100

  return {
    records,
    summary: { total, present, percentage }
  }
}

export async function getTimetable(userId: string) {
  const student = await getStudentByUserId(userId)

  const timetables = await prisma.timetable.findMany({
    where: { sectionId: student.sectionId! },
    include: { subject: true, teacher: true },
    orderBy: [ { dayOfWeek: 'asc' }, { periodNumber: 'asc' } ]
  })
  
  const periods = await prisma.periodMaster.findMany({
    where: { sessionId: student.sessionId! },
    orderBy: { periodNumber: 'asc' }
  })

  return { timetables, periods }
}

export async function getFees(userId: string) {
  const student = await getStudentByUserId(userId)

  const records = await prisma.feeRecord.findMany({
    where: { studentId: student.id },
    include: { feePlan: true },
    orderBy: [ { year: 'asc' }, { month: 'asc' } ]
  })
  
  let totalFees = 0
  let paidAmount = 0
  let pendingAmount = 0
  
  records.forEach(r => {
    totalFees += r.netAmount
    paidAmount += r.paidAmount
    pendingAmount += r.balanceAmount
  })

  return {
    summary: {
      totalFees: totalFees / 100,
      paidAmount: paidAmount / 100,
      pendingAmount: pendingAmount / 100
    },
    records
  }
}

export async function getNotices(_userId: string) {
  return prisma.notice.findMany({
    where: {
      isDeleted: false,
      OR: [
        { targetRoles: { has: 'STUDENT' } },
        { targetRoles: { isEmpty: true } } // All roles
      ]
    },
    orderBy: { publishedAt: 'desc' }
  })
}

export async function getAnnouncements(userId: string) {
  const student = await getStudentByUserId(userId)
  
  return prisma.announcement.findMany({
    where: {
      sectionId: student.sectionId!
    },
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  })
}

export async function getExams(userId: string) {
  const student = await getStudentByUserId(userId)
  
  const exams = await prisma.exam.findMany({
    where: { sessionId: student.sessionId! },
    orderBy: { createdAt: 'desc' }
  })
  
  const reportCards = await prisma.reportCard.findMany({
    where: { studentId: student.id },
    include: { exam: true },
    orderBy: { createdAt: 'desc' }
  })
  
  const admitCards = await prisma.admitCard.findMany({
    where: { studentId: student.id },
    include: { session: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return { exams, reportCards, admitCards }
}

export async function getHomework(userId: string) {
  const student = await getStudentByUserId(userId)
  
  // Only show PUBLISHED homework for student's section
  const homeworks = await prisma.homework.findMany({
    where: { sectionId: student.sectionId!, status: 'PUBLISHED' },
    include: { subject: true, teacher: true, class: true, section: true },
    orderBy: { dueDate: 'asc' }
  })
  
  // Get student's submissions
  const submissions = await prisma.homeworkSubmission.findMany({
    where: { studentId: student.id }
  })
  
  // Map submissions to homeworks
  const result = homeworks.map(hw => {
    const submission = submissions.find(s => s.homeworkId === hw.id)
    return {
      ...hw,
      submissionStatus: submission?.status || 'ASSIGNED',
      submissionRemarks: submission?.remarks || null,
      submissionUrl: submission?.submissionUrl || null,
      submittedAt: submission?.submittedAt || null,
      submissionId: submission?.id || null
    }
  })
  
  return result
}
