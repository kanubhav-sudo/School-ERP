import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import { HomeworkController } from '../controllers/homework.controller'

const router = Router()

// All homework admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'))

router.get('/', HomeworkController.getAllHomeworks)
router.delete('/:id', HomeworkController.deleteHomework)

export default router
