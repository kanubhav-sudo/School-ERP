import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as AdminDashboardController from '../controllers/admin-dashboard.controller'

const router = Router()

// Only ADMIN can access
router.use(authenticate)
router.use(authorize('ADMIN', 'SUPER_ADMIN'))

router.get('/stats', AdminDashboardController.getDashboardStats)
router.get('/birthdays/today', AdminDashboardController.getTodaysBirthdays)
router.get('/birthdays/upcoming', AdminDashboardController.getUpcomingBirthdays)

export default router
