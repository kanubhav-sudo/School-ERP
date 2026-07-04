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

// All academic session routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'))

// GET /api/v1/academic-sessions
router.get('/', AcademicSessionController.listAcademicSessions)

// GET /api/v1/academic-sessions/active
router.get('/active', AcademicSessionController.getActiveAcademicSession)

// GET /api/v1/academic-sessions/:id
router.get('/:id', AcademicSessionController.getAcademicSession)

// POST /api/v1/academic-sessions
router.post('/', AcademicSessionController.createAcademicSession)

// PATCH /api/v1/academic-sessions/:id
router.patch('/:id', AcademicSessionController.updateAcademicSession)

// PATCH /api/v1/academic-sessions/:id/set-active
router.patch('/:id/set-active', AcademicSessionController.setActiveAcademicSession)

// DELETE /api/v1/academic-sessions/:id
router.delete('/:id', AcademicSessionController.deleteAcademicSession)

export default router
