import { apiClient } from '@/lib/axios'

export interface SubjectData {
  id: string
  name: string
  code: string
  description?: string | null
  credits: number
  isActive: boolean
}

export async function fetchSubjects(): Promise<SubjectData[]> {
  const { data } = await apiClient.get('/subjects')
  return data.data.subjects || data.data
}

export async function createSubject(payload: Partial<SubjectData>): Promise<SubjectData> {
  const { data } = await apiClient.post('/subjects', payload)
  return data.data
}

export async function updateSubject({
  id,
  payload,
}: {
  id: string
  payload: Partial<SubjectData>
}): Promise<SubjectData> {
  const { data } = await apiClient.patch(`/subjects/${id}`, payload)
  return data.data
}

export async function deleteSubject(id: string): Promise<void> {
  await apiClient.delete(`/subjects/${id}`)
}
