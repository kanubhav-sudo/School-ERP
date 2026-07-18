/**
 * Timetable Validators
 *
 * Zod schemas for validating incoming timetable request bodies.
 *
 * @module validators/timetable
 */

import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────

const DayOfWeekEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])



// ─── Create ──────────────────────────────────────────────────

export const createTimetableSchema = z
  .object({
    sessionId: z.string().uuid('sessionId must be a valid UUID'),
    classId: z.string().uuid('classId must be a valid UUID'),
    sectionId: z.string().uuid('sectionId must be a valid UUID'),
    teacherId: z.string().uuid('teacherId must be a valid UUID'),
    subjectId: z.string().uuid('subjectId must be a valid UUID'),
    dayOfWeek: DayOfWeekEnum,
    isOverride: z.boolean().default(false).optional(),
    overrideDate: z.string().datetime().optional(), // ISO string for the date if override
    periodNumber: z
      .number()
      .int()
      .min(1, 'Period number must be at least 1')
      .max(10, 'Period number must be 10 or fewer'),
    room: z.string().max(50).trim().optional(),
  })

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateTimetableSchema = z
  .object({
    teacherId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    dayOfWeek: DayOfWeekEnum.optional(),
    isOverride: z.boolean().optional(),
    overrideDate: z.string().datetime().optional(),
    periodNumber: z.number().int().min(1).max(10).optional(),
    room: z.string().max(50).trim().optional(),
  })

export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>

// ─── Query / Filters ─────────────────────────────────────────

export const listTimetableSchema = z.object({
  sessionId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  dayOfWeek: DayOfWeekEnum.optional(),
})

export type ListTimetableInput = z.infer<typeof listTimetableSchema>
