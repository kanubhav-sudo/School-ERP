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

// Timetable
router.get('/timetable', TeacherPortalController.getTeacherTimetable)

// Notices
router.get('/notices', TeacherPortalController.getNotices)

// Announcements
router.get('/announcements', TeacherPortalController.getAnnouncements)
router.post('/announcements', TeacherPortalController.createAnnouncement)
router.put('/announcements/:id', TeacherPortalController.updateAnnouncement)
router.delete('/announcements/:id', TeacherPortalController.deleteAnnouncement)

// Exams & Report/Admit Cards
router.get('/exams', TeacherPortalController.getExams)
router.get('/sections/:sectionId/exam-students', TeacherPortalController.getExamStudents)
router.post('/admit-cards', TeacherPortalController.uploadAdmitCard)
router.post('/report-cards', TeacherPortalController.uploadReportCard)

// Homework
import { HomeworkController } from '../controllers/homework.controller'
router.get('/homework', HomeworkController.getTeacherHomeworks)
router.post('/homework', HomeworkController.createHomework)
router.put('/homework/:id', HomeworkController.updateHomework)
router.delete('/homework/:id', HomeworkController.deleteHomework)

export default router
