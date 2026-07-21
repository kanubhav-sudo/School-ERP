import { apiClient } from '@/lib/axios'

export interface AdminDashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSections: number
  totalPendingFees: number
  totalCollectedFees: number
  todaysAttendance: number
  activeNotices: number
  activeSessionName: string
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { data } = await apiClient.get('/admin-dashboard/stats')
  return data.data
}
