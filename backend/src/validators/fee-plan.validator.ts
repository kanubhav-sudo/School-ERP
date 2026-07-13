/**
 * Fee Plan Validators
 *
 * Zod schemas for validating incoming fee plan request bodies.
 * All monetary inputs are in whole rupees (integer). The service layer
 * converts to paise before storing in the database.
 *
 * @module validators/fee-plan
 */

import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────

// ─── Create ───────────────────────────────────────────────────

export const createFeePlanSchema = z.object({
  name: z
    .string()
    .min(1, 'Fee plan name is required')
    .max(200, 'Fee plan name must be 200 characters or fewer')
    .trim(),
  sessionId: z.string().uuid('Invalid session ID'),
  classId: z.string().uuid('Invalid class ID'),
  monthlyAmount: z
    .number()
    .int('Monthly amount must be a whole number')
    .positive('Monthly amount must be positive'),
  description: z.string().max(1000).trim().optional(),
  isActive: z.boolean().optional().default(true),
})

export type CreateFeePlanInput = z.infer<typeof createFeePlanSchema>

// ─── Update ───────────────────────────────────────────────────

export const updateFeePlanSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  sessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  monthlyAmount: z.number().int().positive().optional(),
  description: z.string().max(1000).trim().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateFeePlanInput = z.infer<typeof updateFeePlanSchema>

// ─── Query / Filters ──────────────────────────────────────────

export const listFeePlansSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sessionId: z.string().uuid().optional(),
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

export type ListFeePlansInput = z.infer<typeof listFeePlansSchema>
