/**
 * Fee Plan Routes
 *
 * @module routes/fee-plan
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import { FeePlanController } from '../controllers/fee-plan.controller'

const router = Router()

// All fee plan routes require ADMIN role
router.use(authenticate, authorize('ADMIN'))

router.post('/', FeePlanController.createFeePlan)

router.get('/', FeePlanController.getFeePlans)

router.get('/:id', FeePlanController.getFeePlanById)

router.patch('/:id', FeePlanController.updateFeePlan)

router.delete('/:id', FeePlanController.deleteFeePlan)

export default router
