/**
 * Student Controller
 *
 * Thin Express request handlers. All business logic is in the service layer.
 *
 * Routes:
 *   GET    /api/v1/students              — list with search/filter/pagination
 *   GET    /api/v1/students/:id          — get one by ID
 *   POST   /api/v1/students              — create
 *   PATCH  /api/v1/students/:id          — update
 *   DELETE /api/v1/students/:id          — soft delete
 *
 * @module controllers/student
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentsSchema,
} from '../validators/student.validator'
import * as StudentService from '../services/student.service'

// ─── List ─────────────────────────────────────────────────────

export async function listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listStudentsSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await StudentService.listStudents(parsed.data)
    ApiResponse.success(res, result, 'Students retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string
    const student = await StudentService.getStudentById(id)
    ApiResponse.success(res, student, 'Student retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createStudentSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const student = await StudentService.createStudent(parsed.data)
    ApiResponse.created(res, student, 'Student created')
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = updateStudentSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const student = await StudentService.updateStudent(id, parsed.data)
    ApiResponse.success(res, student, 'Student updated')
  } catch (err) {
    next(err)
  }
}

// ─── Soft Delete ──────────────────────────────────────────────

export async function deleteStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    await StudentService.deleteStudent(id)
    ApiResponse.success(res, null, 'Student archived successfully')
  } catch (err) {
    next(err)
  }
}
