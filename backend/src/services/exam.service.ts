/**
 * Exam Service
 *
 * Business logic for Exam Management, Timetables, Admit Cards, Marks, Results, and Dynamic Templates.
 *
 * @module services/exam
 */

import prisma from '../database/prisma'
import { NotFoundError, ConflictError } from '../core/errors'
import { PublishStatus } from '../generated/prisma'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDayFromDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '' : DAY_NAMES[d.getDay()]
}

export interface CreateExamInput {
  sessionId: string
  classId: string
  name: string
  startDate?: string
  endDate?: string
  status?: PublishStatus
}

export interface UpdateExamInput {
  name?: string
  classId?: string
  startDate?: string
  endDate?: string
  status?: PublishStatus
}

export interface ExamScheduleInput {
  subjectId: string
  examDate: string
  startTime: string
  endTime: string
  room?: string
}

export interface SaveSubjectMarksInput {
  examId: string
  subjectId: string
  maxMarks: number
  marks: Array<{
    studentId: string
    obtainedMarks: number
    remarks?: string
  }>
}

export interface SaveStudentMarksInput {
  examId: string
  studentId: string
  marks: Array<{
    subjectId: string
    maxMarks: number
    obtainedMarks: number
    remarks?: string
  }>
}

export class ExamService {
  /**
   * List exams by Session and/or Class
   */
  static async listExams(filters: { sessionId?: string; classId?: string; status?: PublishStatus }) {
    return prisma.exam.findMany({
      where: {
        ...(filters.sessionId && { sessionId: filters.sessionId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.status && { status: filters.status }),
      },
      select: {
        id: true,
        sessionId: true,
        classId: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        session: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        _count: {
          select: { schedules: true, reportCards: true, admitCards: true, marks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get single exam with schedules (timetable entries with auto-calculated Day)
   */
  static async getExamById(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        sessionId: true,
        classId: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        session: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        schedules: {
          select: {
            id: true,
            subjectId: true,
            examDate: true,
            startTime: true,
            endTime: true,
            room: true,
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { examDate: 'asc' },
        },
      },
    })

    if (!exam) throw new NotFoundError('Exam not found')

    // Attach calculated Day to each schedule entry
    const formattedSchedules = exam.schedules.map((s) => ({
      ...s,
      day: getDayFromDate(s.examDate),
    }))

    return {
      ...exam,
      schedules: formattedSchedules,
    }
  }

  /**
   * Create exam for a Session and Class
   */
  static async createExam(data: CreateExamInput) {
    try {
      return await prisma.exam.create({
        data: {
          sessionId: data.sessionId,
          classId: data.classId,
          name: data.name,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          status: data.status ?? PublishStatus.DRAFT,
        },
        select: {
          id: true,
          sessionId: true,
          classId: true,
          name: true,
          status: true,
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictError('An exam with this name already exists for the selected Class')
      }
      throw err
    }
  }

  /**
   * Update exam details
   */
  static async updateExam(id: string, data: UpdateExamInput) {
    const exam = await prisma.exam.findUnique({ where: { id } })
    if (!exam) throw new NotFoundError('Exam not found')

    return prisma.exam.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.classId !== undefined && { classId: data.classId || null }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.status && { status: data.status }),
      },
    })
  }

  /**
   * Delete exam
   */
  static async deleteExam(id: string) {
    const exam = await prisma.exam.findUnique({ where: { id } })
    if (!exam) throw new NotFoundError('Exam not found')

    return prisma.exam.delete({ where: { id } })
  }

  /**
   * Save exam timetable schedules (Admin creates; Date, Time, Subject; Day is auto-calculated)
   */
  static async saveSchedules(examId: string, schedules: ExamScheduleInput[]) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) throw new NotFoundError('Exam not found')

    return prisma.$transaction(async (tx) => {
      const updatedSubjectIds = schedules.map((s) => s.subjectId)
      await tx.examSchedule.deleteMany({
        where: {
          examId,
          subjectId: { notIn: updatedSubjectIds },
        },
      })

      const results = []
      for (const item of schedules) {
        const schedule = await tx.examSchedule.upsert({
          where: {
            examId_subjectId: { examId, subjectId: item.subjectId },
          },
          create: {
            examId,
            subjectId: item.subjectId,
            examDate: new Date(item.examDate),
            startTime: item.startTime,
            endTime: item.endTime,
            room: item.room || null,
          },
          update: {
            examDate: new Date(item.examDate),
            startTime: item.startTime,
            endTime: item.endTime,
            room: item.room || null,
          },
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
        })

        results.push({
          ...schedule,
          day: getDayFromDate(schedule.examDate),
        })
      }
      return results
    })
  }

  /**
   * Helper: Check student fee clearance up to current month in active session
   */
  private static async checkStudentFeeClearance(studentId: string, sessionId: string) {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const unpaidRecord = await prisma.feeRecord.findFirst({
      where: {
        studentId,
        sessionId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        balanceAmount: { gt: 0 },
        OR: [
          { year: { lt: currentYear } },
          { year: currentYear, month: { lte: currentMonth } },
        ],
      },
      select: { id: true, balanceAmount: true },
    })

    return {
      isCleared: !unpaidRecord,
      unpaidBalance: unpaidRecord?.balanceAmount || 0,
    }
  }

  /**
   * Get Admit Card Students List for selected class (includes ALL students from all sections)
   */
  static async getAdmitCardStudents(sessionId: string, classId: string, examId?: string) {
    const students = await prisma.student.findMany({
      where: {
        classId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        rollNumber: true,
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ section: { name: 'asc' } }, { firstName: 'asc' }],
    })

    // Fetch existing admit card override records
    const admitCardRecords = await prisma.admitCard.findMany({
      where: {
        sessionId,
        ...(examId ? { examId } : {}),
      },
    })
    const cardMap = new Map(admitCardRecords.map((c) => [c.studentId, c]))

    const studentList = []
    for (const student of students) {
      const feeCheck = await this.checkStudentFeeClearance(student.id, sessionId)
      const existingCard = cardMap.get(student.id)

      let effectiveStatus = feeCheck.isCleared ? 'RELEASED' : 'HOLD'
      let defaultRemark = feeCheck.isCleared ? 'Cleared' : 'Fees Not Paid'

      if (existingCard) {
        if (existingCard.adminStatus !== 'AUTO') {
          effectiveStatus = existingCard.adminStatus
          defaultRemark = existingCard.remark || (existingCard.adminStatus === 'HOLD' ? 'Held By Admin' : 'Released By Admin')
        } else if (existingCard.teacherStatus === 'HOLD') {
          effectiveStatus = 'HOLD'
          defaultRemark = existingCard.remark || 'Held By Teacher'
        } else if (existingCard.teacherStatus === 'RELEASED' && feeCheck.isCleared) {
          effectiveStatus = 'RELEASED'
          defaultRemark = existingCard.remark || 'Released By Teacher'
        }
      }

      studentList.push({
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        sectionName: student.section?.name || 'A',
        feeStatus: feeCheck.isCleared ? 'PAID' : 'UNPAID',
        unpaidBalance: feeCheck.unpaidBalance,
        status: effectiveStatus,
        adminStatus: existingCard?.adminStatus || 'AUTO',
        teacherStatus: existingCard?.teacherStatus || 'NONE',
        remark: existingCard?.remark || defaultRemark,
      })
    }

    return studentList
  }

  /**
   * Update Admit Card Status (Admin override / Teacher recommendation)
   */
  static async updateAdmitCardStatus(data: {
    sessionId: string
    examId?: string
    studentId: string
    status: 'RELEASED' | 'HOLD'
    remark?: string
    role: 'ADMIN' | 'TEACHER'
  }) {
    const { sessionId, examId, studentId, status, remark, role } = data

    const existingCard = await prisma.admitCard.findFirst({
      where: {
        sessionId,
        studentId,
        ...(examId ? { examId } : {}),
      },
    })

    let adminStatus = existingCard?.adminStatus || 'AUTO'
    let teacherStatus = existingCard?.teacherStatus || 'NONE'
    let finalRemark = remark || existingCard?.remark || ''

    if (role === 'ADMIN') {
      adminStatus = status
      if (!remark) {
        finalRemark = status === 'HOLD' ? 'Held By Admin' : 'Released By Admin'
      }
    } else if (role === 'TEACHER') {
      teacherStatus = status
      if (!remark) {
        finalRemark = status === 'HOLD' ? 'Held By Teacher' : 'Recommended By Teacher'
      }
    }

    // Determine isReleased flag
    let isReleased = false
    if (adminStatus === 'RELEASED') {
      isReleased = true
    } else if (adminStatus === 'HOLD') {
      isReleased = false
    } else {
      // AUTO mode: depends on fee clearance and teacher status
      const feeCheck = await this.checkStudentFeeClearance(studentId, sessionId)
      isReleased = feeCheck.isCleared && teacherStatus !== 'HOLD'
    }

    if (existingCard) {
      return prisma.admitCard.update({
        where: { id: existingCard.id },
        data: {
          adminStatus,
          teacherStatus,
          remark: finalRemark,
          isReleased,
          ...(examId && { examId }),
        },
      })
    } else {
      return prisma.admitCard.create({
        data: {
          sessionId,
          examId: examId || null,
          studentId,
          adminStatus,
          teacherStatus,
          remark: finalRemark,
          isReleased,
        },
      })
    }
  }

  /**
   * Teacher Result Management: Get subject marks list for class
   */
  static async getSubjectMarks(examId: string, subjectId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    })
    if (!exam || !exam.classId) throw new NotFoundError('Exam or class not found')

    const students = await prisma.student.findMany({
      where: {
        classId: exam.classId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        rollNumber: true,
        section: { select: { name: true } },
      },
      orderBy: [{ section: { name: 'asc' } }, { firstName: 'asc' }],
    })

    const existingMarks = await prisma.examMark.findMany({
      where: { examId, subjectId },
    })
    const markMap = new Map(existingMarks.map((m) => [m.studentId, m]))

    let defaultMaxMarks = 100
    if (existingMarks.length > 0) {
      defaultMaxMarks = existingMarks[0].maxMarks
    }

    return {
      examId,
      subjectId,
      maxMarks: defaultMaxMarks,
      students: students.map((s) => {
        const markRecord = markMap.get(s.id)
        return {
          studentId: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          admissionNumber: s.admissionNumber,
          rollNumber: s.rollNumber,
          sectionName: s.section?.name || 'A',
          obtainedMarks: markRecord ? markRecord.obtainedMarks : 0,
          remarks: markRecord ? markRecord.remarks || '' : '',
        }
      }),
    }
  }

  /**
   * Save subject marks in bulk for a class (Teacher enters single maxMarks at top)
   */
  static async saveSubjectMarks(input: SaveSubjectMarksInput) {
    const { examId, subjectId, maxMarks, marks } = input

    return prisma.$transaction(async (tx) => {
      for (const item of marks) {
        await tx.examMark.upsert({
          where: {
            examId_studentId_subjectId: { examId, studentId: item.studentId, subjectId },
          },
          create: {
            examId,
            studentId: item.studentId,
            subjectId,
            maxMarks,
            obtainedMarks: item.obtainedMarks,
            remarks: item.remarks || null,
          },
          update: {
            maxMarks,
            obtainedMarks: item.obtainedMarks,
            remarks: item.remarks || null,
          },
        })
      }
      return { success: true, count: marks.length }
    })
  }

  /**
   * Teacher Result Management: Get single student's subject marks table & overall percentage
   */
  static async getStudentMarks(examId: string, studentId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        schedules: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
      },
    })
    if (!exam) throw new NotFoundError('Exam not found')

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true },
    })
    if (!student) throw new NotFoundError('Student not found')

    const existingMarks = await prisma.examMark.findMany({
      where: { examId, studentId },
    })
    const markMap = new Map(existingMarks.map((m) => [m.subjectId, m]))

    let totalMax = 0
    let totalObtained = 0

    const subjectRows = exam.schedules.map((sched) => {
      const m = markMap.get(sched.subjectId)
      const maxMarks = m ? m.maxMarks : 100
      const obtainedMarks = m ? m.obtainedMarks : 0
      const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0

      totalMax += maxMarks
      totalObtained += obtainedMarks

      return {
        subjectId: sched.subjectId,
        subjectName: sched.subject.name,
        subjectCode: sched.subject.code,
        maxMarks,
        obtainedMarks,
        percentage: Math.round(percentage * 10) / 10,
        remarks: m?.remarks || '',
      }
    })

    const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0

    return {
      examId,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        className: student.class?.name || '',
        sectionName: student.section?.name || '',
      },
      subjects: subjectRows,
      totalMaxMarks: totalMax,
      totalObtainedMarks: totalObtained,
      overallPercentage: Math.round(overallPercentage * 10) / 10,
    }
  }

  /**
   * Save/update single student marks across all subjects and update ReportCard
   */
  static async saveStudentMarks(input: SaveStudentMarksInput) {
    const { examId, studentId, marks } = input

    return prisma.$transaction(async (tx) => {
      let totalMax = 0
      let totalObtained = 0

      for (const item of marks) {
        totalMax += item.maxMarks
        totalObtained += item.obtainedMarks

        await tx.examMark.upsert({
          where: {
            examId_studentId_subjectId: { examId, studentId, subjectId: item.subjectId },
          },
          create: {
            examId,
            studentId,
            subjectId: item.subjectId,
            maxMarks: item.maxMarks,
            obtainedMarks: item.obtainedMarks,
            remarks: item.remarks || null,
          },
          update: {
            maxMarks: item.maxMarks,
            obtainedMarks: item.obtainedMarks,
            remarks: item.remarks || null,
          },
        })
      }

      const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0

      // Update ReportCard summary
      await tx.reportCard.upsert({
        where: { examId_studentId: { examId, studentId } },
        create: {
          examId,
          studentId,
          totalMarks: totalMax,
          obtainedMarks: totalObtained,
          percentage: Math.round(overallPercentage * 10) / 10,
          isReleased: false,
          adminStatus: 'AUTO',
          teacherStatus: 'COMPLETED',
        },
        update: {
          totalMarks: totalMax,
          obtainedMarks: totalObtained,
          percentage: Math.round(overallPercentage * 10) / 10,
          teacherStatus: 'COMPLETED',
        },
      })

      return { success: true }
    })
  }

  /**
   * Admin Result Release Management: List students with fee status & result release status
   */
  static async getResultStudents(sessionId: string, classId: string, examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { schedules: true },
    })
    if (!exam) throw new NotFoundError('Exam not found')

    const students = await prisma.student.findMany({
      where: { classId, isActive: true, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        rollNumber: true,
        section: { select: { name: true } },
      },
      orderBy: [{ section: { name: 'asc' } }, { firstName: 'asc' }],
    })

    const reportCards = await prisma.reportCard.findMany({ where: { examId } })
    const reportMap = new Map(reportCards.map((r) => [r.studentId, r]))

    const examMarks = await prisma.examMark.findMany({ where: { examId } })
    const marksCountMap = new Map<string, number>()
    examMarks.forEach((m) => {
      marksCountMap.set(m.studentId, (marksCountMap.get(m.studentId) || 0) + 1)
    })

    const totalSubjects = exam.schedules.length

    const list = []
    for (const student of students) {
      const feeCheck = await this.checkStudentFeeClearance(student.id, sessionId)
      const existingReport = reportMap.get(student.id)
      const enteredSubjectsCount = marksCountMap.get(student.id) || 0
      const isMarksComplete = totalSubjects > 0 && enteredSubjectsCount >= totalSubjects

      let defaultStatus = 'HOLD'
      let defaultRemark = 'Marks Pending'

      if (!isMarksComplete) {
        defaultStatus = 'HOLD'
        defaultRemark = 'Marks Pending'
      } else if (!feeCheck.isCleared) {
        defaultStatus = 'HOLD'
        defaultRemark = 'Fees Pending'
      } else {
        defaultStatus = 'RELEASED'
        defaultRemark = 'Cleared'
      }

      let effectiveStatus = defaultStatus
      let remark = defaultRemark
      let adminStatus = existingReport?.adminStatus || 'AUTO'

      if (existingReport) {
        if (existingReport.adminStatus !== 'AUTO') {
          effectiveStatus = existingReport.adminStatus
          remark = existingReport.remarks || (existingReport.adminStatus === 'HOLD' ? 'Held By Admin' : 'Released By Admin')
        } else {
          effectiveStatus = defaultStatus
        }
      }

      list.push({
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        sectionName: student.section?.name || 'A',
        feeStatus: feeCheck.isCleared ? 'PAID' : 'UNPAID',
        isMarksComplete,
        status: effectiveStatus,
        adminStatus,
        isReleased: existingReport?.isReleased ?? (effectiveStatus === 'RELEASED'),
        remark: existingReport?.remarks || remark,
      })
    }

    return list
  }

  /**
   * Admin-Only: Official Release / Hold toggle for Results
   */
  static async updateResultStatus(data: {
    examId: string
    studentId: string
    status: 'RELEASED' | 'HOLD'
    remark?: string
  }) {
    const { examId, studentId, status, remark } = data

    const isReleased = status === 'RELEASED'
    const finalRemark = remark || (isReleased ? 'Released By Admin' : 'Held By Admin')

    return prisma.reportCard.upsert({
      where: { examId_studentId: { examId, studentId } },
      create: {
        examId,
        studentId,
        adminStatus: status,
        isReleased,
        remarks: finalRemark,
      },
      update: {
        adminStatus: status,
        isReleased,
        remarks: finalRemark,
      },
    })
  }

  /**
   * Get / Save Exam Template (Admit Card / Result)
   */
  static async getExamTemplate(type: 'ADMIT_CARD' | 'RESULT') {
    let template = await prisma.examTemplate.findUnique({ where: { type } })
    if (!template) {
      template = await prisma.examTemplate.create({
        data: {
          type,
          schoolName: 'School ERP International',
          headerText: type === 'ADMIT_CARD' ? 'EXAMINATION ADMIT CARD' : 'ANNUAL PROGRESS REPORT',
          footerText: 'This document is computer generated.',
        },
      })
    }
    return template
  }

  static async saveExamTemplate(type: 'ADMIT_CARD' | 'RESULT', data: any) {
    return prisma.examTemplate.upsert({
      where: { type },
      create: {
        type,
        schoolName: data.schoolName || 'School ERP International',
        logoUrl: data.logoUrl || null,
        headerText: data.headerText || null,
        footerText: data.footerText || null,
        principalSignatureUrl: data.principalSignatureUrl || null,
        schoolStampUrl: data.schoolStampUrl || null,
        config: data.config || undefined,
      },
      update: {
        schoolName: data.schoolName,
        logoUrl: data.logoUrl,
        headerText: data.headerText,
        footerText: data.footerText,
        principalSignatureUrl: data.principalSignatureUrl,
        schoolStampUrl: data.schoolStampUrl,
        config: data.config,
      },
    })
  }

  /**
   * Student Portal: Fetch Admit Card Payload
   */
  static async getStudentAdmitCard(userId: string, sessionId?: string, examId?: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { class: true, section: true, session: true },
    })
    if (!student || !student.classId) throw new NotFoundError('Student profile not found')

    const effectiveSessionId = sessionId || student.sessionId
    if (!effectiveSessionId) throw new NotFoundError('Academic session not set')

    // Find latest or selected exam
    let exam = null
    if (examId) {
      exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          schedules: {
            include: { subject: { select: { name: true, code: true } } },
            orderBy: { examDate: 'asc' },
          },
        },
      })
    } else {
      exam = await prisma.exam.findFirst({
        where: { sessionId: effectiveSessionId, classId: student.classId, status: 'PUBLISHED' },
        include: {
          schedules: {
            include: { subject: { select: { name: true, code: true } } },
            orderBy: { examDate: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!exam) return { isReleased: false, holdReason: 'No examination scheduled.' }

    // Check Admit Card release status
    const feeCheck = await this.checkStudentFeeClearance(student.id, effectiveSessionId)
    const card = await prisma.admitCard.findFirst({
      where: { sessionId: effectiveSessionId, studentId: student.id, examId: exam.id },
    })

    let isReleased = feeCheck.isCleared
    let holdReason = feeCheck.isCleared ? '' : 'Fees Pending'

    if (card) {
      if (card.adminStatus === 'RELEASED') {
        isReleased = true
        holdReason = ''
      } else if (card.adminStatus === 'HOLD') {
        isReleased = false
        holdReason = card.remark || 'Held By Admin'
      } else if (card.teacherStatus === 'HOLD') {
        isReleased = false
        holdReason = card.remark || 'Held By Teacher'
      }
    }

    if (!isReleased) {
      return { isReleased: false, holdReason }
    }

    const template = await this.getExamTemplate('ADMIT_CARD')

    return {
      isReleased: true,
      template,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber || '-',
        className: student.class?.name || '',
        sectionName: student.section?.name || '',
        sessionName: student.session?.name || '',
      },
      examName: exam.name,
      timetable: exam.schedules.map((s) => ({
        date: s.examDate.toISOString().slice(0, 10),
        day: getDayFromDate(s.examDate),
        time: `${s.startTime} - ${s.endTime}`,
        subject: s.subject.name,
        code: s.subject.code,
        room: s.room || 'Main Hall',
      })),
    }
  }

  /**
   * Student Portal: Fetch Result Payload
   */
  static async getStudentResult(userId: string, sessionId?: string, examId?: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { class: true, section: true, session: true },
    })
    if (!student || !student.classId) throw new NotFoundError('Student profile not found')

    const effectiveSessionId = sessionId || student.sessionId
    if (!effectiveSessionId) throw new NotFoundError('Academic session not set')

    let exam = null
    if (examId) {
      exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          schedules: {
            include: { subject: { select: { name: true, code: true } } },
          },
        },
      })
    } else {
      exam = await prisma.exam.findFirst({
        where: { sessionId: effectiveSessionId, classId: student.classId, status: 'PUBLISHED' },
        include: {
          schedules: {
            include: { subject: { select: { name: true, code: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!exam) return { isReleased: false, holdReason: 'No result published.' }

    // Result requires explicit Admin Release
    const reportCard = await prisma.reportCard.findUnique({
      where: { examId_studentId: { examId: exam.id, studentId: student.id } },
    })

    const feeCheck = await this.checkStudentFeeClearance(student.id, effectiveSessionId)

    let isReleased = reportCard?.isReleased || reportCard?.adminStatus === 'RELEASED'
    let holdReason = reportCard?.remarks || 'Result Not Published'

    if (!isReleased && reportCard?.adminStatus !== 'RELEASED') {
      if (!feeCheck.isCleared && !reportCard) {
        holdReason = 'Fees Pending'
      }
      return { isReleased: false, holdReason }
    }

    // Fetch student marks
    const marksData = await this.getStudentMarks(exam.id, student.id)
    const template = await this.getExamTemplate('RESULT')

    return {
      isReleased: true,
      template,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber || '-',
        className: student.class?.name || '',
        sectionName: student.section?.name || '',
        sessionName: student.session?.name || '',
      },
      examName: exam.name,
      subjects: marksData.subjects,
      totalMaxMarks: marksData.totalMaxMarks,
      totalObtainedMarks: marksData.totalObtainedMarks,
      overallPercentage: marksData.overallPercentage,
    }
  }
}
