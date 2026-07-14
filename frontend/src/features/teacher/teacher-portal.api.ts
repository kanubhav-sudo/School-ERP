/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient as api } from '@/lib/axios'

export interface DashboardStats {
  todayClasses: number
  pendingHomework: number
  totalStudents: number
  announcements: number
}

export interface MyClassAssignment {
  sessionId: string
  sessionName: string
  classId: string
  className: string
  sectionId: string
  sectionName: string
  isClassTeacher: boolean
  subjects: Array<{
    id: string
    name: string
    code: string
  }>
}

export interface SectionDto {
  id: string
  name: string
  classId: string
  className: string
}

export interface StudentDto {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  rollNumber: string | null
  gender: string
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/teacher-portal/dashboard-stats')
  return data.data
}

export async function fetchMyClasses(): Promise<MyClassAssignment[]> {
  const { data } = await api.get('/teacher-portal/my-classes')
  return data.data
}

export async function fetchTeacherSections(): Promise<SectionDto[]> {
  const { data } = await api.get('/teacher-portal/sections')
  return data.data
}

export async function fetchSectionStudents(sectionId: string): Promise<StudentDto[]> {
  const { data } = await api.get(`/teacher-portal/sections/${sectionId}/students`)
  return data.data.students
}

export async function fetchAttendanceSheet(sectionId: string, date: string): Promise<any> {
  const { data } = await api.get(`/teacher-portal/sections/${sectionId}/attendance`, {
    params: { date },
  })
  return data.data
}

export interface MarkAttendanceRecord {
  studentId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'
  remarks?: string
}

export async function markAttendance(payload: {
  date: string
  sectionId: string
  records: MarkAttendanceRecord[]
}): Promise<any> {
  const { data } = await api.post(
    `/teacher-portal/sections/${payload.sectionId}/attendance`,
    payload
  )
  return data.data
}
