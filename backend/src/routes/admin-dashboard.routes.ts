import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as AdminDashboardController from '../controllers/admin-dashboard.controller'

const router = Router()

// Only ADMIN can access
router.use(authenticate)
router.use(authorize('ADMIN', 'SUPERADMIN'))

router.get('/stats', AdminDashboardController.getDashboardStats)

export default router
