/**
 * Attendance Controller
 *
 * Thin Express request handlers. All business logic is in the service layer.
 *
 * Routes:
 *   GET  /api/v1/attendance          — list attendance sheets (filter by sectionId, date)
 *   GET  /api/v1/attendance/sheet    — get a single sheet for sectionId + date
 *   POST /api/v1/attendance          — mark/re-mark attendance (upsert)
 *
 * @module controllers/attendance
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import { markAttendanceSchema, getAttendanceSchema } from '../validators/attendance.validator'
import * as AttendanceService from '../services/attendance.service'

// ─── List ─────────────────────────────────────────────────────

export async function listAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = getAttendanceSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }
    const sheets = await AttendanceService.listAttendance(parsed.data)
    ApiResponse.success(res, sheets, 'Attendance records retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get Single Sheet ─────────────────────────────────────────

export async function getAttendanceSheet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sectionId, date } = req.query as { sectionId?: string; date?: string }
    if (!sectionId || !date) {
      ApiResponse.badRequest(res, 'sectionId and date query parameters are required')
      return
    }
    const sheet = await AttendanceService.getAttendanceSheet(sectionId, date)
    if (!sheet) {
      // Not recorded yet — return null data with 200 so frontend can show empty state
      ApiResponse.success(res, null, 'No attendance recorded for this date')
      return
    }
    ApiResponse.success(res, sheet, 'Attendance sheet retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Mark / Re-mark Attendance ────────────────────────────────

export async function markAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = markAttendanceSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }
    const userId = req.user?.sub
    const sheet = await AttendanceService.markAttendance(parsed.data, userId)
    ApiResponse.success(res, sheet, 'Attendance marked successfully')
  } catch (err) {
    next(err)
  }
}
