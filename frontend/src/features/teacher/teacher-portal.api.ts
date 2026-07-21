/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient as api } from '@/lib/axios'

// ─── Dashboard ────────────────────────────────────────────────

export interface DashboardStats {
  todayClasses: number
  totalStudents: number
  recentNotices: number
  announcements: number
  pendingAttendance: number
  hasHomeworkModule: boolean
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/teacher-portal/dashboard-stats')
  return data.data
}

// ─── My Classes ───────────────────────────────────────────────

export interface MyClassAssignment {
  sessionId: string
  sessionName: string
  classId: string
  className: string
  sectionId: string
  sectionName: string
  isClassTeacher: boolean
  studentCount: number
  subjects: Array<{
    id: string
    name: string
    code: string
  }>
}

export async function fetchMyClasses(): Promise<MyClassAssignment[]> {
  const { data } = await api.get('/teacher-portal/my-classes')
  return data.data
}

// ─── Sections & Students ──────────────────────────────────────

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

export async function fetchTeacherSections(): Promise<SectionDto[]> {
  const { data } = await api.get('/teacher-portal/sections')
  return data.data
}

export async function fetchSectionStudents(sectionId: string): Promise<StudentDto[]> {
  const { data } = await api.get(`/teacher-portal/sections/${sectionId}/students`)
  return data.data.students
}

// ─── Attendance ───────────────────────────────────────────────

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

// ─── Timetable ────────────────────────────────────────────────

export interface TimetableEntry {
  id: string
  dayOfWeek: string
  periodNumber: number
  room: string | null
  session: { id: string; name: string }
  class: { id: string; name: string }
  section: { id: string; name: string }
  subject: { id: string; name: string; code: string }
}

export async function fetchTeacherTimetable(): Promise<TimetableEntry[]> {
  const { data } = await api.get('/teacher-portal/timetable')
  return data.data
}

// ─── Notices ──────────────────────────────────────────────────

export interface NoticeDto {
  id: string
  title: string
  content: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  targetRoles: string[]
  publishedAt: string
  expiresAt: string | null
  author: { id: string; username: string }
  attachments: string[]
}

export async function fetchNotices(): Promise<NoticeDto[]> {
  const { data } = await api.get('/teacher-portal/notices')
  return data.data
}

// ─── Announcements ────────────────────────────────────────────

export interface AnnouncementDto {
  id: string
  title: string
  content: string
  isPinned: boolean
  expiresAt: string | null
  attachments: string[]
  sessionId: string
  classId: string
  sectionId: string
  authorId: string
  createdAt: string
  updatedAt: string
  session: { name: string }
  class: { name: string }
  section: { name: string }
}

export async function fetchAnnouncements(): Promise<AnnouncementDto[]> {
  const { data } = await api.get('/teacher-portal/announcements')
  return data.data
}

export async function createAnnouncement(payload: {
  title: string
  content: string
  isPinned?: boolean
  expiresAt?: string
  sessionId: string
  classId: string
  sectionId: string
}): Promise<AnnouncementDto> {
  const { data } = await api.post('/teacher-portal/announcements', payload)
  return data.data
}

export async function updateAnnouncement(
  id: string,
  payload: {
    title?: string
    content?: string
    isPinned?: boolean
    expiresAt?: string | null
  }
): Promise<AnnouncementDto> {
  const { data } = await api.put(`/teacher-portal/announcements/${id}`, payload)
  return data.data
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/teacher-portal/announcements/${id}`)
}

// ─── Exams ────────────────────────────────────────────────────

export interface ExamDto {
  id: string
  sessionId: string
  name: string
  createdAt: string
}

export interface ExamStudentDto {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  rollNumber: string | null
  hasUnpaidFees: boolean
  admitCard: { id: string; fileUrl: string } | null
  reportCard: { id: string; fileUrl: string } | null
}

export async function fetchExams(): Promise<ExamDto[]> {
  const { data } = await api.get('/teacher-portal/exams')
  return data.data
}

export async function fetchExamStudents(
  sectionId: string,
  examId?: string
): Promise<ExamStudentDto[]> {
  const { data } = await api.get(`/teacher-portal/sections/${sectionId}/exam-students`, {
    params: examId ? { examId } : {},
  })
  return data.data
}

export async function uploadAdmitCard(payload: {
  sessionId: string
  studentId: string
  fileUrl: string
  sectionId: string
}): Promise<any> {
  const { data } = await api.post('/teacher-portal/admit-cards', payload)
  return data.data
}

export async function uploadReportCard(payload: {
  examId: string
  studentId: string
  fileUrl: string
  sectionId: string
}): Promise<any> {
  const { data } = await api.post('/teacher-portal/report-cards', payload)
  return data.data
}

// ─── Homework ─────────────────────────────────────────────────

export interface HomeworkDto {
  id: string
  title: string
  description: string | null
  dueDate: string
  attachmentUrl: string | null
  marks: number | null
  status: 'DRAFT' | 'PUBLISHED'
  sessionId: string
  classId: string
  sectionId: string
  subjectId: string
  teacherId: string
  class: { id: string; name: string }
  section: { id: string; name: string }
  subject: { id: string; name: string; code: string }
  _count: { submissions: number }
  createdAt: string
  updatedAt: string
}

export interface CreateHomeworkPayload {
  title: string
  description?: string
  dueDate: string
  attachmentUrl?: string
  marks?: number
  status: 'DRAFT' | 'PUBLISHED'
  sessionId: string
  classId: string
  sectionId: string
  subjectId: string
}

export interface UpdateHomeworkPayload {
  title?: string
  description?: string
  dueDate?: string
  attachmentUrl?: string
  marks?: number
  status?: 'DRAFT' | 'PUBLISHED'
}

export async function fetchTeacherHomeworks(filters?: {
  classId?: string
  sectionId?: string
  subjectId?: string
  status?: string
}): Promise<HomeworkDto[]> {
  const { data } = await api.get('/teacher-portal/homework', { params: filters })
  return data.data
}

export async function createHomework(payload: CreateHomeworkPayload): Promise<HomeworkDto> {
  const { data } = await api.post('/teacher-portal/homework', payload)
  return data.data
}

export async function updateHomework(id: string, payload: UpdateHomeworkPayload): Promise<HomeworkDto> {
  const { data } = await api.put(`/teacher-portal/homework/${id}`, payload)
  return data.data
}

export async function deleteHomework(id: string): Promise<void> {
  await api.delete(`/teacher-portal/homework/${id}`)
}

