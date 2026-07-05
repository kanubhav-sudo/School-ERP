import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as AccountController from '../controllers/account.controller'

const router = Router()

// All account lifecycle routes require ADMIN role
router.use(authenticate, authorize('ADMIN'))

// Get account details
router.get('/:id', AccountController.getAccountDetails)

// Actions
router.post('/:id/reset-password', AccountController.resetPassword)
router.post('/:id/reissue-credentials', AccountController.reissueCredentials)
router.post('/:id/activate', AccountController.activateAccount)
router.post('/:id/suspend', AccountController.suspendAccount)
router.post('/:id/disable', AccountController.disableAccount)
router.post('/:id/unlock', AccountController.unlockAccount)
router.post('/:id/force-password-change', AccountController.forcePasswordChange)

export default router
