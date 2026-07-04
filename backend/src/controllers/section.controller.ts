/**
 * Section Controller
 *
 * Thin Express request handlers for section management.
 *
 * @module controllers/section
 */

import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import {
  createSectionSchema,
  updateSectionSchema,
  listSectionsSchema,
} from '../validators/section.validator'
import * as SectionService from '../services/section.service'

// ─── List ─────────────────────────────────────────────────────

export async function listSections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listSectionsSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await SectionService.listSections(parsed.data)
    ApiResponse.success(res, result, 'Sections retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Get One ──────────────────────────────────────────────────

export async function getSection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string
    const section = await SectionService.getSectionById(id)
    ApiResponse.success(res, section, 'Section retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createSectionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const section = await SectionService.createSection(parsed.data)
    ApiResponse.created(res, section, 'Section created')
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────

export async function updateSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const parsed = updateSectionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const section = await SectionService.updateSection(id, parsed.data)
    ApiResponse.success(res, section, 'Section updated')
  } catch (err) {
    next(err)
  }
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    await SectionService.deleteSection(id)
    ApiResponse.success(res, null, 'Section deleted')
  } catch (err) {
    next(err)
  }
}
