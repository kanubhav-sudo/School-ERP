/**
 * Core Infrastructure Barrel Export
 *
 * Single import point for all shared infrastructure modules.
 * Usage: import { logger, AppError, ApiResponse, ROLES } from '@/core';
 *
 * @module core
 */

// Logger
export { logger } from './logger'

// Errors
export {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
} from './errors'

// API Response Helpers
export { ApiResponse } from './response'

// Constants
export {
  ROLES,
  ACCOUNT_STATUS,
  ATTENDANCE_STATUS,
  FEE_STATUS,
  RESULT_STATUS,
  NOTICE_TARGET,
  GENDER,
  PAGINATION,
  RATE_LIMITS,
  API_PREFIX,
} from './constants'
export type {
  Role,
  AccountStatus,
  AttendanceStatus,
  FeeStatus,
  ResultStatus,
  NoticeTarget,
  Gender,
} from './constants'

// Time Utilities
export { nowUTC, nowISO, toISO, todayStartUTC, todayEndUTC, uptimeSeconds } from './time'

// Storage Interface
export { STORAGE_BUCKETS } from './storage'
export type { StorageProvider, StorageBucket } from './storage'
