/**
 * Class Controller
 *
 * Thin Express request handlers for class management.
 * Delegates all logic to class.service.ts.
 *
 * @module controllers/class
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import {
  createClassSchema,
  updateClassSchema,
  listClassesSchema,
} from '../validators/class.validator'
import * as ClassService from '../services/class.service'

// ─── List ─────────────────────────────────────────────────────

export async function listClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listClassesSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await ClassService.listClasses(req.db, parsed.data)
    ApiResponse.success(res, result, 'Classes retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string
    const cls = await ClassService.getClassById(req.db, id)
    ApiResponse.success(res, cls, 'Class retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createClassSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const cls = await ClassService.createClass(req.db, parsed.data)
    ApiResponse.created(res, cls, 'Class created')
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = updateClassSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const cls = await ClassService.updateClass(req.db, id, parsed.data)
    ApiResponse.success(res, cls, 'Class updated')
  } catch (err) {
    next(err)
  }
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string
    await ClassService.deleteClass(req.db, id)
    ApiResponse.success(res, null, 'Class deleted')
  } catch (err) {
    next(err)
  }
}
