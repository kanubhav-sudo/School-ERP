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

// HH:MM 24-hour time format
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const TimeString = z.string().regex(timeRegex, 'Time must be in HH:MM 24-hour format (e.g. 08:30)')

// ─── Create ──────────────────────────────────────────────────

export const createTimetableSchema = z
  .object({
    sessionId: z.string().uuid('sessionId must be a valid UUID'),
    classId: z.string().uuid('classId must be a valid UUID'),
    sectionId: z.string().uuid('sectionId must be a valid UUID'),
    teacherId: z.string().uuid('teacherId must be a valid UUID'),
    subjectId: z.string().uuid('subjectId must be a valid UUID'),
    dayOfWeek: DayOfWeekEnum,
    periodNumber: z
      .number()
      .int()
      .min(1, 'Period number must be at least 1')
      .max(10, 'Period number must be 10 or fewer'),
    startTime: TimeString,
    endTime: TimeString,
    room: z.string().max(50).trim().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'startTime must be before endTime',
    path: ['endTime'],
  })

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateTimetableSchema = z
  .object({
    teacherId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    dayOfWeek: DayOfWeekEnum.optional(),
    periodNumber: z.number().int().min(1).max(10).optional(),
    startTime: TimeString.optional(),
    endTime: TimeString.optional(),
    room: z.string().max(50).trim().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime
      }
      return true
    },
    {
      message: 'startTime must be before endTime',
      path: ['endTime'],
    }
  )

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
