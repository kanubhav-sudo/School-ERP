/**
 * Request Logger Middleware
 *
 * Logs every HTTP request with structured data using pino-http.
 * Automatically captures:
 * - Request ID
 * - Timestamp
 * - HTTP Method
 * - Route
 * - Response Time
 * - Status Code
 *
 * Placeholders for User ID and Role (populated after auth is built).
 *
 * @module middlewares/requestLogger
 */

import pinoHttp from 'pino-http'
import { logger } from '../core/logger'
import { Request } from 'express'

export const requestLoggerMiddleware = pinoHttp({
  logger,
  // Use the request ID already set by requestId middleware
  genReqId: (req) => (req as Request).id || 'unknown',

  customProps: (req) => ({
    // Placeholders — populated after Milestone 2 (Authentication)
    userId: (req as Request & { userId?: string }).userId || null,
    userRole: (req as Request & { userRole?: string }).userRole || null,
  }),

  // Don't log health check spam in development
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },

  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
})
