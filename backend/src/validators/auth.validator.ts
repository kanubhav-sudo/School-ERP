/**
 * Auth Validators
 *
 * Zod schemas for validating incoming auth request bodies.
 * Reuse these in controllers — never validate in controllers directly.
 *
 * @module validators/auth
 */

import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required'),
})

export const refreshTokenSchema = z.object({
  // Refresh token comes from httpOnly cookie, not the body.
  // This schema validates the body if needed in the future.
})

export type LoginInput = z.infer<typeof loginSchema>
