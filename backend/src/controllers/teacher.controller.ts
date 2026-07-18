/**
 * Teacher Controller
 *
 * Thin Express request handlers. All business logic is in the service layer.
 *
 * Routes:
 *   GET    /api/v1/teachers              — list with search/filter/pagination
 *   GET    /api/v1/teachers/:id          — get one by ID
 *   POST   /api/v1/teachers              — create
 *   PATCH  /api/v1/teachers/:id          — update
 *   DELETE /api/v1/teachers/:id          — soft delete
 *   POST   /api/v1/teachers/:id/assignments         — add assignment
 *   DELETE /api/v1/teachers/:id/assignments/:asgId  — remove assignment
 *
 * @module controllers/teacher
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import {
  createTeacherSchema,
  updateTeacherSchema,
  listTeachersSchema,
  createTeacherAssignmentSchema,
  updateTeacherAssignmentSchema,
} from '../validators/teacher.validator'
import * as TeacherService from '../services/teacher.service'
import { ValidationError } from '../core/errors'

// ─── List ─────────────────────────────────────────────────────

export async function updateAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const asgId = req.params.asgId as string
    const parsed = updateTeacherAssignmentSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new ValidationError('Invalid assignment data', parsed.error.issues)
    }

    const assignment = await TeacherService.updateTeacherAssignment(id, asgId, parsed.data)
    res.json({ success: true, data: assignment })
  } catch (error) {
    next(error)
  }
}

export async function listTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listTeachersSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await TeacherService.listTeachers(parsed.data)
    ApiResponse.success(res, result, 'Teachers retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Stats ────────────────────────────────────────────────────

export async function getTeacherStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.query.sessionId as string | undefined
    const stats = await TeacherService.getTeacherStats(sessionId)
    ApiResponse.success(res, stats, 'Teacher stats retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string
    const teacher = await TeacherService.getTeacherById(id)
    ApiResponse.success(res, teacher, 'Teacher retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createTeacherSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const teacher = await TeacherService.createTeacher(parsed.data)
    ApiResponse.created(res, teacher, 'Teacher created')
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = updateTeacherSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const teacher = await TeacherService.updateTeacher(id, parsed.data)
    ApiResponse.success(res, teacher, 'Teacher updated')
  } catch (err) {
    next(err)
  }
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    await TeacherService.deleteTeacher(id)
    ApiResponse.success(res, null, 'Teacher archived successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Add Assignment ───────────────────────────────────────────

export async function addAssignment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = createTeacherAssignmentSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const assignment = await TeacherService.addTeacherAssignment(id, parsed.data)
    ApiResponse.created(res, assignment, 'Assignment added')
  } catch (err) {
    next(err)
  }
}

// ─── Remove Assignment ────────────────────────────────────────

export async function removeAssignment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, asgId } = req.params as { id: string; asgId: string }
    await TeacherService.removeTeacherAssignment(id, asgId)
    ApiResponse.success(res, null, 'Assignment removed')
  } catch (err) {
    next(err)
  }
}

// ─── Timetable & Sections ─────────────────────────────────────

export async function getTeacherTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const sessionId = req.query.sessionId as string | undefined
    const timetable = await TeacherService.getTeacherTimetable(id, sessionId)
    ApiResponse.success(res, timetable, 'Teacher timetable retrieved')
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
    const id = req.params.id as string
    const sessionId = req.query.sessionId as string | undefined
    const sections = await TeacherService.getTeacherSections(id, sessionId)
    ApiResponse.success(res, sections, 'Teacher sections retrieved')
  } catch (err) {
    next(err)
  }
}
