/**
 * Attendance Validators
 *
 * Zod schemas for validating incoming attendance request bodies and queries.
 *
 * @module validators/attendance
 */

import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────

const AttendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'])

// ─── Mark Attendance (POST) ───────────────────────────────────

export const markAttendanceSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((d) => !isNaN(Date.parse(d)), 'Date must be a valid calendar date'),
  sectionId: z.string().uuid('sectionId must be a valid UUID'),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid('studentId must be a valid UUID'),
        status: AttendanceStatusEnum,
        remarks: z.string().max(500).trim().optional(),
      })
    )
    .min(1, 'At least one attendance record is required'),
})

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>

// ─── Get Attendance (GET query params) ───────────────────────

export const getAttendanceSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  sectionId: z.string().uuid('sectionId must be a valid UUID').optional(),
})

export type GetAttendanceInput = z.infer<typeof getAttendanceSchema>
