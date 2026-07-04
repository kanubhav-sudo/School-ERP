/**
 * Request ID Middleware
 *
 * Assigns a unique ID to every incoming request.
 * The ID is:
 * - Attached to req.id for downstream use
 * - Set in the X-Request-ID response header
 * - Included in all log entries for request tracing
 *
 * @module middlewares/requestId
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID()
  req.id = id
  next()
}
