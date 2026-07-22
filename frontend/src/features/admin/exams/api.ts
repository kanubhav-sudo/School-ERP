import { apiClient as api } from '@/lib/axios'

export interface ExamScheduleDto {
  id?: string
  subjectId: string
  examDate: string
  startTime: string
  endTime: string
  room?: string
  subject?: { id: string; name: string; code: string }
  day?: string
}

export interface ExamDto {
  id: string
  name: string
  sessionId: string
  classId?: string | null
  sectionId?: string | null
  startDate?: string | null
  endDate?: string | null
  status: 'DRAFT' | 'PUBLISHED'
  session?: { id: string; name: string }
  class?: { id: string; name: string } | null
  section?: { id: string; name: string } | null
  schedules?: ExamScheduleDto[]
  _count?: { schedules: number; reportCards: number; admitCards: number }
}

export async function fetchExams(params?: {
  sessionId?: string
  classId?: string
  status?: string
}): Promise<ExamDto[]> {
  const { data } = await api.get('/exams', { params })
  return data.data
}

export async function fetchExam(id: string): Promise<ExamDto> {
  const { data } = await api.get(`/exams/${id}`)
  return data.data
}

export async function createExam(payload: {
  sessionId: string
  classId?: string
  name: string
  startDate?: string
  endDate?: string
  status?: string
}): Promise<ExamDto> {
  const { data } = await api.post('/exams', payload)
  return data.data
}

export async function updateExam({
  id,
  payload,
}: {
  id: string
  payload: Partial<Parameters<typeof createExam>[0]>
}): Promise<ExamDto> {
  const { data } = await api.patch(`/exams/${id}`, payload)
  return data.data
}

export async function deleteExam(id: string): Promise<void> {
  await api.delete(`/exams/${id}`)
}

export async function saveExamSchedules({
  examId,
  schedules,
}: {
  examId: string
  schedules: ExamScheduleDto[]
}): Promise<any> {
  const { data } = await api.post(`/exams/${examId}/schedules`, { schedules })
  return data.data
}

export async function fetchAdmitCardStudents(sessionId: string, classId: string, examId?: string) {
  const { data } = await api.get('/exams/admit-card/students', {
    params: { sessionId, classId, examId },
  })
  return data.data
}

export async function updateAdmitCardStatus(payload: {
  sessionId: string
  examId?: string
  studentId: string
  status: 'RELEASED' | 'HOLD'
  remark?: string
}) {
  const { data } = await api.post('/exams/admit-card/status', payload)
  return data.data
}

export async function fetchResultStudents(sessionId: string, classId: string, examId: string) {
  const { data } = await api.get('/exams/result/students', {
    params: { sessionId, classId, examId },
  })
  return data.data
}

export async function updateResultStatus(payload: {
  examId: string
  studentId: string
  status: 'RELEASED' | 'HOLD'
  remark?: string
}) {
  const { data } = await api.post('/exams/result/status', payload)
  return data.data
}

export async function fetchSubjectMarks(examId: string, subjectId: string) {
  const { data } = await api.get(`/exams/${examId}/marks/subject/${subjectId}`)
  return data.data
}

export async function saveSubjectMarks(
  examId: string,
  subjectId: string,
  payload: {
    maxMarks: number
    marks: Array<{ studentId: string; obtainedMarks: number; remarks?: string }>
  }
) {
  const { data } = await api.post(`/exams/${examId}/marks/subject/${subjectId}`, payload)
  return data.data
}

export async function fetchStudentMarks(examId: string, studentId: string) {
  const { data } = await api.get(`/exams/${examId}/marks/student/${studentId}`)
  return data.data
}

export async function saveStudentMarks(
  examId: string,
  studentId: string,
  payload: {
    marks: Array<{ subjectId: string; maxMarks: number; obtainedMarks: number; remarks?: string }>
  }
) {
  const { data } = await api.post(`/exams/${examId}/marks/student/${studentId}`, payload)
  return data.data
}

export async function fetchExamTemplate(type: 'ADMIT_CARD' | 'RESULT') {
  const { data } = await api.get(`/exams/templates/${type}`)
  return data.data
}

export async function saveExamTemplate(type: 'ADMIT_CARD' | 'RESULT', payload: any) {
  const { data } = await api.post(`/exams/templates/${type}`, payload)
  return data.data
}
