/**
 * Timetable Routes
 *
 * All routes require authentication.
 * ADMIN-only for mutations; ADMIN + TEACHER for reads.
 *
 * @module routes/timetable
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as TimetableController from '../controllers/timetable.controller'

const router = Router()

// Apply authentication to all timetable routes
router.use(authenticate)

// ─── Read Routes (ADMIN + TEACHER) ───────────────────────────

router.get('/', authorize('ADMIN', 'TEACHER'), TimetableController.listTimetable)

router.get(
  '/section/:sectionId',
  authorize('ADMIN', 'TEACHER'),
  TimetableController.getTimetableBySection
)

router.get(
  '/teacher/:teacherId',
  authorize('ADMIN', 'TEACHER'),
  TimetableController.getTimetableByTeacher
)

router.get('/:id', authorize('ADMIN', 'TEACHER'), TimetableController.getTimetable)

// ─── Write Routes (ADMIN only) ───────────────────────────────

router.post('/', authorize('ADMIN'), TimetableController.createTimetable)

router.patch('/:id', authorize('ADMIN'), TimetableController.updateTimetable)

router.delete('/:id', authorize('ADMIN'), TimetableController.deleteTimetable)

export default router
