/**
 * Feature Guard Middleware — CloudEMS Platform v4.5
 *
 * Enforces feature permissions on routes.
 * Usage: router.get('/transport/routes', authenticate, requireFeature('transport'), handler)
 *
 * @module middlewares/feature-guard
 */

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../core/errors'
import { FeatureResolutionService } from '../services/feature-resolution.service'

export function requireFeature(featureKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const schoolId = req.school?.id || req.user?.schoolId
      if (!schoolId) {
        throw new ForbiddenError('Tenant school context missing for feature check')
      }

      const db = req.db
      if (!db) {
        throw new ForbiddenError('Database context missing for feature check')
      }

      const hasAccess = await FeatureResolutionService.hasFeature(db, schoolId, featureKey)
      if (!hasAccess) {
        throw new ForbiddenError(
          `Feature '${featureKey}' is not enabled on your current subscription plan. Please upgrade to access this module.`
        )
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
