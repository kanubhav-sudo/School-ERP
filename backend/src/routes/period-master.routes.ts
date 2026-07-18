import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import { getPeriodMasters, setPeriodMasters } from '../controllers/period-master.controller'

const router = Router()

// Only ADMIN and SUPER_ADMIN can manage Period Master, but teachers can read it
router.use(authenticate)

router.get('/:sessionId', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getPeriodMasters)
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), setPeriodMasters)

export default router
