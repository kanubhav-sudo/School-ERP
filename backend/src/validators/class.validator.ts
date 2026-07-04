/**
 * Class Validators
 *
 * Zod schemas for validating class-related request inputs.
 *
 * @module validators/class
 */

import { z } from 'zod'

// ─── Create ──────────────────────────────────────────────────

export const createClassSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or fewer').trim(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

export type CreateClassInput = z.infer<typeof createClassSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateClassSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or fewer')
    .trim()
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateClassInput = z.infer<typeof updateClassSchema>

// ─── Query / Filters ─────────────────────────────────────────

export const listClassesSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }),
})

export type ListClassesInput = z.infer<typeof listClassesSchema>
