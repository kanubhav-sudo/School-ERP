import { apiClient } from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'

export interface AttendanceRecordItem {
  id: string
  status: AttendanceStatus
  remarks: string | null
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
    rollNumber: string | null
  }
}

export interface AttendanceSheet {
  id: string
  date: string
  sectionId: string
  recordedById: string
  createdAt: string
  updatedAt: string
  section: { id: string; name: string }
  records: AttendanceRecordItem[]
}

export interface MarkAttendanceRecord {
  studentId: string
  status: AttendanceStatus
  remarks?: string
}

export interface MarkAttendancePayload {
  date: string // YYYY-MM-DD
  sectionId: string
  records: MarkAttendanceRecord[]
}

// ─── API Functions ────────────────────────────────────────────

/**
 * Get a single attendance sheet for a section on a given date.
 * Returns null if attendance has not been recorded yet.
 */
export async function fetchAttendanceSheet(
  sectionId: string,
  date: string
): Promise<AttendanceSheet | null> {
  const { data } = await apiClient.get(`/attendance/sheet?sectionId=${sectionId}&date=${date}`)
  return data.data
}

/**
 * List attendance sheets with optional sectionId / date filters.
 */
export async function fetchAttendanceList(params: {
  sectionId?: string
  date?: string
}): Promise<AttendanceSheet[]> {
  const query = new URLSearchParams()
  if (params.sectionId) query.set('sectionId', params.sectionId)
  if (params.date) query.set('date', params.date)
  const { data } = await apiClient.get(`/attendance?${query.toString()}`)
  return data.data
}

/**
 * Submit (upsert) attendance for a section on a given date.
 */
export async function markAttendance(payload: MarkAttendancePayload): Promise<AttendanceSheet> {
  const { data } = await apiClient.post('/attendance', payload)
  return data.data
}
