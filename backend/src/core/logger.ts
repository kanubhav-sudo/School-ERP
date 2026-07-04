/**
 * Structured Logger
 *
 * Production-grade logging using Pino.
 * All application code must use this logger instead of console.log.
 *
 * Features:
 * - Structured JSON output in production
 * - Pretty-printed output in development
 * - Log levels: trace, debug, info, warn, error, fatal
 *
 * @module core/logger
 */

import pino from 'pino'
import { env } from '../config'

const isDevelopment = env.NODE_ENV === 'development'

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // In production, Pino outputs structured JSON automatically
  serializers: pino.stdSerializers,
})

export default logger
