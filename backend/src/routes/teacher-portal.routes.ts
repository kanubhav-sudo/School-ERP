/**
 * Teacher Portal Routes
 *
 * All routes are protected and restricted to TEACHER role.
 *
 * @module routes/teacher-portal
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as TeacherPortalController from '../controllers/teacher-portal.controller'

const router = Router()

// All teacher portal routes require authentication + TEACHER role
router.use(authenticate, authorize('TEACHER'))

// Dashboard
router.get('/dashboard-stats', TeacherPortalController.getDashboardStats)

// My Classes
router.get('/my-classes', TeacherPortalController.getMyClasses)

// Attendance & Sections
router.get('/sections', TeacherPortalController.getTeacherSections)
router.get('/sections/:sectionId/students', TeacherPortalController.getSectionStudents)
router.get('/sections/:sectionId/attendance', TeacherPortalController.getAttendanceSheet)
router.post('/sections/:sectionId/attendance', TeacherPortalController.markAttendance)

export default router
