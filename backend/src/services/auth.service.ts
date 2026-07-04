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

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) throw new UnauthorizedError('Invalid username or password')

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
