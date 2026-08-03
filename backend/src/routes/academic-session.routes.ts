/**
 * Academic Session Routes
 *
 * All routes are protected and restricted to ADMIN role.
 *
 * @module routes/academic-sessions
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as AcademicSessionController from '../controllers/academic-session.controller'

const router = Router()

router.use(authenticate)

// GET endpoints are readable by all authenticated roles (ADMIN, TEACHER, STUDENT)
router.get(
  '/',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  AcademicSessionController.listAcademicSessions
)
router.get(
  '/active',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  AcademicSessionController.getActiveAcademicSession
)
router.get(
  '/:id',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  AcademicSessionController.getAcademicSession
)

// Write routes require ADMIN role
router.post('/', authorize('ADMIN'), AcademicSessionController.createAcademicSession)
router.patch('/:id', authorize('ADMIN'), AcademicSessionController.updateAcademicSession)
router.patch(
  '/:id/set-active',
  authorize('ADMIN'),
  AcademicSessionController.setActiveAcademicSession
)
router.delete('/:id', authorize('ADMIN'), AcademicSessionController.deleteAcademicSession)

export default router
