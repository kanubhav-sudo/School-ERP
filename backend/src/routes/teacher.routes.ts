/**
 * Teacher Routes
 *
 * All routes are protected and restricted to ADMIN role.
 *
 * @module routes/teachers
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as TeacherController from '../controllers/teacher.controller'

const router = Router()

// All teacher routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'))

// GET /api/v1/teachers
router.get('/', TeacherController.listTeachers)

// GET /api/v1/teachers/stats
router.get('/stats', TeacherController.getTeacherStats)

// GET /api/v1/teachers/:id
router.get('/:id', TeacherController.getTeacher)

// POST /api/v1/teachers
router.post('/', TeacherController.createTeacher)

// PATCH /api/v1/teachers/:id
router.patch('/:id', TeacherController.updateTeacher)

// DELETE /api/v1/teachers/:id
router.delete('/:id', TeacherController.deleteTeacher)

// POST /api/v1/teachers/:id/assignments
router.post('/:id/assignments', TeacherController.addAssignment)
router.put('/:id/assignments/:asgId', TeacherController.updateAssignment)
router.delete('/:id/assignments/:asgId', TeacherController.removeAssignment)

// GET /api/v1/teachers/:id/timetable
router.get('/:id/timetable', TeacherController.getTeacherTimetable)

// GET /api/v1/teachers/:id/sections
router.get('/:id/sections', TeacherController.getTeacherSections)

export default router
