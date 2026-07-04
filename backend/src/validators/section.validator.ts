/**
 * Section Validators
 *
 * Zod schemas for section-related request inputs.
 *
 * @module validators/section
 */

import { z } from 'zod'

// ─── Create ──────────────────────────────────────────────────

export const createSectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(10, 'Name must be 10 characters or fewer').trim(),
  classId: z.string().uuid('classId must be a valid UUID'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200).optional().default(40),
  isActive: z.boolean().optional().default(true),
})

export type CreateSectionInput = z.infer<typeof createSectionSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateSectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(10, 'Name must be 10 characters or fewer')
    .trim()
    .optional(),
  classId: z.string().uuid('classId must be a valid UUID').optional(),
  capacity: z.number().int().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateSectionInput = z.infer<typeof updateSectionSchema>

// ─── Query / Filters ─────────────────────────────────────────

export const listSectionsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  classId: z.string().uuid().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }),
})

export type ListSectionsInput = z.infer<typeof listSectionsSchema>
