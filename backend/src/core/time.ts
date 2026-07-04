/**
 * UTC Time Utilities
 *
 * All timestamps in the School ERP system are stored and compared in UTC.
 * Use these helpers to guarantee UTC consistency.
 *
 * @module core/time
 */

/** Returns the current time as a UTC Date object */
export function nowUTC(): Date {
  return new Date()
}

/** Returns the current time as an ISO 8601 UTC string */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Converts any Date to its ISO 8601 UTC string representation */
export function toISO(date: Date): string {
  return date.toISOString()
}

/** Returns the start of today (midnight UTC) */
export function todayStartUTC(): Date {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  return now
}

/** Returns the end of today (23:59:59.999 UTC) */
export function todayEndUTC(): Date {
  const now = new Date()
  now.setUTCHours(23, 59, 59, 999)
  return now
}

/** Calculates uptime in seconds from a start time */
export function uptimeSeconds(startTime: Date): number {
  return Math.floor((Date.now() - startTime.getTime()) / 1000)
}
