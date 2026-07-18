import { apiClient } from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'

export interface TimetableEntry {
  id: string
  dayOfWeek: DayOfWeek
  periodNumber: number
  room: string | null
  isOverride: boolean
  overrideDate: string | null
  createdById: string | null
  updatedById: string | null
  createdAt: string
  updatedAt: string
  session: { id: string; name: string }
  class: { id: string; name: string }
  section: { id: string; name: string }
  teacher: { id: string; firstName: string; lastName: string; employeeId: string }
  subject: { id: string; name: string; code: string }
}

export interface TimetableFilters {
  sessionId?: string
  sectionId?: string
  teacherId?: string
  classId?: string
  dayOfWeek?: DayOfWeek
}

export type CreateTimetablePayload = {
  sessionId: string
  classId: string
  sectionId: string
  teacherId: string
  subjectId: string
  dayOfWeek: DayOfWeek
  periodNumber: number
  room?: string
  isOverride: boolean
  overrideDate?: string
}

export type UpdateTimetablePayload = Partial<CreateTimetablePayload>

// ─── API Functions ────────────────────────────────────────────

export async function fetchTimetable(filters: TimetableFilters = {}): Promise<TimetableEntry[]> {
  const params = new URLSearchParams()
  if (filters.sessionId) params.set('sessionId', filters.sessionId)
  if (filters.sectionId) params.set('sectionId', filters.sectionId)
  if (filters.teacherId) params.set('teacherId', filters.teacherId)
  if (filters.classId) params.set('classId', filters.classId)
  if (filters.dayOfWeek) params.set('dayOfWeek', filters.dayOfWeek)

  const { data } = await apiClient.get(`/timetable?${params.toString()}`)
  return data.data
}

export async function fetchTimetableBySection(
  sectionId: string,
  sessionId?: string
): Promise<TimetableEntry[]> {
  const params = new URLSearchParams()
  if (sessionId) params.set('sessionId', sessionId)
  const query = params.toString() ? `?${params.toString()}` : ''
  const { data } = await apiClient.get(`/timetable/section/${sectionId}${query}`)
  return data.data
}

export async function fetchTimetableByTeacher(
  teacherId: string,
  sessionId?: string
): Promise<TimetableEntry[]> {
  const params = new URLSearchParams()
  if (sessionId) params.set('sessionId', sessionId)
  const query = params.toString() ? `?${params.toString()}` : ''
  const { data } = await apiClient.get(`/timetable/teacher/${teacherId}${query}`)
  return data.data
}

export async function createTimetable(payload: CreateTimetablePayload): Promise<TimetableEntry> {
  const { data } = await apiClient.post('/timetable', payload)
  return data.data
}

export async function updateTimetable({
  id,
  payload,
}: {
  id: string
  payload: UpdateTimetablePayload
}): Promise<TimetableEntry> {
  const { data } = await apiClient.patch(`/timetable/${id}`, payload)
  return data.data
}

export async function deleteTimetable(id: string): Promise<void> {
  await apiClient.delete(`/timetable/${id}`)
}
