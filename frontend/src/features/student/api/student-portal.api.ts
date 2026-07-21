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
  getNotices: async () => {
    const { data } = await apiClient.get('/student-portal/notices')
    return data.data
  },
  getAnnouncements: async () => {
    const { data } = await apiClient.get('/student-portal/announcements')
    return data.data
  },
  getExams: async () => {
    const { data } = await apiClient.get('/student-portal/exams')
    return data.data
  },
  getHomework: async () => {
    const { data } = await apiClient.get('/student-portal/homework')
    return data.data
  }
}
