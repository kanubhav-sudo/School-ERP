/**
 * Subscription Routes — CloudEMS Platform v4.5
 *
 * Base path: /api/v1/subscription
 * Protected routes for school tenant subscription details, feature permissions, and upgrade requests.
 *
 * @module routes/subscription
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import {
  getSubscriptionController,
  getSchoolFeaturesController,
  requestUpgradeController,
  updateSubscriptionController,
} from '../controllers/subscription.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get subscription details & catalog comparison
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), getSubscriptionController)

// Get resolved feature permissions for tenant
router.get('/features', getSchoolFeaturesController)

// Submit upgrade request to CloudEMS team
router.post('/upgrade-request', authorize('ADMIN', 'SUPER_ADMIN'), requestUpgradeController)

// Update subscription pricing/plan (SUPER_ADMIN or ADMIN override)
router.put('/', authorize('SUPER_ADMIN'), updateSubscriptionController)

export default router
