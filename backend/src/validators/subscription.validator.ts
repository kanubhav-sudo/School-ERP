/**
 * Subscription Validators — CloudEMS Platform v4.5
 *
 * Zod schemas for subscription endpoints.
 *
 * @module validators/subscription
 */

import { z } from 'zod'

export const upgradeRequestSchema = z.object({
  requestedPlan: z.string().default('PREMIUM'),
  notes: z.string().max(500).optional(),
})

export const updateSubscriptionSchema = z.object({
  currentPlan: z.enum(['BASE', 'PREMIUM', 'CUSTOM']).optional(),
  monthlyPrice: z.number().int().nonnegative().optional(),
  yearlyPrice: z.number().int().nonnegative().optional(),
  status: z.enum(['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED', 'EXPIRED']).optional(),
})

export type UpgradeRequestInput = z.infer<typeof upgradeRequestSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
