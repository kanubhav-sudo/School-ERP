/**
 * Subscription Controller — CloudEMS Platform v4.5
 *
 * Endpoints for retrieving subscription info, plan catalog, feature permissions,
 * and submitting upgrade requests.
 *
 * @module controllers/subscription
 */

import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import * as R from '../core/response'
import { SubscriptionService } from '../services/subscription.service'
import { FeatureResolutionService } from '../services/feature-resolution.service'
import { UpgradeRequestService } from '../services/upgrade-request.service'
import { upgradeRequestSchema, updateSubscriptionSchema } from '../validators/subscription.validator'

function parseZodError(err: ZodError) {
  return err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
}

/**
 * GET /api/v1/subscription
 * Get current school's subscription details, feature catalog, and pending upgrade request state.
 */
export async function getSubscriptionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schoolId = req.school?.id || req.user?.schoolId
    if (!schoolId) {
      R.badRequest(res, 'School context required')
      return
    }

    const details = await SubscriptionService.getSubscriptionDetails(req.db, schoolId)
    R.success(res, details, 'Subscription details retrieved successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/subscription/features
 * Get resolved feature map for current school tenant.
 */
export async function getSchoolFeaturesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schoolId = req.school?.id || req.user?.schoolId
    if (!schoolId) {
      R.badRequest(res, 'School context required')
      return
    }

    const resolved = await FeatureResolutionService.resolveSchoolFeatures(req.db, schoolId)
    R.success(res, resolved, 'School feature permissions retrieved successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/subscription/upgrade-request
 * Submit a request to upgrade to Premium plan (no payment processing).
 */
export async function requestUpgradeController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schoolId = req.school?.id || req.user?.schoolId
    if (!schoolId) {
      R.badRequest(res, 'School context required')
      return
    }

    const validated = upgradeRequestSchema.parse(req.body)

    const upgradeRequest = await UpgradeRequestService.createUpgradeRequest(req.db, {
      schoolId,
      requestedPlan: validated.requestedPlan,
      requestedById: req.user?.sub,
      notes: validated.notes,
    })

    R.created(
      res,
      upgradeRequest,
      'Upgrade request submitted successfully! A CloudEMS representative will call you shortly.'
    )
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}

/**
 * PUT /api/v1/subscription (Admin / Super Admin update pricing/plan per school)
 */
export async function updateSubscriptionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schoolId = req.school?.id || req.user?.schoolId
    if (!schoolId) {
      R.badRequest(res, 'School context required')
      return
    }

    const validated = updateSubscriptionSchema.parse(req.body)
    const updated = await SubscriptionService.updateSubscription(req.db, schoolId, validated)

    R.success(res, updated, 'Subscription updated successfully')
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}
