/**
 * Shared Constants
 *
 * Centralized read-only constants for all business domains.
 * These constants are the single source of truth for enum-like values
 * across the backend. The frontend mirrors these in its own constants file.
 *
 * @module core/constants
 */

// ─── User Roles ──────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// ─── Account Status ──────────────────────────────────────────
export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS]

// ─── Attendance Status ───────────────────────────────────────
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  MEDICAL_LEAVE: 'MEDICAL_LEAVE',
  APPROVED_LEAVE: 'APPROVED_LEAVE',
} as const

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS]

// ─── Fee Status ──────────────────────────────────────────────
export const FEE_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
} as const

export type FeeStatus = (typeof FEE_STATUS)[keyof typeof FEE_STATUS]

// ─── Result Status ───────────────────────────────────────────
export const RESULT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const

export type ResultStatus = (typeof RESULT_STATUS)[keyof typeof RESULT_STATUS]

// ─── Notice Target ───────────────────────────────────────────
export const NOTICE_TARGET = {
  ALL: 'ALL',
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const

export type NoticeTarget = (typeof NOTICE_TARGET)[keyof typeof NOTICE_TARGET]

// ─── Gender ──────────────────────────────────────────────────
export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const

export type Gender = (typeof GENDER)[keyof typeof GENDER]

// ─── Pagination Defaults ─────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// ─── Rate Limiting ───────────────────────────────────────────
export const RATE_LIMITS = {
  LOGIN: { windowMs: 60_000, max: 5 },
  GENERAL_API: { windowMs: 60_000, max: 100 },
  ADMIN_API: { windowMs: 60_000, max: 200 },
} as const

// ─── API Versioning ──────────────────────────────────────────
export const API_PREFIX = '/api/v1'
