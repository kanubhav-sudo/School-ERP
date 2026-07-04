/**
 * Authenticate Middleware
 *
 * Verifies the JWT access token from the Authorization header.
 * Sets req.user = { sub, role, version } on success.
 * Throws UnauthorizedError if the token is missing or invalid.
 *
 * @module middlewares/authenticate
 */

import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth.service'
import { UnauthorizedError } from '../core/errors'

// Extend the Express Request type to include the user payload
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        sub: string
        role: string
        version: number
      }
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required')
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err)
    } else {
      // JWT errors (expired, malformed) map to 401
      next(new UnauthorizedError('Invalid or expired token'))
    }
  }
}
