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
  
  const today = new Date().getDay()
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const todayEnum = days[today] as any

  const [
    totalDays,
    presentDays,
    feesDue,
    nextPendingFee,
    upcomingExams,
    sectionHomework,
    todayTimetable,
    latestNotice
  ] = await Promise.all([
    prisma.attendanceRecord.count({ where: { studentId: student.id } }),
    prisma.attendanceRecord.count({ where: { studentId: student.id, status: 'PRESENT' } }),
    prisma.feeRecord.aggregate({
      where: { studentId: student.id, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      _sum: { balanceAmount: true }
    }),
    prisma.feeRecord.findFirst({
      where: { studentId: student.id, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      orderBy: [ { year: 'asc' }, { month: 'asc' } ],
      select: { month: true, year: true }
    }),
    student.sessionId ? prisma.exam.count({ where: { sessionId: student.sessionId } }) : Promise.resolve(0),
    student.sectionId ? prisma.homework.findMany({
      where: { sectionId: student.sectionId, status: 'PUBLISHED' },
      select: { id: true }
    }) : Promise.resolve([]),
    student.sectionId ? prisma.timetable.findMany({
      where: { sectionId: student.sectionId, dayOfWeek: todayEnum },
      select: {
        periodNumber: true,
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } }
      },
      orderBy: { periodNumber: 'asc' }
    }) : Promise.resolve([]),
    prisma.notice.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { targetRoles: { has: 'STUDENT' } },
          { targetRoles: { isEmpty: true } },
          { targetRoles: { equals: [] } }
        ]
      },
      orderBy: { publishedAt: 'desc' }
    })
  ])

  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100
  const homeworkIds = sectionHomework.map(h => h.id)
  const submittedCount = homeworkIds.length > 0
    ? await prisma.homeworkSubmission.count({
        where: { studentId: student.id, homeworkId: { in: homeworkIds }, status: { in: ['SUBMITTED', 'GRADED'] } }
      })
    : 0
  const pendingAssignments = homeworkIds.length - submittedCount

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
      pendingFeeAmount: (feesDue._sum.balanceAmount || 0) / 100,
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

  const [timetables, periods] = await Promise.all([
    student.sectionId ? prisma.timetable.findMany({
      where: { sectionId: student.sectionId },
      select: {
        periodNumber: true,
        dayOfWeek: true,
        room: true,
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } }
      },
      orderBy: [ { dayOfWeek: 'asc' }, { periodNumber: 'asc' } ]
    }) : Promise.resolve([]),
    student.sessionId ? prisma.periodMaster.findMany({
      where: { sessionId: student.sessionId },
      orderBy: { periodNumber: 'asc' }
    }) : Promise.resolve([])
  ])

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

export async function getNotices(_userId: string, page = 1, limit = 20) {
  const where = {
    isDeleted: false,
    OR: [
      { targetRoles: { has: 'STUDENT' as const } },
      { targetRoles: { isEmpty: true } },
      { targetRoles: { equals: [] } }
    ],
  }
  const skip = (page - 1) * limit

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notice.count({ where }),
  ])

  return {
    notices,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getAnnouncements(userId: string, page = 1, limit = 20) {
  const student = await getStudentByUserId(userId)

  if (!student.sectionId) {
    return { announcements: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } }
  }

  const where = { sectionId: student.sectionId }
  const skip = (page - 1) * limit

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { author: true },
      skip,
      take: limit,
    }),
    prisma.announcement.count({ where }),
  ])

  return {
    announcements,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getExams(userId: string) {
  const student = await getStudentByUserId(userId)
  
  // Check fee status across student fee records
  const feeRecords = await prisma.feeRecord.findMany({
    where: { studentId: student.id },
    select: { status: true },
  })
  const hasUnpaidFees = feeRecords.some((f) => f.status !== 'PAID' && f.status !== 'WAIVED')

  const [exams, rawReportCards, rawAdmitCards] = await Promise.all([
    student.sessionId
      ? prisma.exam.findMany({
          where: {
            sessionId: student.sessionId,
            status: 'PUBLISHED',
          },
          include: {
            schedules: {
              include: {
                subject: { select: { id: true, name: true, code: true } },
              },
              orderBy: { examDate: 'asc' },
            },
          },
          orderBy: { startDate: 'desc' },
        })
      : Promise.resolve([]),
    prisma.reportCard.findMany({
      where: { studentId: student.id },
      select: {
        id: true,
        examId: true,
        fileUrl: true,
        totalMarks: true,
        obtainedMarks: true,
        grade: true,
        remarks: true,
        marks: true,
        isReleased: true,
        createdAt: true,
        exam: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.admitCard.findMany({
      where: { studentId: student.id },
      select: {
        id: true,
        fileUrl: true,
        isReleased: true,
        createdAt: true,
        exam: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Filter and gate Admit Cards
  const admitCards = rawAdmitCards.map((ac) => {
    if (hasUnpaidFees) {
      return {
        id: ac.id,
        createdAt: ac.createdAt,
        exam: ac.exam,
        isBlocked: true,
        blockReason: 'Admit Card withheld due to pending fee dues.',
        fileUrl: null,
      }
    }
    if (!ac.isReleased) {
      return {
        id: ac.id,
        createdAt: ac.createdAt,
        exam: ac.exam,
        isBlocked: true,
        blockReason: 'Admit Card has not been released by school administration yet.',
        fileUrl: null,
      }
    }
    return { ...ac, isBlocked: false, blockReason: null }
  })

  // Filter and gate Report Cards
  const reportCards = rawReportCards.map((rc) => {
    if (hasUnpaidFees) {
      return {
        id: rc.id,
        examId: rc.examId,
        createdAt: rc.createdAt,
        exam: rc.exam,
        isBlocked: true,
        blockReason: 'Result / Report Card withheld due to pending fee dues.',
        fileUrl: null,
        totalMarks: null,
        obtainedMarks: null,
        grade: null,
        remarks: null,
        marks: null,
      }
    }
    if (!rc.isReleased) {
      return {
        id: rc.id,
        examId: rc.examId,
        createdAt: rc.createdAt,
        exam: rc.exam,
        isBlocked: true,
        blockReason: 'Result has not been released by administration yet.',
        fileUrl: null,
        totalMarks: null,
        obtainedMarks: null,
        grade: null,
        remarks: null,
        marks: null,
      }
    }
    return { ...rc, isBlocked: false, blockReason: null }
  })

  return { exams, reportCards, admitCards, hasUnpaidFees }
}

export async function getHomework(userId: string) {
  const student = await getStudentByUserId(userId)
  
  const [homeworks, submissions] = await Promise.all([
    student.sectionId ? prisma.homework.findMany({
      where: { sectionId: student.sectionId, status: 'PUBLISHED' },
      select: {
        id: true, title: true, description: true, dueDate: true, attachmentUrl: true, marks: true,
        subject: { select: { id: true, name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' }
    }) : Promise.resolve([]),
    prisma.homeworkSubmission.findMany({
      where: { studentId: student.id },
      select: { id: true, homeworkId: true, status: true, remarks: true, submissionUrl: true, submittedAt: true }
    })
  ])
  
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

export async function submitHomework(userId: string, homeworkId: string, fileUrl?: string) {
  const student = await getStudentByUserId(userId)
  
  const homework = await prisma.homework.findUnique({ where: { id: homeworkId } })
  if (!homework) throw new NotFoundError('Homework not found')
  
  // Check if submission already exists
  const existing = await prisma.homeworkSubmission.findUnique({
    where: {
      homeworkId_studentId: {
        homeworkId,
        studentId: student.id
      }
    }
  })

  // If a file was uploaded and there is an existing file, we could delete the old one, but we'll skip for brevity or do it if we import deleteFile.
  // Actually, we don't have deleteFile imported here. Let's just update the record.

  if (existing) {
    return await prisma.homeworkSubmission.update({
      where: { id: existing.id },
      data: {
        submissionUrl: fileUrl || existing.submissionUrl,
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    })
  } else {
    return await prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId: student.id,
        submissionUrl: fileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    })
  }
}
