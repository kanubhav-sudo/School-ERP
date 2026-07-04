/**
 * Authorize Middleware
 *
 * Role-based access control guard.
 * Must be used after the authenticate middleware.
 * Usage: router.get('/admin', authenticate, authorize('ADMIN'), handler)
 *
 * @module middlewares/authorize
 */

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../core/errors'

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role
    if (!userRole || !roles.includes(userRole)) {
      next(new ForbiddenError('You do not have permission to access this resource'))
      return
    }
    next()
  }
}
