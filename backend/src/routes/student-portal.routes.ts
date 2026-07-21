/**
 * Student Portal Routes
 */

import { Router } from 'express'
import * as StudentPortalController from '../controllers/student-portal.controller'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'

const router = Router()

// All routes require authentication and STUDENT role
router.use(authenticate)
router.use(authorize('STUDENT'))

router.get('/dashboard', StudentPortalController.getDashboard)
router.get('/profile', StudentPortalController.getMyProfile)
router.get('/attendance', StudentPortalController.getAttendance)
router.get('/timetable', StudentPortalController.getTimetable)
router.get('/fees', StudentPortalController.getFees)
router.get('/notices', StudentPortalController.getNotices)
router.get('/announcements', StudentPortalController.getAnnouncements)
router.get('/exams', StudentPortalController.getExams)
router.get('/homework', StudentPortalController.getHomework)

export default router
