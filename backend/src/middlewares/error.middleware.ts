/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown within the application.
 * Maps custom AppErrors to standardized JSON API responses.
 * Also handles generic errors and logs them appropriately.
 *
 * @module middlewares/error
 */

import { Request, Response, NextFunction } from 'express'
import { AppError, ValidationError, ApiResponse, logger } from '../core'
import { env } from '../config'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // If it's a known operational error (AppError subclass)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, req }, `Operational Server Error: ${err.message}`)
    } else {
      logger.warn({ req }, `Client Error [${err.statusCode}]: ${err.message}`)
    }

    // specific handling for Validation errors
    if (err instanceof ValidationError) {
      ApiResponse.badRequest(res, err.message, err.details)
      return
    }

    ApiResponse.error(res, err.message, err.statusCode)
    return
  }

  // Unhandled/unknown error
  logger.fatal({ err, req }, 'Unhandled Exception')

  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error'

  ApiResponse.serverError(res, message)
}
