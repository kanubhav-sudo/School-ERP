import { apiClient } from '@/lib/axios'
import type { TimetableEntry } from '../timetable/api'

// ─── Types ────────────────────────────────────────────────────

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type EmploymentStatus = 'PERMANENT' | 'CONTRACT' | 'PROBATION' | 'RESIGNED' | 'TERMINATED'
export type TeacherDesignation =
  | 'PRINCIPAL'
  | 'VICE_PRINCIPAL'
  | 'COORDINATOR'
  | 'SENIOR_TEACHER'
  | 'TEACHER'
  | 'ASSISTANT_TEACHER'
export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'

export interface TeacherAssignment {
  id: string
  sessionId: string
  isClassTeacher: boolean
  session?: { id: string; name: string }
  class: { id: string; name: string }
  section: { id: string; name: string }
  subject: { id: string; name: string; code: string }
}

export interface Teacher {
  id: string
  userId?: string | null
  employeeId: string
  firstName: string
  lastName: string
  gender: Gender
  dateOfBirth: string | null
  phone: string | null
  email: string
  qualification: string | null
  experienceYears: number
  department: string | null
  designation: TeacherDesignation
  joiningDate: string
  employmentStatus: EmploymentStatus
  address: string | null
  bloodGroup: BloodGroup | null
  emergencyContact: string | null
  emergencyPhone: string | null
  photoUrl: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  assignments: TeacherAssignment[]
}

export interface TeacherListResponse {
  teachers: Teacher[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface TeacherFilters {
  page?: number
  limit?: number
  search?: string
  department?: string
  employmentStatus?: EmploymentStatus
  isActive?: boolean
  sessionId?: string
  classId?: string
  subjectId?: string
}

export type CreateTeacherPayload = {
  employeeId: string
  firstName: string
  lastName: string
  gender: Gender
  email: string
  joiningDate: string
  dateOfBirth?: string
  phone?: string
  qualification?: string
  experienceYears?: number
  department?: string
  designation?: TeacherDesignation
  employmentStatus?: EmploymentStatus
  address?: string
  bloodGroup?: BloodGroup
  emergencyContact?: string
  emergencyPhone?: string
  photoUrl?: string
  notes?: string
  isActive?: boolean
}

export interface TeacherStats {
  total: number
  active: number
  inactive: number
  classTeachers: number
}

// ─── API Functions ────────────────────────────────────────────

export async function fetchTeachers(filters: TeacherFilters = {}): Promise<TeacherListResponse> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.search) params.set('search', filters.search)
  if (filters.department) params.set('department', filters.department)
  if (filters.employmentStatus) params.set('employmentStatus', filters.employmentStatus)
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))
  if (filters.sessionId) params.set('sessionId', filters.sessionId)
  if (filters.classId) params.set('classId', filters.classId)
  if (filters.subjectId) params.set('subjectId', filters.subjectId)

  const { data } = await apiClient.get(`/teachers?${params.toString()}`)
  return data.data
}

export async function fetchTeacher(id: string): Promise<Teacher> {
  const { data } = await apiClient.get(`/teachers/${id}`)
  return data.data
}

export interface CreateTeacherResponse {
  teacher: Teacher
  credentials: {
    username: string
    temporaryPassword: string
  }
}

export async function createTeacher(payload: CreateTeacherPayload): Promise<CreateTeacherResponse> {
  const { data } = await apiClient.post('/teachers', payload)
  return data.data
}

export async function updateTeacher({
  id,
  payload,
}: {
  id: string
  payload: Partial<CreateTeacherPayload>
}): Promise<Teacher> {
  const { data } = await apiClient.patch(`/teachers/${id}`, payload)
  return data.data
}

export async function deleteTeacher(id: string): Promise<void> {
  await apiClient.delete(`/teachers/${id}`)
}

export async function addTeacherAssignment(
  teacherId: string,
  payload: {
    sessionId: string
    classId: string
    sectionId: string
    subjectId: string
    isClassTeacher?: boolean
  }
): Promise<TeacherAssignment> {
  const { data } = await apiClient.post(`/teachers/${teacherId}/assignments`, payload)
  return data.data
}

export async function removeTeacherAssignment(
  teacherId: string,
  assignmentId: string
): Promise<void> {
  await apiClient.delete(`/teachers/${teacherId}/assignments/${assignmentId}`)
}

export async function fetchTeacherStats(sessionId?: string): Promise<TeacherStats> {
  const params = new URLSearchParams()
  if (sessionId) params.set('sessionId', sessionId)
  const { data } = await apiClient.get(`/teachers/stats?${params.toString()}`)
  return data.data
}

export async function fetchTeacherTimetable(
  teacherId: string,
  sessionId?: string
): Promise<TimetableEntry[]> {
  const params = new URLSearchParams()
  if (sessionId) params.set('sessionId', sessionId)
  const { data } = await apiClient.get(`/teachers/${teacherId}/timetable?${params.toString()}`)
  return data.data
}

export async function fetchTeacherSections(
  teacherId: string,
  sessionId?: string
): Promise<TeacherAssignment[]> {
  const params = new URLSearchParams()
  if (sessionId) params.set('sessionId', sessionId)
  const { data } = await apiClient.get(`/teachers/${teacherId}/sections?${params.toString()}`)
  return data.data
}
