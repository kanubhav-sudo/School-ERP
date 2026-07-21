import { useQuery } from '@tanstack/react-query'
import { fetchAdminDashboardStats } from './api'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function AdminDashboard() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchAdminDashboardStats,
    retry: 2,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 bg-card rounded-xl border border-border shadow-sm animate-pulse">
              <div className="h-3 bg-muted rounded w-24 mb-4" />
              <div className="h-8 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive opacity-60" />
          <p className="text-muted-foreground">Failed to load dashboard statistics.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>

      {/* People Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalStudents ?? 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Teachers</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalTeachers ?? 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Classes</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalClasses ?? 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Sections</h3>
          <div className="text-3xl font-bold mt-2">{stats?.totalSections ?? 0}</div>
        </div>
      </div>

      {/* Finance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Fees</h3>
          <div className="text-3xl font-bold mt-2 text-red-600">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((stats?.totalPendingFees ?? 0) / 100)}
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Collected Fees</h3>
          <div className="text-3xl font-bold mt-2 text-green-600">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((stats?.totalCollectedFees ?? 0) / 100)}
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Today's Attendance</h3>
          <div className="text-3xl font-bold mt-2">{stats?.todaysAttendance ?? 0}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Notices</h3>
          <div className="text-3xl font-bold mt-2">{stats?.activeNotices ?? 0}</div>
        </div>
      </div>

      {/* Session Info */}
      <div className="p-6 bg-card rounded-xl border border-border shadow-sm inline-block">
        <h3 className="text-sm font-medium text-muted-foreground">Active Session</h3>
        <div className="text-xl font-bold mt-2 text-primary">{stats?.activeSessionName ?? '-'}</div>
      </div>
    </div>
  )
}
