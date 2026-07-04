/**
 * API Response Helpers
 *
 * Standardized response envelope for all API endpoints.
 * Every controller must use these helpers — never send raw res.json().
 *
 * Success: { success: true, data: ..., message: ... }
 * Error:   { success: false, error: ..., details: ... }
 *
 * @module core/response
 */

import { Response } from 'express'

interface SuccessPayload<T> {
  success: true
  data: T
  message: string
}

interface ErrorPayload {
  success: false
  error: string
  details?: unknown[]
}

export function success<T>(
  res: Response,
  data: T,
  message = 'Operation completed successfully',
  statusCode = 200
): void {
  const payload: SuccessPayload<T> = { success: true, data, message }
  res.status(statusCode).json(payload)
}

export function created<T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): void {
  success(res, data, message, 201)
}

export function noContent(res: Response): void {
  res.status(204).send()
}

export function error(res: Response, message: string, statusCode = 500, details?: unknown[]): void {
  const payload: ErrorPayload = { success: false, error: message }
  if (details && details.length > 0) {
    payload.details = details
  }
  res.status(statusCode).json(payload)
}

export function badRequest(res: Response, message = 'Bad request', details?: unknown[]): void {
  error(res, message, 400, details)
}

export function unauthorized(res: Response, message = 'Authentication required'): void {
  error(res, message, 401)
}

export function forbidden(res: Response, message = 'Access denied'): void {
  error(res, message, 403)
}

export function notFound(res: Response, message = 'Resource not found'): void {
  error(res, message, 404)
}

export function serverError(res: Response, message = 'Internal server error'): void {
  error(res, message, 500)
}

/** Convenience namespace */
export const ApiResponse = {
  success,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
}
