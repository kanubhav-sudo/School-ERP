import { apiClient } from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────

export type NoticePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type Role = 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface Notice {
  id: string
  title: string
  content: string
  priority: NoticePriority
  targetRoles: Role[]
  targetClassIds: string[]
  publishedAt: string
  expiresAt: string | null
  authorId: string
  attachments: string[]
  author: {
    id: string
    username: string
    email: string
  }
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type CreateNoticePayload = {
  title: string
  content: string
  priority?: NoticePriority
  targetRoles?: Role[]
  targetClassIds?: string[]
  publishedAt?: string
  expiresAt?: string | null
  attachments?: string[]
}

export type UpdateNoticePayload = Partial<CreateNoticePayload>

export interface NoticeFilters {
  activeOnly?: boolean
  role?: Role
  classId?: string
}

// ─── API Functions ────────────────────────────────────────────

export async function fetchNotices(filters: NoticeFilters = {}): Promise<Notice[]> {
  const params = new URLSearchParams()
  if (filters.activeOnly !== undefined) params.set('activeOnly', String(filters.activeOnly))
  if (filters.role) params.set('role', filters.role)
  if (filters.classId) params.set('classId', filters.classId)

  const { data } = await apiClient.get(`/notices?${params.toString()}`)
  return data.data
}

export async function fetchNotice(id: string): Promise<Notice> {
  const { data } = await apiClient.get(`/notices/${id}`)
  return data.data
}

export async function createNotice(payload: CreateNoticePayload): Promise<Notice> {
  const { data } = await apiClient.post('/notices', payload)
  return data.data
}

export async function updateNotice({
  id,
  payload,
}: {
  id: string
  payload: UpdateNoticePayload
}): Promise<Notice> {
  const { data } = await apiClient.patch(`/notices/${id}`, payload)
  return data.data
}

export async function deleteNotice(id: string): Promise<void> {
  await apiClient.delete(`/notices/${id}`)
}
