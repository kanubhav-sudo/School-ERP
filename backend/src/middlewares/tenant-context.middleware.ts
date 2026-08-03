/**
 * Tenant Context Middleware
 *
 * Attaches a tenant-isolated database client instance (`req.db`) to every Express Request.
 * All downstream controllers and services MUST interact only with `req.db`.
 *
 * @module middlewares/tenant-context
 */

import { Request, Response, NextFunction } from 'express'
import prisma from '../database/prisma'
import { createTenantClient } from '../database/tenant-client'

// Express Request Extension
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      db?: any
    }
  }
}

export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Determine active school context
    const schoolId = req.user?.schoolId || req.school?.id

    if (schoolId) {
      // Attach tenant-scoped Prisma client extension
      req.db = createTenantClient(prisma, schoolId)
    } else if (req.user?.role === 'SUPER_ADMIN') {
      // Super Admin bypass: operates on global client
      req.db = prisma
    } else {
      // Fallback: Default to global client if unauthenticated route or tenant not yet resolved
      // Authenticated business routes will be rejected by `authenticate` middleware if schoolId missing
      req.db = prisma
    }

    next()
  } catch (err) {
    next(err)
  }
}
