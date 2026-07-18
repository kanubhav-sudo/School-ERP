/**
 * Teacher Portal Service
 *
 * Dedicated service for teacher portal functionality.
 * Enforces strict authorization by verifying that the authenticated user
 * is linked to a Teacher profile, and that they own the requested data.
 *
 * @module services/teacher-portal
 */

import prisma from '../database/prisma'
import { ForbiddenError } from '../core/errors'
import * as AttendanceService from './attendance.service'
import type { MarkAttendanceInput } from '../validators/attendance.validator'
import { DayOfWeek } from '../generated/prisma'

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Get the teacher ID associated with the current user ID.
 */
export async function getTeacherIdForUser(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!teacher) {
    throw new ForbiddenError('No teacher profile associated with this account')
  }
  return teacher.id
}

/**
 * Verify that the teacher is assigned to the given section.
 */
async function verifySectionOwnership(teacherId: string, sectionId: string) {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId, sectionId },
  })
  if (!assignment) {
    throw new ForbiddenError('You are not authorized to access this section')
  }
}

// ─── Dashboard ────────────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  const teacherId = await getTeacherIdForUser(userId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() as DayOfWeek

  // Find all sections assigned to this teacher
  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId },
    select: { sectionId: true },
  })
  const sectionIds = [...new Set(assignments.map(a => a.sectionId))]

  const [todayClasses, totalStudents, recentNoticesCount, announcementsCount, attendanceDone] = await Promise.all([
    // Count today's classes from timetable
    prisma.timetable.count({
      where: {
        teacherId,
        dayOfWeek: todayDay,
        isDeleted: false,
      },
    }),
    // Count total unique students across all assigned sections
    prisma.student.count({
      where: {
        isActive: true,
        deletedAt: null,
        sectionId: { in: sectionIds },
      },
    }),
    // Count active notices targeted at TEACHER or all roles
    prisma.notice.count({
      where: {
        isDeleted: false,
        OR: [
          { targetRoles: { has: 'TEACHER' } },
          { targetRoles: { isEmpty: true } },
        ],
      },
    }),
    // Count announcements in their sections
    prisma.announcement.count({
      where: {
        sectionId: { in: sectionIds },
      },
    }),
    // Find attendance records for today for their sections
    prisma.attendance.count({
      where: {
        sectionId: { in: sectionIds },
        date: today,
        isDeleted: false,
      },
    }),
  ])

  return {
    todayClasses,
    totalStudents,
    recentNotices: recentNoticesCount,
    announcements: announcementsCount,
    pendingAttendance: sectionIds.length - attendanceDone,
    hasHomeworkModule: false,
  }
}

// ─── My Classes ───────────────────────────────────────────────

export async function getMyClasses(userId: string, sessionId?: string) {
  const teacherId = await getTeacherIdForUser(userId)

  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId,
      ...(sessionId ? { sessionId } : {}),
    },
    include: {
      session: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true, _count: { select: { students: true } } } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: [
      { class: { displayOrder: 'asc' } },
      { class: { name: 'asc' } },
      { section: { name: 'asc' } },
    ],
  })

  // Deduplicate sections if a teacher teaches multiple subjects in the same section
  const classesMap = new Map<
    string,
    {
      sessionId: string
      sessionName: string
      classId: string
      className: string
      sectionId: string
      sectionName: string
      isClassTeacher: boolean
      studentCount: number
      subjects: Array<{ id: string; name: string; code: string }>
    }
  >()
  for (const asg of assignments) {
    const key = asg.sectionId
    if (!classesMap.has(key)) {
      classesMap.set(key, {
        sessionId: asg.sessionId,
        sessionName: asg.session.name,
        classId: asg.classId,
        className: asg.class.name,
        sectionId: asg.sectionId,
        sectionName: asg.section.name,
        isClassTeacher: asg.isClassTeacher,
        studentCount: asg.section._count.students,
        subjects: [],
      })
    }
    const cls = classesMap.get(key)!
    cls.subjects.push({
      id: asg.subject.id,
      name: asg.subject.name,
      code: asg.subject.code,
    })
    // If they are class teacher for *any* assignment in this section, they are the class teacher.
    if (asg.isClassTeacher) {
      cls.isClassTeacher = true
    }
  }

  return Array.from(classesMap.values())
}

export async function getTeacherSections(userId: string, sessionId?: string) {
  const teacherId = await getTeacherIdForUser(userId)

  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId,
      ...(sessionId ? { sessionId } : {}),
    },
    include: {
      class: { select: { id: true, name: true, displayOrder: true } },
      section: { select: { id: true, name: true } },
    },
    distinct: ['sectionId'],
    orderBy: [
      { class: { displayOrder: 'asc' } },
      { class: { name: 'asc' } },
      { section: { name: 'asc' } },
    ],
  })

  return assignments.map((asg) => ({
    id: asg.section.id,
    name: asg.section.name,
    classId: asg.class.id,
    className: asg.class.name,
  }))
}

// ─── Students & Attendance ────────────────────────────────────

export async function getSectionStudents(userId: string, sectionId: string) {
  const teacherId = await getTeacherIdForUser(userId)
  await verifySectionOwnership(teacherId, sectionId)

  return prisma.student.findMany({
    where: {
      sectionId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      rollNumber: true,
      gender: true,
    },
    orderBy: { rollNumber: 'asc' },
  })
}

export async function getAttendanceSheet(userId: string, sectionId: string, date: string) {
  const teacherId = await getTeacherIdForUser(userId)
  await verifySectionOwnership(teacherId, sectionId)
  return AttendanceService.getAttendanceSheet(sectionId, date)
}

export async function markAttendance(userId: string, data: MarkAttendanceInput) {
  const teacherId = await getTeacherIdForUser(userId)
  await verifySectionOwnership(teacherId, data.sectionId)
  return AttendanceService.markAttendance(data, userId)
}

// ─── Timetable ───────────────────────────────────────────────

export async function getTeacherTimetable(userId: string) {
  const teacherId = await getTeacherIdForUser(userId)

  return prisma.timetable.findMany({
    where: {
      teacherId,
      isDeleted: false,
    },
    include: {
      session: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
  })
}

// ─── Notices ──────────────────────────────────────────────────

export async function getNotices(userId: string) {
  await getTeacherIdForUser(userId) // Ensure they are a teacher
  return prisma.notice.findMany({
    where: {
      isDeleted: false,
      OR: [
        { targetRoles: { has: 'TEACHER' } },
        { targetRoles: { isEmpty: true } },
      ],
    },
    include: {
      author: {
        select: { id: true, username: true },
      },
    },
    orderBy: { publishedAt: 'desc' },
  })
}

// ─── Announcements ────────────────────────────────────────────

export async function getAnnouncements(userId: string) {
  const teacherId = await getTeacherIdForUser(userId)
  
  // Teachers can only see announcements for sections they teach OR ones they authored
  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId },
    select: { sectionId: true },
  })
  const sectionIds = [...new Set(assignments.map(a => a.sectionId))]

  return prisma.announcement.findMany({
    where: {
      sectionId: { in: sectionIds },
    },
    include: {
      session: { select: { name: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAnnouncement(userId: string, data: any) {
  const teacherId = await getTeacherIdForUser(userId)
  await verifySectionOwnership(teacherId, data.sectionId)
  
  return prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      isPinned: data.isPinned || false,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      attachments: data.attachments || [],
      sessionId: data.sessionId,
      classId: data.classId,
      sectionId: data.sectionId,
      authorId: teacherId,
    },
  })
}

export async function updateAnnouncement(userId: string, id: string, data: any) {
  const teacherId = await getTeacherIdForUser(userId)
  
  const announcement = await prisma.announcement.findUnique({ where: { id } })
  if (!announcement) throw new ForbiddenError('Announcement not found')
  if (announcement.authorId !== teacherId) throw new ForbiddenError('You can only edit your own announcements')

  return prisma.announcement.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      isPinned: data.isPinned,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      attachments: data.attachments,
    },
  })
}

export async function deleteAnnouncement(userId: string, id: string) {
  const teacherId = await getTeacherIdForUser(userId)
  const announcement = await prisma.announcement.findUnique({ where: { id } })
  if (!announcement) throw new ForbiddenError('Announcement not found')
  if (announcement.authorId !== teacherId) throw new ForbiddenError('You can only delete your own announcements')

  return prisma.announcement.delete({ where: { id } })
}

// ─── Exams (Admit & Report Cards) ─────────────────────────────

export async function getExams(userId: string, sessionId?: string) {
  await getTeacherIdForUser(userId) // Ensure teacher
  return prisma.exam.findMany({
    where: sessionId ? { sessionId } : {},
    orderBy: { createdAt: 'desc' },
  })
}

export async function getExamStudents(userId: string, sectionId: string, examId?: string) {
  const teacherId = await getTeacherIdForUser(userId)
  await verifySectionOwnership(teacherId, sectionId)

  // Get students with fee records to check if paid
  const students = await prisma.student.findMany({
    where: {
      sectionId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      feeRecords: true,
      admitCards: true,
      reportCards: {
        where: examId ? { examId } : undefined
      }
    },
    orderBy: { rollNumber: 'asc' },
  })

  return students.map(student => {
    // Determine fee status. If any fee record is not paid or waived, they are unpaid.
    // In a real system, you'd check active session fees. We'll simplify to check all fee records.
    const hasUnpaidFees = student.feeRecords.some(f => f.status !== 'PAID' && f.status !== 'WAIVED')
    const admitCard = student.admitCards.length > 0 ? student.admitCards[0] : null
    const reportCard = student.reportCards.length > 0 ? student.reportCards[0] : null
    
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      hasUnpaidFees,
      admitCard,
      reportCard,
    }
  })
}

export async function uploadAdmitCard(userId: string, data: { sessionId: string; studentId: string; fileUrl: string; sectionId: string }) {
  const teacherId = await getTeacherIdForUser(userId)
  await verifySectionOwnership(teacherId, data.sectionId)

  return prisma.admitCard.upsert({
    where: {
      sessionId_studentId: {
        sessionId: data.sessionId,
        studentId: data.studentId,
      }
    },
    update: { fileUrl: data.fileUrl },
    create: {
      sessionId: data.sessionId,
      studentId: data.studentId,
      fileUrl: data.fileUrl,
    },
  })
}

export async function uploadReportCard(userId: string, data: { examId: string; studentId: string; fileUrl: string; sectionId: string }) {
  const teacherId = await getTeacherIdForUser(userId)
  await verifySectionOwnership(teacherId, data.sectionId)

  return prisma.reportCard.upsert({
    where: {
      examId_studentId: {
        examId: data.examId,
        studentId: data.studentId,
      }
    },
    update: { fileUrl: data.fileUrl },
    create: {
      examId: data.examId,
      studentId: data.studentId,
      fileUrl: data.fileUrl,
    },
  })
}
