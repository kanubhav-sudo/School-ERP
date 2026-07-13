import { apiClient } from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────

export interface FeePlan {
  id: string
  name: string
  sessionId: string
  classId: string
  monthlyAmount: number // paise from backend
  description: string | null
  isActive: boolean
  createdById: string | null
  updatedById: string | null
  createdAt: string
  updatedAt: string
  session: { id: string; name: string; isActive: boolean }
  class: { id: string; name: string }
  _count: { students: number }
}

export interface FeePlanListResponse {
  feePlans: FeePlan[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FeePlanFilters {
  page?: number
  limit?: number
  sessionId?: string
  classId?: string
  isActive?: boolean
}

export interface CreateFeePlanPayload {
  name: string
  sessionId: string
  classId: string
  monthlyAmount: number // whole rupees – backend converts to paise
  description?: string
  isActive?: boolean
}

// ─── API Functions ────────────────────────────────────────────

export async function fetchFeePlans(filters: FeePlanFilters = {}): Promise<FeePlanListResponse> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.sessionId) params.set('sessionId', filters.sessionId)
  if (filters.classId) params.set('classId', filters.classId)
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))

  const { data } = await apiClient.get(`/fee-plans?${params.toString()}`)
  return data.data
}

export async function fetchFeePlan(id: string): Promise<FeePlan> {
  const { data } = await apiClient.get(`/fee-plans/${id}`)
  return data.data
}

export async function createFeePlan(payload: CreateFeePlanPayload): Promise<FeePlan> {
  const { data } = await apiClient.post('/fee-plans', payload)
  return data.data
}

export async function updateFeePlan({
  id,
  payload,
}: {
  id: string
  payload: Partial<CreateFeePlanPayload>
}): Promise<FeePlan> {
  const { data } = await apiClient.patch(`/fee-plans/${id}`, payload)
  return data.data
}

export async function deleteFeePlan(id: string): Promise<void> {
  await apiClient.delete(`/fee-plans/${id}`)
}
