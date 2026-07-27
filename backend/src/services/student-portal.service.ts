/**
 * Student Portal Service
 *
 * Provides data fetching logic for the Student Portal.
 */

import prisma from '../database/prisma'
import { NotFoundError } from '../core/errors'
import { DayOfWeek } from '../generated/prisma'

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

import { getStudentFeeProfile, getElapsedAcademicMonths } from './fee-record.service'

export async function getDashboardData(userId: string) {
  const student = await getStudentByUserId(userId)
  
  const today = new Date().getDay()
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const todayEnum = days[today] as DayOfWeek

  const elapsedMonths = getElapsedAcademicMonths(new Date())

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
    prisma.attendanceRecord.count({ where: { studentId: student.id, attendance: { isDeleted: false } } }),
    prisma.attendanceRecord.count({ where: { studentId: student.id, status: 'PRESENT', attendance: { isDeleted: false } } }),
    prisma.feeRecord.aggregate({
      where: {
        studentId: student.id,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        month: { in: elapsedMonths },
      },
      _sum: { balanceAmount: true }
    }),
    prisma.feeRecord.findFirst({
      where: {
        studentId: student.id,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        month: { in: elapsedMonths },
      },
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

  const pendingFeeVal = Math.max(0, (feesDue._sum.balanceAmount || 0) - (student.advanceBalance || 0))

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
      pendingFeeAmount: pendingFeeVal / 100,
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
    where: {
      studentId: student.id,
      attendance: { isDeleted: false }
    },
    include: {
      attendance: {
        select: {
          id: true,
          date: true,
          sectionId: true,
        }
      }
    },
    orderBy: { attendance: { date: 'desc' } }
  })

  const total = records.length
  const present = records.filter(r => r.status === 'PRESENT').length
  const absent = records.filter(r => r.status === 'ABSENT').length
  const late = records.filter(r => r.status === 'LATE').length
  const halfDay = records.filter(r => r.status === 'HALF_DAY').length
  const percentage = total > 0 ? Math.round(((present + late + halfDay) / total) * 100) : 100

  return {
    records,
    summary: { total, present, absent, late, halfDay, percentage }
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
  return getStudentFeeProfile(student.id)
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
  
  // Check fee status across student fee records for current elapsed months
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const unpaidFeeRecord = await prisma.feeRecord.findFirst({
    where: {
      studentId: student.id,
      status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      balanceAmount: { gt: 0 },
      OR: [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lte: currentMonth } },
      ],
    },
    select: { id: true },
  })
  const hasUnpaidFees = !!unpaidFeeRecord

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
        percentage: true,
        grade: true,
        remarks: true,
        adminStatus: true,
        teacherStatus: true,
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
        adminStatus: true,
        teacherStatus: true,
        isReleased: true,
        createdAt: true,
        exam: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Fetch per-subject marks for student (for released results)
  const examMarkRows = await prisma.examMark.findMany({
    where: { studentId: student.id },
    select: {
      examId: true,
      subjectId: true,
      maxMarks: true,
      obtainedMarks: true,
      remarks: true,
      subject: { select: { id: true, name: true, code: true } },
    },
  })
  // Build map: examId → marks[]
  const marksMap = new Map<string, typeof examMarkRows>()
  for (const m of examMarkRows) {
    if (!marksMap.has(m.examId)) marksMap.set(m.examId, [])
    marksMap.get(m.examId)!.push(m)
  }

  // ── Admit Card gating ──────────────────────────────────────────
  // Dynamically compute effective release so the portal reflects real-time admin/teacher decisions
  const admitCards = rawAdmitCards.map((ac) => {
    let effectiveReleased = ac.isReleased
    // In AUTO mode: re-evaluate based on current fee state and teacher recommendation
    if (ac.adminStatus === 'AUTO' || ac.adminStatus === null) {
      effectiveReleased = !hasUnpaidFees && ac.teacherStatus !== 'HOLD'
    } else if (ac.adminStatus === 'RELEASED') {
      effectiveReleased = true   // Admin hard-released — always visible
    } else if (ac.adminStatus === 'HOLD') {
      effectiveReleased = false  // Admin hard-held — always blocked
    }

    if (effectiveReleased) {
      return { ...ac, isBlocked: false, blockReason: null }
    }
    if (ac.adminStatus === 'HOLD') {
      return {
        id: ac.id, createdAt: ac.createdAt, exam: ac.exam,
        isBlocked: true, blockReason: 'Admit Card withheld by school administration.', fileUrl: null,
      }
    }
    if (hasUnpaidFees) {
      return {
        id: ac.id, createdAt: ac.createdAt, exam: ac.exam,
        isBlocked: true, blockReason: 'Admit Card withheld due to pending fee dues.', fileUrl: null,
      }
    }
    return {
      id: ac.id, createdAt: ac.createdAt, exam: ac.exam,
      isBlocked: true, blockReason: 'Admit Card has not been released by school administration yet.', fileUrl: null,
    }
  })

  // ── Report Card gating ─────────────────────────────────────────
  const reportCards = rawReportCards.map((rc) => {
    let effectiveReleased = rc.isReleased
    // In AUTO mode: released if admin hasn't blocked and fees are clear
    if (rc.adminStatus === 'AUTO' || rc.adminStatus === null) {
      effectiveReleased = !hasUnpaidFees && rc.teacherStatus === 'COMPLETED'
    } else if (rc.adminStatus === 'RELEASED') {
      effectiveReleased = true
    } else if (rc.adminStatus === 'HOLD') {
      effectiveReleased = false
    }

    const subjectMarks = marksMap.get(rc.examId) || []

    if (effectiveReleased) {
      return { ...rc, isBlocked: false, blockReason: null, marks: subjectMarks }
    }
    if (rc.adminStatus === 'HOLD') {
      return {
        id: rc.id, examId: rc.examId, createdAt: rc.createdAt, exam: rc.exam,
        isBlocked: true, blockReason: 'Result withheld by school administration.',
        fileUrl: null, totalMarks: null, obtainedMarks: null, percentage: null, grade: null, remarks: null, marks: null,
      }
    }
    if (hasUnpaidFees) {
      return {
        id: rc.id, examId: rc.examId, createdAt: rc.createdAt, exam: rc.exam,
        isBlocked: true, blockReason: 'Result / Report Card withheld due to pending fee dues.',
        fileUrl: null, totalMarks: null, obtainedMarks: null, percentage: null, grade: null, remarks: null, marks: null,
      }
    }
    return {
      id: rc.id, examId: rc.examId, createdAt: rc.createdAt, exam: rc.exam,
      isBlocked: true, blockReason: 'Result / Report Card has not been released by school administration yet.',
      fileUrl: null, totalMarks: null, obtainedMarks: null, percentage: null, grade: null, remarks: null, marks: null,
    }
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
