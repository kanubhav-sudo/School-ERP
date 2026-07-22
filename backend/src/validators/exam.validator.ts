/**
 * Exam Validators
 *
 * @module validators/exam
 */

import { z } from 'zod'
import { PublishStatus } from '../generated/prisma'

export const createExamSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    classId: z.string().uuid().optional().nullable(),
    sectionId: z.string().uuid().optional().nullable(),
    name: z.string().min(1).max(255),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.nativeEnum(PublishStatus).optional(),
  }),
})

export const updateExamSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    classId: z.string().uuid().optional().nullable(),
    sectionId: z.string().uuid().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.nativeEnum(PublishStatus).optional(),
  }),
})

export const examScheduleSchema = z.object({
  body: z.object({
    schedules: z.array(
      z.object({
        subjectId: z.string().uuid(),
        examDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        room: z.string().optional(),
      })
    ),
  }),
})

export const saveMarksSchema = z.object({
  body: z.object({
    examId: z.string().uuid(),
    studentId: z.string().uuid(),
    totalMarks: z.number().optional(),
    obtainedMarks: z.number().optional(),
    grade: z.string().optional(),
    remarks: z.string().optional(),
    marks: z.record(z.string(), z.any()).optional(),
    isReleased: z.boolean().optional(),
    fileUrl: z.string().optional(),
  }),
})

export const toggleAdmitCardSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    studentId: z.string().uuid(),
    isReleased: z.boolean(),
    examId: z.string().uuid().optional(),
    fileUrl: z.string().optional(),
  }),
})
