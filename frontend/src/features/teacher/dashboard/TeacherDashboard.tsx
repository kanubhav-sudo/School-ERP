import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats } from '../teacher-portal.api'

export function TeacherDashboard() {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['teacher-dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Today's Classes</h3>
          <div className="text-3xl font-bold mt-2">
            {isLoading ? '...' : isError ? '-' : (stats?.todayClasses ?? 0)}
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Homework</h3>
          <div className="text-3xl font-bold mt-2">
            {isLoading ? '...' : isError ? '-' : (stats?.pendingHomework ?? 0)}
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
          <div className="text-3xl font-bold mt-2">
            {isLoading ? '...' : isError ? '-' : (stats?.totalStudents ?? 0)}
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Announcements</h3>
          <div className="text-3xl font-bold mt-2">
            {isLoading ? '...' : isError ? '-' : (stats?.announcements ?? 0)}
          </div>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground">
        Schedule & Tasks Widget Placeholder
      </div>
    </div>
  )
}
