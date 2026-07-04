/**
 * Smart Rate Limiting Middleware
 *
 * Route-specific rate limiters using express-rate-limit.
 * Throws custom AppError for standardization.
 *
 * @module middlewares/rateLimiter
 */

import rateLimit from 'express-rate-limit'
import { RATE_LIMITS, TooManyRequestsError } from '../core'
import { Request, Response, NextFunction } from 'express'

const defaultHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new TooManyRequestsError())
}

export const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN.windowMs,
  max: RATE_LIMITS.LOGIN.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler,
})

export const generalApiLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL_API.windowMs,
  max: RATE_LIMITS.GENERAL_API.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler,
})

export const adminApiLimiter = rateLimit({
  windowMs: RATE_LIMITS.ADMIN_API.windowMs,
  max: RATE_LIMITS.ADMIN_API.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler,
})
