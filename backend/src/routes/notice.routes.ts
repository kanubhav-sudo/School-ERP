/**
 * Notice Routes
 *
 * All routes require authentication.
 * Reads: ADMIN, TEACHER, STUDENT (all authenticated roles)
 * Mutations (create/update/delete): ADMIN only
 *
 * @module routes/notice
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import { NoticeController } from '../controllers/notice.controller'

const router = Router()

// Apply authentication to all notice routes
router.use(authenticate)

// ─── Read Routes (all authenticated roles) ───────────────────

router.get('/', NoticeController.getNotices)

router.get('/:id', NoticeController.getNoticeById)

// ─── Write Routes (ADMIN only) ───────────────────────────────

router.post('/', authorize('ADMIN'), NoticeController.createNotice)

router.patch('/:id', authorize('ADMIN'), NoticeController.updateNotice)

router.delete('/:id', authorize('ADMIN'), NoticeController.deleteNotice)

export default router
