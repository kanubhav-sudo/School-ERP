/**
 * Student Routes
 *
 * All routes are protected and restricted to ADMIN role.
 *
 * @module routes/students
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as StudentController from '../controllers/student.controller'

const router = Router()

// All student routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'))

// GET /api/v1/students
router.get('/', StudentController.listStudents)

// GET /api/v1/students/:id
router.get('/:id', StudentController.getStudent)

// POST /api/v1/students
router.post('/', StudentController.createStudent)

// PATCH /api/v1/students/:id
router.patch('/:id', StudentController.updateStudent)

// DELETE /api/v1/students/:id
router.delete('/:id', StudentController.deleteStudent)

export default router
