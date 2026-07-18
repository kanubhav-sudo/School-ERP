import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const TimeString = z.string().regex(timeRegex, 'Time must be in HH:MM 24-hour format')

export const createPeriodMasterSchema = z.object({
  sessionId: z.string().uuid(),
  periods: z.array(z.object({
    periodNumber: z.number().int().min(1).max(20),
    startTime: TimeString,
    endTime: TimeString,
  }))
})

export type CreatePeriodMasterInput = z.infer<typeof createPeriodMasterSchema>
