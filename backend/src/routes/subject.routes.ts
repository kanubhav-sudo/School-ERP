/**
 * Subject Routes
 *
 * All routes protected by authenticate + ADMIN authorize.
 *
 * @module routes/subjects
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as SubjectController from '../controllers/subject.controller'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

// GET /api/v1/subjects
router.get('/', SubjectController.listSubjects)

// GET /api/v1/subjects/:id
router.get('/:id', SubjectController.getSubject)

// POST /api/v1/subjects
router.post('/', SubjectController.createSubject)

// PATCH /api/v1/subjects/:id
router.patch('/:id', SubjectController.updateSubject)

// DELETE /api/v1/subjects/:id
router.delete('/:id', SubjectController.deleteSubject)

// POST /api/v1/subjects/:id/assign
router.post('/:id/assign', SubjectController.assignToClass)

// DELETE /api/v1/subjects/:id/class/:classId
router.delete('/:id/class/:classId', SubjectController.removeFromClass)

export default router
