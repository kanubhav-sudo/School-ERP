/**
 * API Router Assembly
 *
 * Mounts all API namespaces under /api/v1.
 *
 * @module routes/index
 */

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

export default router
