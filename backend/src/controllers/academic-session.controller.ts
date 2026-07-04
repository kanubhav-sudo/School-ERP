/**
 * Academic Session Controller
 *
 * Thin Express request handlers. All business logic is in the service layer.
 *
 * Routes:
 *   GET    /api/v1/academic-sessions           — list with search/filter/pagination
 *   GET    /api/v1/academic-sessions/active    — get the current active session
 *   GET    /api/v1/academic-sessions/:id       — get one by ID
 *   POST   /api/v1/academic-sessions           — create
 *   PATCH  /api/v1/academic-sessions/:id       — update
 *   PATCH  /api/v1/academic-sessions/:id/set-active — set as active session
 *   DELETE /api/v1/academic-sessions/:id       — delete (non-active only)
 *
 * @module controllers/academic-session
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import {
  createAcademicSessionSchema,
  updateAcademicSessionSchema,
  listAcademicSessionsSchema,
} from '../validators/academic-session.validator'
import * as AcademicSessionService from '../services/academic-session.service'

// ─── List ─────────────────────────────────────────────────────

export async function listAcademicSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listAcademicSessionsSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await AcademicSessionService.listAcademicSessions(parsed.data)
    ApiResponse.success(res, result, 'Academic sessions retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get Active ───────────────────────────────────────────────

export async function getActiveAcademicSession(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await AcademicSessionService.getActiveAcademicSession()
    ApiResponse.success(res, session, 'Active academic session retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getAcademicSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const session = await AcademicSessionService.getAcademicSessionById(id)
    ApiResponse.success(res, session, 'Academic session retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createAcademicSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createAcademicSessionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const session = await AcademicSessionService.createAcademicSession(parsed.data)
    ApiResponse.created(res, session, 'Academic session created')
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateAcademicSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = updateAcademicSessionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const session = await AcademicSessionService.updateAcademicSession(id, parsed.data)
    ApiResponse.success(res, session, 'Academic session updated')
  } catch (err) {
    next(err)
  }
}

// ─── Set Active ───────────────────────────────────────────────

export async function setActiveAcademicSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    await AcademicSessionService.setActiveAcademicSession(id)
    const session = await AcademicSessionService.getAcademicSessionById(id)
    ApiResponse.success(res, session, 'Academic session set as active')
  } catch (err) {
    next(err)
  }
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteAcademicSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    await AcademicSessionService.deleteAcademicSession(id)
    ApiResponse.success(res, null, 'Academic session deleted')
  } catch (err) {
    next(err)
  }
}
