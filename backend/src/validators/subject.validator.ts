/**
 * Subject Validators
 *
 * Zod schemas for subject-related request inputs.
 *
 * @module validators/subject
 */

import { z } from 'zod'

// ─── Create ──────────────────────────────────────────────────

export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .trim(),
  code: z
    .string()
    .min(1, 'Subject code is required')
    .max(20, 'Code must be 20 characters or fewer')
    .toUpperCase()
    .trim(),
  description: z.string().max(500).trim().optional(),
  isActive: z.boolean().optional().default(true),
})

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .trim()
    .optional(),
  code: z
    .string()
    .min(1, 'Subject code is required')
    .max(20, 'Code must be 20 characters or fewer')
    .toUpperCase()
    .trim()
    .optional(),
  description: z.string().max(500).trim().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>

// ─── Class Assignment ────────────────────────────────────────

export const assignSubjectToClassSchema = z.object({
  classId: z.string().uuid('classId must be a valid UUID'),
})

export type AssignSubjectToClassInput = z.infer<typeof assignSubjectToClassSchema>

// ─── Query / Filters ─────────────────────────────────────────

export const listSubjectsSchema = z.object({
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

export type ListSubjectsInput = z.infer<typeof listSubjectsSchema>
