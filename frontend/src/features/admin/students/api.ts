import { apiClient } from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'EXPELLED'

export interface Student {
  id: string
  userId?: string | null
  admissionNumber: string
  rollNumber: string | null
  firstName: string
  lastName: string
  gender: Gender
  dateOfBirth: string | null
  bloodGroup: BloodGroup | null
  phone: string | null
  email: string | null
  photoUrl: string | null
  fatherName: string | null
  fatherPhone: string | null
  motherName: string | null
  motherPhone: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianRelation: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  address: string | null
  sessionId: string | null
  classId: string | null
  sectionId: string | null
  admissionDate: string
  status: StudentStatus
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  session: { id: string; name: string } | null
  class: { id: string; name: string } | null
  section: { id: string; name: string } | null
}

export interface StudentListResponse {
  students: Student[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface StudentFilters {
  page?: number
  limit?: number
  search?: string
  sessionId?: string
  classId?: string
  sectionId?: string
  status?: StudentStatus
  isActive?: boolean
}

export type CreateStudentPayload = {
  admissionNumber: string
  firstName: string
  lastName: string
  gender: Gender
  admissionDate: string
  rollNumber?: string
  dateOfBirth?: string
  bloodGroup?: BloodGroup
  phone?: string
  email?: string
  fatherName?: string
  fatherPhone?: string
  motherName?: string
  motherPhone?: string
  guardianName?: string
  guardianPhone?: string
  guardianRelation?: string
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
  sessionId?: string
  classId?: string
  sectionId?: string
  status?: StudentStatus
  notes?: string
  isActive?: boolean
}

// ─── API Functions ────────────────────────────────────────────

export async function fetchStudents(filters: StudentFilters = {}): Promise<StudentListResponse> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.search) params.set('search', filters.search)
  if (filters.sessionId) params.set('sessionId', filters.sessionId)
  if (filters.classId) params.set('classId', filters.classId)
  if (filters.sectionId) params.set('sectionId', filters.sectionId)
  if (filters.status) params.set('status', filters.status)
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))

  const { data } = await apiClient.get(`/students?${params.toString()}`)
  return data.data
}

export async function fetchStudent(id: string): Promise<Student> {
  const { data } = await apiClient.get(`/students/${id}`)
  return data.data
}

export interface CreateStudentResponse {
  student: Student
  credentials: {
    username: string
    temporaryPassword: string
  }
}

export async function createStudent(payload: CreateStudentPayload): Promise<CreateStudentResponse> {
  const { data } = await apiClient.post('/students', payload)
  return data.data
}

export async function updateStudent({
  id,
  payload,
}: {
  id: string
  payload: Partial<CreateStudentPayload>
}): Promise<Student> {
  const { data } = await apiClient.patch(`/students/${id}`, payload)
  return data.data
}

export async function deleteStudent(id: string): Promise<void> {
  await apiClient.delete(`/students/${id}`)
}
