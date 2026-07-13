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

const FeePlanTypeEnum = z.enum(['STANDARD_MONTHLY', 'SIBLING_DISCOUNT'])

// ─── Create ───────────────────────────────────────────────────

export const createFeePlanSchema = z.object({
  name: z
    .string()
    .min(1, 'Fee plan name is required')
    .max(200, 'Fee plan name must be 200 characters or fewer')
    .trim(),
  type: FeePlanTypeEnum,
  sessionId: z.string().uuid('Invalid session ID'),
  classId: z.string().uuid('Invalid class ID'),
  // Admin inputs in whole rupees; service multiplies by 100 to get paise
  monthlyAmount: z
    .number()
    .int('Monthly amount must be a whole number')
    .positive('Monthly amount must be positive'),
  discountAmount: z
    .number()
    .int('Discount amount must be a whole number')
    .min(0, 'Discount amount cannot be negative')
    .optional()
    .default(0),
  discountPercent: z
    .number()
    .int('Discount percent must be a whole number')
    .min(0)
    .max(100)
    .optional()
    .default(0),
  description: z.string().max(1000).trim().optional(),
  isActive: z.boolean().optional().default(true),
})

export type CreateFeePlanInput = z.infer<typeof createFeePlanSchema>

// ─── Update ───────────────────────────────────────────────────

export const updateFeePlanSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  type: FeePlanTypeEnum.optional(),
  sessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  monthlyAmount: z.number().int().positive().optional(),
  discountAmount: z.number().int().min(0).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
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
  type: FeePlanTypeEnum.optional(),
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
