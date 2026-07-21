import { useQuery } from '@tanstack/react-query'

import { fetchAdminDashboardStats } from './api'

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchAdminDashboardStats
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalStudents || 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Teachers</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalTeachers || 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Classes</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalClasses || 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Sections</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalSections || 0}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Fees</h3>
          <div className="text-3xl font-bold mt-2 text-red-600">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((stats?.totalPendingFees || 0) / 100)}
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Collected Fees</h3>
          <div className="text-3xl font-bold mt-2 text-green-600">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((stats?.totalCollectedFees || 0) / 100)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Today's Attendance</h3>
          <div className="text-3xl font-bold mt-2">{stats?.todaysAttendance || 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Notices</h3>
          <div className="text-3xl font-bold mt-2">{stats?.activeNotices || 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Session</h3>
          <div className="text-xl font-bold mt-2 text-primary">{stats?.activeSessionName || '-'}</div>
        </div>
      </div>
    </div>
  )
}
