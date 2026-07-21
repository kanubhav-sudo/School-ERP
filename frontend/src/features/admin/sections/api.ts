import { apiClient } from '@/lib/axios'
import type { ClassData } from '../classes/api'

export interface SectionData {
  id: string
  name: string
  classId: string
  class?: ClassData
  capacity: number
  roomNumber?: string
  displayOrder: number
  isActive: boolean
}

export async function fetchSections(params?: { classId?: string }): Promise<SectionData[]> {
  const { data } = await apiClient.get('/sections', { params })
  return data.data.sections || data.data
}

export async function createSection(payload: Partial<SectionData>): Promise<SectionData> {
  const { data } = await apiClient.post('/sections', payload)
  return data.data
}

export async function updateSection({
  id,
  payload,
}: {
  id: string
  payload: Partial<SectionData>
}): Promise<SectionData> {
  const { data } = await apiClient.patch(`/sections/${id}`, payload)
  return data.data
}

export async function deleteSection(id: string): Promise<void> {
  await apiClient.delete(`/sections/${id}`)
}
