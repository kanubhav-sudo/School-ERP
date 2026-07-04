/**
 * Subject Controller
 *
 * Thin Express request handlers for subject management.
 * Delegates all logic to subject.service.ts.
 *
 * @module controllers/subject
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import {
  createSubjectSchema,
  updateSubjectSchema,
  listSubjectsSchema,
  assignSubjectToClassSchema,
} from '../validators/subject.validator'
import * as SubjectService from '../services/subject.service'

// ─── List ─────────────────────────────────────────────────────

export async function listSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listSubjectsSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await SubjectService.listSubjects(parsed.data)
    ApiResponse.success(res, result, 'Subjects retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string
    const subject = await SubjectService.getSubjectById(id)
    ApiResponse.success(res, subject, 'Subject retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createSubject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createSubjectSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const subject = await SubjectService.createSubject(parsed.data)
    ApiResponse.created(res, subject, 'Subject created')
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateSubject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = updateSubjectSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const subject = await SubjectService.updateSubject(id, parsed.data)
    ApiResponse.success(res, subject, 'Subject updated')
  } catch (err) {
    next(err)
  }
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteSubject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    await SubjectService.deleteSubject(id)
    ApiResponse.success(res, null, 'Subject deleted')
  } catch (err) {
    next(err)
  }
}

// ─── Class Assignment ─────────────────────────────────────────

export async function assignToClass(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = assignSubjectToClassSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const assignment = await SubjectService.assignSubjectToClass(id, parsed.data.classId)
    ApiResponse.created(res, assignment, 'Subject assigned to class')
  } catch (err) {
    next(err)
  }
}

export async function removeFromClass(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const classId = req.params.classId as string
    if (!classId) {
      ApiResponse.badRequest(res, 'Validation failed', [{ message: 'classId is required' }])
      return
    }
    await SubjectService.removeSubjectFromClass(id, classId)
    ApiResponse.success(res, null, 'Subject removed from class')
  } catch (err) {
    next(err)
  }
}
