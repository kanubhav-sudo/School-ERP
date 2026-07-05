/**
 * Auth Service
 *
 * All authentication business logic lives here.
 * Controllers call these functions — they remain thin.
 *
 * @module services/auth
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../database/prisma'
import { env } from '../config'
import { UnauthorizedError, ForbiddenError } from '../core/errors'
import type { User } from '../generated/prisma'

// ─── Token Payloads ──────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string // User ID
  role: string
  version: number // refreshTokenVersion — used to invalidate on logout
}

export interface RefreshTokenPayload {
  sub: string
  version: number
}

// ─── Token Utilities ─────────────────────────────────────────

export function signAccessToken(user: Pick<User, 'id' | 'role' | 'refreshTokenVersion'>): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    role: user.role,
    version: user.refreshTokenVersion,
  }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as string,
  } as jwt.SignOptions)
}

export function signRefreshToken(user: Pick<User, 'id' | 'refreshTokenVersion'>): string {
  const payload: RefreshTokenPayload = {
    sub: user.id,
    version: user.refreshTokenVersion,
  }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as string,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}

// ─── Auth Operations ─────────────────────────────────────────

/**
 * Validates credentials and returns the user if valid.
 * Throws UnauthorizedError for any invalid credential.
 */
export async function validateCredentials(username: string, password: string): Promise<User> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
    },
  })

  if (!user) throw new UnauthorizedError('Invalid username or password')

  if (user.accountStatus !== 'ACTIVE') {
    throw new ForbiddenError(
      'Your account has been suspended or deactivated. Contact the administrator.'
    )
  }

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw new ForbiddenError(
      `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`
    )
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)

  if (!isValid) {
    const newAttempts = user.failedLoginAttempts + 1
    const shouldLock = newAttempts >= 5
    const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 mins lock

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lastFailedLoginAt: new Date(),
        ...(shouldLock && { lockedUntil }),
      },
    })

    if (shouldLock) {
      throw new ForbiddenError(
        'Account locked due to too many failed attempts. Try again in 15 minutes.'
      )
    }

    throw new UnauthorizedError('Invalid username or password')
  }

  // Reset failed attempts on success if necessary
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })
  }

  return user
}

/**
 * Records the login timestamp.
 */
export async function recordLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
}

/**
 * Rotates the refresh token version, invalidating all existing refresh tokens.
 */
export async function rotateRefreshToken(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshTokenVersion: { increment: 1 } },
  })
}

/**
 * Fetches a user by ID for the /me endpoint and token refresh.
 */
export async function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } })
}

/**
 * Hashes a plain password.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}
