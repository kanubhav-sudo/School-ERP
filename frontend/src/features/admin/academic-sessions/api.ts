import { apiClient } from '@/lib/axios'

export interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export async function fetchSessions(): Promise<AcademicSession[]> {
  const { data } = await apiClient.get('/academic-sessions')
  return data.data.sessions
}

export async function createSession(payload: Partial<AcademicSession>): Promise<AcademicSession> {
  const { data } = await apiClient.post('/academic-sessions', payload)
  return data.data
}

export async function updateSession({
  id,
  payload,
}: {
  id: string
  payload: Partial<AcademicSession>
}): Promise<AcademicSession> {
  const { data } = await apiClient.patch(`/academic-sessions/${id}`, payload)
  return data.data
}

export async function setActiveSession(id: string): Promise<AcademicSession> {
  const { data } = await apiClient.patch(`/academic-sessions/${id}/set-active`)
  return data.data
}

export async function deleteSession(id: string): Promise<void> {
  await apiClient.delete(`/academic-sessions/${id}`)
}
