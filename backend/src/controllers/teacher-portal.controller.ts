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

export async function getTeacherTimetable(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.getTeacherTimetable(requireUser(req))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.getNotices(requireUser(req))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.getAnnouncements(requireUser(req))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.createAnnouncement(requireUser(req), req.body)
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.updateAnnouncement(requireUser(req), req.params.id as string, req.body)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    await TeacherPortalService.deleteAnnouncement(requireUser(req), req.params.id as string)
    res.json({ success: true, data: null })
  } catch (error) {
    next(error)
  }
}

export async function getExams(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.getExams(requireUser(req), req.query.sessionId as string)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getExamStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.getExamStudents(requireUser(req), req.params.sectionId as string, req.query.examId as string)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function uploadAdmitCard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.uploadAdmitCard(requireUser(req), req.body)
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function uploadReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await TeacherPortalService.uploadReportCard(requireUser(req), req.body)
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
