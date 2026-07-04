import { apiClient } from '@/lib/axios'

export interface ClassData {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
}

export async function fetchClasses(): Promise<ClassData[]> {
  const { data } = await apiClient.get('/classes')
  // Depending on API response, data could be in data.data or data.data.classes
  return data.data.classes || data.data
}

export async function createClass(payload: Partial<ClassData>): Promise<ClassData> {
  const { data } = await apiClient.post('/classes', payload)
  return data.data
}

export async function updateClass({
  id,
  payload,
}: {
  id: string
  payload: Partial<ClassData>
}): Promise<ClassData> {
  const { data } = await apiClient.patch(`/classes/${id}`, payload)
  return data.data
}

export async function deleteClass(id: string): Promise<void> {
  await apiClient.delete(`/classes/${id}`)
}
