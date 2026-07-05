import bcrypt from 'bcryptjs'

/**
 * Auth Controller
 *
 * Thin handlers for auth endpoints.
 * All business logic delegated to auth.service.ts.
 *
 * @module controllers/auth
 */

import { Request, Response, NextFunction } from 'express'
import { loginSchema } from '../validators/auth.validator'
import {
  validateCredentials,
  recordLogin,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  getUserById,
} from '../services/auth.service'
import { ApiResponse } from '../core/response'
import { UnauthorizedError } from '../core/errors'
import { env } from '../config'

const REFRESH_COOKIE = 'refresh_token'

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid input', parsed.error.issues)
      return
    }

    const { username, password } = parsed.data
    const user = await validateCredentials(username, password)

    await recordLogin(user.id)

    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user)

    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions)

    ApiResponse.success(
      res,
      {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      },
      'Login successful'
    )
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) throw new UnauthorizedError('No refresh token provided')

    const payload = verifyRefreshToken(token)

    const user = await getUserById(payload.sub)
    if (!user) throw new UnauthorizedError('User not found')
    if (user.accountStatus !== 'ACTIVE') throw new UnauthorizedError('Account deactivated')
    if (user.refreshTokenVersion !== payload.version)
      throw new UnauthorizedError('Token has been invalidated')

    // Rotate: issue new refresh token version
    const updatedUser = await rotateRefreshToken(user.id)

    const newAccessToken = signAccessToken(updatedUser)
    const newRefreshToken = signRefreshToken(updatedUser)

    res.cookie(REFRESH_COOKIE, newRefreshToken, cookieOptions)

    ApiResponse.success(
      res,
      {
        accessToken: newAccessToken,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          mustChangePassword: updatedUser.mustChangePassword,
        },
      },
      'Token refreshed'
    )
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/auth/logout
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (token) {
      try {
        const payload = verifyRefreshToken(token)
        // Invalidate refresh token by bumping the version
        await rotateRefreshToken(payload.sub)
      } catch {
        // If token is already invalid, that's fine — just clear the cookie
      }
    }

    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    ApiResponse.success(res, null, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/auth/me — requires authenticate middleware
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.user is set by the authenticate middleware
    const userId = (req as Request & { user?: { sub: string } }).user?.sub
    if (!userId) throw new UnauthorizedError()

    const user = await getUserById(userId)
    if (!user) throw new UnauthorizedError('User not found')

    ApiResponse.success(
      res,
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
      },
      'Current user fetched'
    )
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/auth/change-password
import { changePasswordSchema } from '../validators/account.validator'
import * as AccountService from '../services/account.service'
import { ForbiddenError } from '../core/errors'

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub
    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid input', parsed.error.issues)
      return
    }

    const { currentPassword, newPassword } = parsed.data
    const user = await getUserById(userId)
    if (!user) throw new UnauthorizedError('User not found')

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) throw new ForbiddenError('Incorrect current password')

    const newPasswordHash = await bcrypt.hash(newPassword, 12)
    await AccountService.changePassword(userId, currentPassword, newPasswordHash)

    ApiResponse.success(res, null, 'Password changed successfully')
  } catch (err) {
    next(err)
  }
}
