/**
 * Timetable Controller
 *
 * Thin Express request handlers. All business logic is in the service layer.
 *
 * Routes:
 *   GET    /api/v1/timetable                          — list with filters
 *   GET    /api/v1/timetable/:id                      — get one by ID
 *   GET    /api/v1/timetable/section/:sectionId       — full week for a section
 *   GET    /api/v1/timetable/teacher/:teacherId        — full week for a teacher
 *   POST   /api/v1/timetable                          — create entry
 *   PATCH  /api/v1/timetable/:id                      — update entry
 *   DELETE /api/v1/timetable/:id                      — soft delete
 *
 * @module controllers/timetable
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import {
  createTimetableSchema,
  updateTimetableSchema,
  listTimetableSchema,
} from '../validators/timetable.validator'
import * as TimetableService from '../services/timetable.service'

// ─── List ─────────────────────────────────────────────────────

export async function listTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listTimetableSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }
    const entries = await TimetableService.listTimetable(parsed.data)
    ApiResponse.success(res, entries, 'Timetable retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await TimetableService.getTimetableById(req.params.id as string)
    ApiResponse.success(res, entry, 'Timetable entry retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get By Section ───────────────────────────────────────────

export async function getTimetableBySection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sectionId } = req.params as { sectionId: string }
    const sessionId = req.query.sessionId as string | undefined
    const entries = await TimetableService.getTimetableBySection(sectionId, sessionId)
    ApiResponse.success(res, entries, 'Section timetable retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get By Teacher ───────────────────────────────────────────

export async function getTimetableByTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { teacherId } = req.params as { teacherId: string }
    const sessionId = req.query.sessionId as string | undefined
    const entries = await TimetableService.getTimetableByTeacher(teacherId, sessionId)
    ApiResponse.success(res, entries, 'Teacher timetable retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createTimetableSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }
    const userId = req.user?.sub
    const entry = await TimetableService.createTimetableEntry(parsed.data, userId)
    ApiResponse.created(res, entry, 'Timetable entry created')
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = updateTimetableSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }
    const userId = req.user?.sub
    const entry = await TimetableService.updateTimetableEntry(id, parsed.data, userId)
    ApiResponse.success(res, entry, 'Timetable entry updated')
  } catch (err) {
    next(err)
  }
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const userId = req.user?.sub
    await TimetableService.deleteTimetableEntry(id, userId)
    ApiResponse.success(res, null, 'Timetable entry deleted')
  } catch (err) {
    next(err)
  }
}
