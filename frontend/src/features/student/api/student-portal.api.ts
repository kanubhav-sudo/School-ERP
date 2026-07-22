import { apiClient } from '@/lib/axios'

export const studentPortalApi = {
  getDashboard: async () => {
    const { data } = await apiClient.get('/student-portal/dashboard')
    return data.data
  },
  getProfile: async () => {
    const { data } = await apiClient.get('/student-portal/profile')
    return data.data
  },
  getAttendance: async () => {
    const { data } = await apiClient.get('/student-portal/attendance')
    return data.data
  },
  getTimetable: async () => {
    const { data } = await apiClient.get('/student-portal/timetable')
    return data.data
  },
  getFees: async () => {
    const { data } = await apiClient.get('/student-portal/fees')
    return data.data
  },
  getNotices: async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const { data } = await apiClient.get(`/student-portal/notices?page=${page}&limit=${limit}`)
    return data.data as { notices: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
  },
  getAnnouncements: async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const { data } = await apiClient.get(`/student-portal/announcements?page=${page}&limit=${limit}`)
    return data.data as { announcements: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
  },
  getExams: async () => {
    const { data } = await apiClient.get('/student-portal/exams')
    return data.data
  },
  getHomework: async () => {
    const { data } = await apiClient.get('/student-portal/homework')
    return data.data
  },
  submitHomework: async (id: string, payload: FormData) => {
    const { data } = await apiClient.post(`/student-portal/homework/${id}/submit`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  }
}
