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
import { generalApiLimiter } from '../middlewares/rateLimiter.middleware'

const router = Router()

// Apply general rate limit to all API routes
router.use(generalApiLimiter)

// System Routes
router.use('/health', healthRoutes)

// Auth Routes
router.use('/auth', authRoutes)

// Admin Routes (Milestone 2 Placeholder)
// router.use('/admin', adminRoutes);

// Teacher Routes (Milestone 2 Placeholder)
// router.use('/teacher', teacherRoutes);

// Student Routes (Milestone 2 Placeholder)
// router.use('/student', studentRoutes);

export default router
