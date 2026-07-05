/**
 * Auth Routes
 *
 * POST /login   — public, rate-limited
 * POST /refresh — public (uses httpOnly cookie)
 * POST /logout  — public (uses httpOnly cookie)
 * GET  /me      — protected
 *
 * @module routes/auth
 */

import { Router } from 'express'
import { login, refresh, logout, me, changePassword } from '../controllers/auth.controller'
import { loginLimiter } from '../middlewares/rateLimiter.middleware'
import { authenticate } from '../middlewares/authenticate.middleware'

const router = Router()

router.post('/login', loginLimiter, login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authenticate, me)
router.post('/change-password', authenticate, changePassword)

export default router
