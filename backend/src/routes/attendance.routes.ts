/**
 * Attendance Routes
 *
 * All routes require authentication.
 * Both ADMIN and TEACHER can read and mark attendance.
 *
 * @module routes/attendance
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as AttendanceController from '../controllers/attendance.controller'

const router = Router()

// Apply authentication to all attendance routes
router.use(authenticate)

// ─── Read Routes (ADMIN + TEACHER) ───────────────────────────

router.get('/', authorize('ADMIN', 'TEACHER'), AttendanceController.listAttendance)

router.get('/sheet', authorize('ADMIN', 'TEACHER'), AttendanceController.getAttendanceSheet)

// ─── Write Routes (ADMIN + TEACHER) ──────────────────────────

router.post('/', authorize('ADMIN', 'TEACHER'), AttendanceController.markAttendance)

export default router
