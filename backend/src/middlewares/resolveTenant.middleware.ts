import { Request, Response, NextFunction } from 'express'
import prisma from '../database/prisma'
import { NotFoundError, UnauthorizedError } from '../core/errors'
import type { School } from '../generated/prisma'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      school?: School
    }
  }
}

export async function resolveTenantMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Skip tenant resolution for Super Admin routes.
    // Assuming Super Admin routes will be prefixed with /super-admin or similar later.
    // For now, any route matching /super-admin bypasses tenant checks.
    if (req.path.startsWith('/super-admin') || req.path.includes('/auth/super-admin')) {
      return next()
    }

    // 2. Extract tenant identifier
    let slug = req.headers['x-school-slug'] as string

    if (!slug) {
      const host = req.headers.host || ''
      const parts = host.split('.')
      if (parts.length >= 3 || (parts.length === 2 && parts[1].includes('localhost'))) {
        slug = parts[0]
      }
    }

    // Also allow super admin login to bypass school requirement?
    // The user said: "No schoolId required... Platform-wide routes only."
    // Login might need to determine the role first if we allow super_admin on the same login route,
    // but usually super admins have a separate login portal, or the UI doesn't send a school slug.
    // If we require slug for ALL routes except /super-admin, we must enforce it.
    if (!slug) {
      // We will allow the request to proceed WITHOUT a school attached.
      // The `authenticate` middleware will reject non-SUPER_ADMIN users if req.school is missing.
      return next()
    }

    // 3. Look up the school in the database
    const school = await prisma.school.findUnique({
      where: { slug },
    })

    if (!school) {
      throw new NotFoundError('School not found')
    }

    if (!school.isActive) {
      throw new UnauthorizedError('School account is inactive')
    }

    // 4. Attach school to request
    req.school = school
    next()
  } catch (err) {
    next(err)
  }
}
