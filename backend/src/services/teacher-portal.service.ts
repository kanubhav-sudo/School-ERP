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
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase() as DayOfWeek

  const [todayClasses, totalStudents, announcements] = await Promise.all([
    // Count today's classes from timetable
    prisma.timetable.count({
      where: {
        teacherId,
        dayOfWeek: today,
        isDeleted: false,
      },
    }),
    // Count total unique students across all assigned sections
    prisma.student.count({
      where: {
        isActive: true,
        deletedAt: null,
        section: {
          teacherAssignments: {
            some: { teacherId },
          },
        },
      },
    }),
    // Count active notices targeted at TEACHER or all roles
    prisma.notice.count({
      where: {
        isDeleted: false,
        OR: [{ targetRoles: { has: 'TEACHER' } }, { targetRoles: { isEmpty: true } }],
      },
    }),
  ])

  return {
    todayClasses,
    pendingHomework: 0, // Homework not implemented yet
    totalStudents,
    announcements,
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
      section: { select: { id: true, name: true } },
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
