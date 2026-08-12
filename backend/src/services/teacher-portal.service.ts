/**
 * Teacher Portal Service
 *
 * Dedicated service for teacher portal functionality.
 * Enforces strict authorization by verifying that the authenticated user
 * is linked to a Teacher profile, and that they own the requested data.
 *
 * @module services/teacher-portal
 */

import { ForbiddenError, NotFoundError } from '../core/errors'
import * as AttendanceService from './attendance.service'
import type { MarkAttendanceInput } from '../validators/attendance.validator'
import { DayOfWeek } from '../generated/prisma'

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Get the teacher ID associated with the current user ID.
 */
export async function getTeacherIdForUser(db: any, userId: string): Promise<string> {
  const teacher = await db.teacher.findUnique({
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
async function verifySectionOwnership(db: any, teacherId: string, sectionId: string) {
  const assignment = await db.teacherAssignment.findFirst({
    where: { teacherId, sectionId },
  })
  if (!assignment) {
    throw new ForbiddenError('You are not authorized to access this section')
  }
}

// ─── Dashboard ────────────────────────────────────────────────

export async function getDashboardStats(db: any, userId: string) {
  const teacherId = await getTeacherIdForUser(db, userId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() as DayOfWeek

  // Find all sections assigned to this teacher
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId },
    select: { sectionId: true },
  })
  const sectionIds = [...new Set(assignments.map((a: any) => a.sectionId))]

  const [todayClasses, totalStudents, recentNoticesCount, announcementsCount, attendanceDone] =
    await Promise.all([
      // Count today's classes from timetable
      db.timetable.count({
        where: {
          teacherId,
          dayOfWeek: todayDay,
          isDeleted: false,
        },
      }),
      // Count total unique students across all assigned sections
      db.student.count({
        where: {
          isActive: true,
          deletedAt: null,
          sectionId: { in: sectionIds },
        },
      }),
      // Count active notices targeted at TEACHER or all roles
      db.notice.count({
        where: {
          isDeleted: false,
          OR: [
            { targetRoles: { has: 'TEACHER' } },
            { targetRoles: { isEmpty: true } },
            { targetRoles: { equals: [] } },
          ],
        },
      }),
      // Count announcements in their sections
      db.announcement.count({
        where: {
          sectionId: { in: sectionIds },
        },
      }),
      // Find attendance records for today for their sections
      db.attendance.count({
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

export async function getMyClasses(db: any, userId: string, sessionId?: string) {
  const teacherId = await getTeacherIdForUser(db, userId)

  const assignments = await db.teacherAssignment.findMany({
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

export async function getTeacherSections(db: any, userId: string, sessionId?: string) {
  const teacherId = await getTeacherIdForUser(db, userId)

  const assignments = await db.teacherAssignment.findMany({
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

  return assignments.map((asg: any) => ({
    id: asg.section.id,
    name: asg.section.name,
    classId: asg.class.id,
    className: asg.class.name,
  }))
}

// ─── Students & Attendance ────────────────────────────────────

export async function getSectionStudents(db: any, userId: string, sectionId: string) {
  const teacherId = await getTeacherIdForUser(db, userId)
  await verifySectionOwnership(db, teacherId, sectionId)

  return db.student.findMany({
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

export async function getAttendanceSheet(db: any, userId: string, sectionId: string, date: string) {
  const teacherId = await getTeacherIdForUser(db, userId)
  await verifySectionOwnership(db, teacherId, sectionId)
  return AttendanceService.getAttendanceSheet(db, sectionId, date)
}

export async function markAttendance(db: any, userId: string, data: MarkAttendanceInput) {
  const teacherId = await getTeacherIdForUser(db, userId)
  await verifySectionOwnership(db, teacherId, data.sectionId)
  return AttendanceService.markAttendance(db, data, userId)
}

// ─── Timetable ───────────────────────────────────────────────

export async function getTeacherTimetable(db: any, userId: string) {
  const teacherId = await getTeacherIdForUser(db, userId)

  return db.timetable.findMany({
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

export async function getNotices(db: any, userId: string) {
  await getTeacherIdForUser(db, userId) // Ensure they are a teacher
  return db.notice.findMany({
    where: {
      isDeleted: false,
      OR: [
        { targetRoles: { has: 'TEACHER' } },
        { targetRoles: { isEmpty: true } },
        { targetRoles: { equals: [] } },
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

export async function getAnnouncements(db: any, userId: string, page = 1, limit = 20) {
  const teacherId = await getTeacherIdForUser(db, userId)

  // Teachers can only see announcements for sections they teach OR ones they authored
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId },
    select: { sectionId: true },
  })
  const sectionIds = [...new Set(assignments.map((a: any) => a.sectionId))]

  const where = { sectionId: { in: sectionIds } }
  const skip = (page - 1) * limit

  const [announcements, total] = await Promise.all([
    db.announcement.findMany({
      where,
      include: {
        session: { select: { name: true } },
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.announcement.count({ where }),
  ])

  return {
    announcements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function createAnnouncement(
  db: any,
  userId: string,
  data: {
    title: string
    content: string
    sectionId: string
    classId?: string
    sessionId?: string
    isPinned?: boolean
    expiresAt?: string
    attachments?: string[]
  }
) {
  const teacherId = await getTeacherIdForUser(db, userId)
  await verifySectionOwnership(db, teacherId, data.sectionId)

  let sessionId = data.sessionId
  if (!sessionId || sessionId === 'dummy') {
    const activeSession = await db.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true },
    })
    if (!activeSession) {
      throw new NotFoundError('No active academic session found')
    }
    sessionId = activeSession.id
  }

  return db.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      isPinned: data.isPinned || false,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      attachments: data.attachments || [],
      sessionId,
      classId: data.classId ?? '',
      sectionId: data.sectionId,
      authorId: teacherId,
    },
  })
}

import { deleteFiles } from '../utils/file.util'

export async function updateAnnouncement(
  db: any,
  userId: string,
  id: string,
  data: {
    title?: string
    content?: string
    isPinned?: boolean
    expiresAt?: string
    attachments?: string[]
  }
) {
  const teacherId = await getTeacherIdForUser(db, userId)

  const announcement = await db.announcement.findUnique({ where: { id } })
  if (!announcement) throw new ForbiddenError('Announcement not found')
  if (announcement.authorId !== teacherId)
    throw new ForbiddenError('You can only edit your own announcements')

  // Identify attachments that were removed and delete them from disk
  if (data.attachments) {
    const newAttachments = data.attachments
    const removedAttachments = announcement.attachments.filter(
      (oldUrl: string) => !newAttachments.includes(oldUrl)
    )
    if (removedAttachments.length > 0) {
      deleteFiles(removedAttachments)
    }
  }

  return db.announcement.update({
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

export async function deleteAnnouncement(db: any, userId: string, id: string) {
  const teacherId = await getTeacherIdForUser(db, userId)
  const announcement = await db.announcement.findUnique({ where: { id } })
  if (!announcement) throw new ForbiddenError('Announcement not found')
  if (announcement.authorId !== teacherId)
    throw new ForbiddenError('You can only delete your own announcements')

  if (announcement.attachments && announcement.attachments.length > 0) {
    deleteFiles(announcement.attachments)
  }

  return db.announcement.delete({ where: { id } })
}

// ─── Exams (Admit & Report Cards) ─────────────────────────────

export async function getExams(db: any, userId: string, sessionId?: string) {
  await getTeacherIdForUser(db, userId) // Ensure teacher
  return db.exam.findMany({
    where: sessionId ? { sessionId } : {},
    orderBy: { createdAt: 'desc' },
  })
}

export async function getExamStudents(db: any, userId: string, sectionId: string, examId?: string) {
  const teacherId = await getTeacherIdForUser(db, userId)
  await verifySectionOwnership(db, teacherId, sectionId)

  const validExamId = examId && examId !== 'none' ? examId : undefined

  // Get students with fee records to check if paid
  const students = await db.student.findMany({
    where: {
      sectionId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      feeRecords: true,
      admitCards: true,
      reportCards: {
        where: validExamId ? { examId: validExamId } : undefined,
      },
    },
    orderBy: { rollNumber: 'asc' },
  })

  return students.map((student: any) => {
    // Determine fee status. If any fee record is not paid or waived, they are unpaid.
    // In a real system, you'd check active session fees. We'll simplify to check all fee records.
    const hasUnpaidFees = student.feeRecords.some(
      (f: any) => f.status !== 'PAID' && f.status !== 'WAIVED'
    )
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

export async function uploadAdmitCard(
  db: any,
  userId: string,
  data: { sessionId?: string; studentId: string; fileUrl: string; sectionId: string }
) {
  const teacherId = await getTeacherIdForUser(db, userId)
  await verifySectionOwnership(db, teacherId, data.sectionId)

  // Resolve session from student profile if not provided (or if 'current-session-id' placeholder sent)
  let resolvedSessionId =
    data.sessionId && data.sessionId !== 'current-session-id' ? data.sessionId : null
  if (!resolvedSessionId) {
    const student = await db.student.findUnique({
      where: { id: data.studentId },
      select: { sessionId: true },
    })
    resolvedSessionId = student?.sessionId ?? null
  }

  if (!resolvedSessionId) {
    throw new NotFoundError('Student does not have an active session assigned')
  }

  const existingCard = await db.admitCard.findFirst({
    where: {
      sessionId: resolvedSessionId,
      studentId: data.studentId,
    },
  })

  if (existingCard) {
    return db.admitCard.update({
      where: { id: existingCard.id },
      data: { fileUrl: data.fileUrl },
    })
  }

  return db.admitCard.create({
    data: {
      sessionId: resolvedSessionId,
      studentId: data.studentId,
      fileUrl: data.fileUrl,
    },
  })
}

export async function uploadReportCard(
  db: any,
  userId: string,
  data: { examId: string; studentId: string; fileUrl: string; sectionId: string }
) {
  const teacherId = await getTeacherIdForUser(db, userId)
  await verifySectionOwnership(db, teacherId, data.sectionId)

  return db.reportCard.upsert({
    where: {
      examId_studentId: {
        examId: data.examId,
        studentId: data.studentId,
      },
    },
    update: { fileUrl: data.fileUrl },
    create: {
      examId: data.examId,
      studentId: data.studentId,
      fileUrl: data.fileUrl,
    },
  })
}

// ─── Birthday Helpers ──────────────────────────────────────────

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

function matchesBirthdayMD(dateOfBirth: Date | null | undefined, mdSet: string[]): boolean {
  if (!dateOfBirth) return false
  const mm = String(dateOfBirth.getMonth() + 1).padStart(2, '0')
  const dd = String(dateOfBirth.getDate()).padStart(2, '0')
  return mdSet.includes(`${mm}-${dd}`)
}

function getDaysUntilBirthday(dob: Date): number {
  const today = new Date()
  const birthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
  if (birthday < today) birthday.setFullYear(today.getFullYear() + 1)
  const diffMs = birthday.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// ─── Today's Birthdays (scoped to teacher's assigned sections) ─

export async function getTodaysBirthdays(db: any, userId: string) {
  const teacherId = await getTeacherIdForUser(db, userId)
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId },
    select: { sectionId: true },
  })
  const sectionIds = [...new Set(assignments.map((a: any) => a.sectionId))]
  const todayMD = buildBirthdayMDRange(0, 0)

  const students = await db.student.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      dateOfBirth: { not: null },
      sectionId: { in: sectionIds },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  })

  return students
    .filter((s: any) => matchesBirthdayMD(s.dateOfBirth, todayMD))
    .map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      role: 'STUDENT' as const,
      class: s.class ? `${s.class.name}${s.section ? ` - ${s.section.name}` : ''}` : null,
      dateOfBirth: s.dateOfBirth,
    }))
}

// ─── Upcoming Birthdays (next 7 days, scoped to teacher's sections) ─

export async function getUpcomingBirthdays(db: any, userId: string) {
  const teacherId = await getTeacherIdForUser(db, userId)
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId },
    select: { sectionId: true },
  })
  const sectionIds = [...new Set(assignments.map((a: any) => a.sectionId))]
  const upcomingMDs = buildBirthdayMDRange(1, 7)

  const students = await db.student.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      dateOfBirth: { not: null },
      sectionId: { in: sectionIds },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  })

  return students
    .filter((s: any) => matchesBirthdayMD(s.dateOfBirth, upcomingMDs))
    .map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      role: 'STUDENT' as const,
      class: s.class ? `${s.class.name}${s.section ? ` - ${s.section.name}` : ''}` : null,
      dateOfBirth: s.dateOfBirth,
    }))
    .sort(
      (a: any, b: any) => getDaysUntilBirthday(a.dateOfBirth) - getDaysUntilBirthday(b.dateOfBirth)
    )
}
