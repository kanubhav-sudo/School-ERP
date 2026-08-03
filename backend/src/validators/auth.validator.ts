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
  /**
   * loginId accepts:
   * - Username (e.g. "john_doe")
   * - Phone Number (e.g. "9876543210")
   *
   * Student ID / Admission Number MUST NOT be used for authentication.
   */
  loginId: z.string().min(1, 'Login ID is required').trim(),
  password: z.string().min(1, 'Password is required'),
})

export const refreshTokenSchema = z.object({
  // Refresh token comes from httpOnly cookie, not the body.
  // This schema validates the body if needed in the future.
})

export type LoginInput = z.infer<typeof loginSchema>
