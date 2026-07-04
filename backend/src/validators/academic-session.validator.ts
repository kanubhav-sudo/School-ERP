/**
 * Academic Session Validators
 *
 * Zod schemas for validating incoming academic session request bodies.
 *
 * @module validators/academic-session
 */

import { z } from 'zod'

// ─── Create ──────────────────────────────────────────────────

export const createAcademicSessionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(50, 'Name must be 50 characters or fewer')
      .trim(),
    startDate: z.string().date('startDate must be a valid date (YYYY-MM-DD)'),
    endDate: z.string().date('endDate must be a valid date (YYYY-MM-DD)'),
    isActive: z.boolean().optional().default(false),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  })

export type CreateAcademicSessionInput = z.infer<typeof createAcademicSessionSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateAcademicSessionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(50, 'Name must be 50 characters or fewer')
      .trim()
      .optional(),
    startDate: z.string().date('startDate must be a valid date (YYYY-MM-DD)').optional(),
    endDate: z.string().date('endDate must be a valid date (YYYY-MM-DD)').optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) return data.endDate > data.startDate
      return true
    },
    {
      message: 'endDate must be after startDate',
      path: ['endDate'],
    }
  )

export type UpdateAcademicSessionInput = z.infer<typeof updateAcademicSessionSchema>

// ─── Query / Filters ─────────────────────────────────────────

export const listAcademicSessionsSchema = z.object({
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

export type ListAcademicSessionsInput = z.infer<typeof listAcademicSessionsSchema>
