/**
 * Teacher Portal Controller
 *
 * Handles requests for the teacher portal.
 *
 * @module controllers/teacher-portal
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import * as TeacherPortalService from '../services/teacher-portal.service'
import { markAttendanceSchema } from '../validators/attendance.validator'
import { UnauthorizedError, ValidationError } from '../core/errors'

function requireUser(req: Request): string {
  if (!req.user?.sub) {
    throw new UnauthorizedError('User authentication required')
  }
  return req.user.sub
}

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUser(req)
    const stats = await TeacherPortalService.getDashboardStats(userId)
    ApiResponse.success(res, stats, 'Teacher dashboard stats retrieved')
  } catch (err) {
    next(err)
  }
}

export async function getMyClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = requireUser(req)
    const sessionId = req.query.sessionId as string | undefined
    const classes = await TeacherPortalService.getMyClasses(userId, sessionId)
    ApiResponse.success(res, classes, 'Teacher classes retrieved')
  } catch (err) {
    next(err)
  }
}

export async function getTeacherSections(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUser(req)
    const sessionId = req.query.sessionId as string | undefined
    const sections = await TeacherPortalService.getTeacherSections(userId, sessionId)
    ApiResponse.success(res, sections, 'Teacher sections retrieved')
  } catch (err) {
    next(err)
  }
}

export async function getSectionStudents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUser(req)
    const sectionId = req.params.sectionId as string
    const students = await TeacherPortalService.getSectionStudents(userId, sectionId)
    ApiResponse.success(res, { students }, 'Section students retrieved') // Wrapping in { students } for consistency with paginated response expected by frontend if applicable
  } catch (err) {
    next(err)
  }
}

export async function getAttendanceSheet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUser(req)
    const sectionId = req.params.sectionId as string
    const date = req.query.date as string

    if (!date) {
      throw new ValidationError('Date is required', [
        { message: 'Date is required', path: ['date'] },
      ])
    }

    const sheet = await TeacherPortalService.getAttendanceSheet(userId, sectionId, date)
    if (!sheet) {
      ApiResponse.success(res, null, 'No attendance recorded for this date')
      return
    }
    ApiResponse.success(res, sheet, 'Attendance sheet retrieved')
  } catch (err) {
    next(err)
  }
}

export async function markAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUser(req)
    const sectionId = req.params.sectionId as string

    // The schema includes sectionId and date, but sectionId comes from params.
    // Let's ensure the body matches the param if provided.
    const bodyWithSection = { ...req.body, sectionId }

    const parsed = markAttendanceSchema.safeParse(bodyWithSection)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const sheet = await TeacherPortalService.markAttendance(userId, parsed.data)
    ApiResponse.success(res, sheet, 'Attendance marked successfully')
  } catch (err) {
    next(err)
  }
}
