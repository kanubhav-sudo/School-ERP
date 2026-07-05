import { Router } from 'express'
import healthRoutes from './health.routes'
import authRoutes from './auth.routes'
import academicSessionRoutes from './academic-session.routes'
import classRoutes from './class.routes'
import sectionRoutes from './section.routes'
import subjectRoutes from './subject.routes'
import teacherRoutes from './teacher.routes'
import studentRoutes from './student.routes'
import timetableRoutes from './timetable.routes'
import attendanceRoutes from './attendance.routes'
import noticeRoutes from './notice.routes'
import accountRoutes from './account.routes'
import { generalApiLimiter } from '../middlewares/rateLimiter.middleware'

const router = Router()

// Apply general rate limit to all API routes
router.use(generalApiLimiter)

// System Routes
router.use('/health', healthRoutes)

// Auth Routes
router.use('/auth', authRoutes)

// Academic Structure Routes (Milestone 3.1)
router.use('/academic-sessions', academicSessionRoutes)
router.use('/classes', classRoutes)
router.use('/sections', sectionRoutes)
router.use('/subjects', subjectRoutes)

// People Management Routes (Milestone 3.2)
router.use('/teachers', teacherRoutes)
router.use('/students', studentRoutes)

// Operations Routes (Milestone 4)
router.use('/timetable', timetableRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/notices', noticeRoutes)

// Account Routes
router.use('/accounts', accountRoutes)

export default router
