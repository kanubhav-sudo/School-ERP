/**
 * Data Provider Layer — Document Generation Engine
 *
 * Collects raw data from Student, Exam, Attendance, School, and Settings.
 * No business calculations or layout rendering logic here.
 *
 * @module services/document-engine/data-provider
 */

import { NotFoundError } from '../../core/errors'

export interface RawDocumentContextData {
  school: {
    id: string
    name: string
    logoUrl?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    website?: string | null
    principalName?: string | null
  }
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
    rollNumber?: string | null
    fatherName?: string | null
    motherName?: string | null
    dateOfBirth?: Date | null
    gender?: string | null
    photoUrl?: string | null
    className: string
    sectionName: string
    sessionName: string
  }
  exam?: {
    id: string
    name: string
    startDate?: Date | null
    endDate?: Date | null
    schedules: Array<{
      subjectId: string
      subjectName: string
      subjectCode: string
      examDate: Date
      startTime: string
      endTime: string
      room?: string | null
    }>
  }
  marks?: Array<{
    subjectId: string
    subjectName: string
    subjectCode: string
    maxMarks: number
    obtainedMarks: number
    remarks?: string | null
  }>
  attendance?: {
    totalDays: number
    presentDays: number
  }
}

export class DataProviderService {
  /**
   * Fetch raw context data for student document generation
   */
  static async fetchStudentDocumentContext(
    db: any,
    options: {
      studentId: string
      examId?: string
    }
  ): Promise<RawDocumentContextData> {
    const { studentId, examId } = options

    // 1. Fetch Student profile
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        session: { select: { id: true, name: true } },
        school: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!student) {
      throw new NotFoundError('Student not found')
    }

    const schoolEntity = student.school
    const settings = schoolEntity?.settings

    const schoolData = {
      id: schoolEntity.id,
      name: schoolEntity.name,
      logoUrl: settings?.logoUrl || schoolEntity.logoUrl || null,
      address: settings?.address || schoolEntity.address || null,
      city: settings?.city || schoolEntity.city || null,
      state: settings?.state || schoolEntity.state || null,
      pincode: settings?.pincode || schoolEntity.pincode || null,
      contactEmail: settings?.email || schoolEntity.contactEmail || null,
      contactPhone: settings?.phone || schoolEntity.contactPhone || null,
      website: schoolEntity.website || null,
      principalName: settings?.principalName || 'Principal',
    }

    const studentData = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber || '-',
      fatherName: student.fatherName || undefined,
      motherName: student.motherName || undefined,
      dateOfBirth: student.dateOfBirth || null,
      gender: student.gender || null,
      photoUrl: student.photoUrl || null,
      className: student.class?.name || '',
      sectionName: student.section?.name || '',
      sessionName: student.session?.name || '',
    }

    let examData
    let marksData
    let attendanceData

    // 2. Fetch Exam details if examId provided
    if (examId) {
      const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
          schedules: {
            include: {
              subject: { select: { id: true, name: true, code: true } },
            },
            orderBy: { examDate: 'asc' },
          },
        },
      })

      if (exam) {
        examData = {
          id: exam.id,
          name: exam.name,
          startDate: exam.startDate,
          endDate: exam.endDate,
          schedules: (exam.schedules || []).map((s: any) => ({
            subjectId: s.subjectId,
            subjectName: s.subject.name,
            subjectCode: s.subject.code,
            examDate: s.examDate,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room || 'Main Hall',
          })),
        }

        // Fetch Exam Marks for this student and exam
        const examMarks = await db.examMark.findMany({
          where: { examId, studentId },
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
        })

        if (examMarks && examMarks.length > 0) {
          marksData = examMarks.map((m: any) => ({
            subjectId: m.subjectId,
            subjectName: m.subject.name,
            subjectCode: m.subject.code,
            maxMarks: m.maxMarks,
            obtainedMarks: m.obtainedMarks,
            remarks: m.remarks || null,
          }))
        } else if (examData.schedules.length > 0) {
          // Default empty marks list based on schedule
          marksData = examData.schedules.map((s: any) => ({
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            subjectCode: s.subjectCode,
            maxMarks: 100,
            obtainedMarks: 0,
            remarks: null,
          }))
        }
      }
    }

    // 3. Fetch Attendance summary for student
    const attendanceRecords = await db.attendanceRecord.findMany({
      where: { studentId },
      select: { status: true },
    })

    if (attendanceRecords && attendanceRecords.length > 0) {
      const totalDays = attendanceRecords.length
      const presentDays = attendanceRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length
      attendanceData = { totalDays, presentDays }
    } else {
      // Default placeholder attendance if records not initialized
      attendanceData = { totalDays: 180, presentDays: 165 }
    }

    return {
      school: schoolData,
      student: studentData,
      exam: examData,
      marks: marksData,
      attendance: attendanceData,
    }
  }
}
