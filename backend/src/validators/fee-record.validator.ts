import { z } from 'zod'

const FeeRecordStatusEnum = z.enum(['PENDING', 'PAID', 'PARTIAL', 'WAIVED', 'OVERDUE'])

export const listFeeRecordsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  status: FeeRecordStatusEnum.optional(),
  studentId: z.string().uuid().optional(),
})

export type ListFeeRecordsInput = z.infer<typeof listFeeRecordsSchema>

export const feeSummarySchema = z.object({
  sessionId: z.string().uuid(),
  month: z.coerce.number().int().min(1).max(12),
})

export type FeeSummaryInput = z.infer<typeof feeSummarySchema>
