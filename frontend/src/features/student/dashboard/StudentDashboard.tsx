import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Calendar, FileText, Activity } from 'lucide-react'

export function StudentDashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: studentPortalApi.getDashboard,
  })

  if (isLoading) return <div>Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {dashboard?.student?.firstName} {dashboard?.student?.lastName}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Attendance</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className={`text-3xl font-bold mt-2 ${dashboard?.stats?.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
            {dashboard?.stats?.attendancePercentage}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">Present: {dashboard?.stats?.presentDays}, Absent: {dashboard?.stats?.absentDays}</p>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Fees Due</h3>
            <span className="text-muted-foreground text-sm font-bold">₹</span>
          </div>
          <div className="text-3xl font-bold mt-2 text-red-500">₹{dashboard?.stats?.pendingFeeAmount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {dashboard?.stats?.pendingFromMonth ? `From ${dashboard.stats.pendingFromMonth}` : 'All clear'}
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Upcoming Exams</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold mt-2">{dashboard?.stats?.upcomingExams}</div>
          <p className="text-xs text-muted-foreground mt-1">Scheduled in current session</p>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Homework</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold mt-2">{dashboard?.stats?.pendingAssignments}</div>
          <p className="text-xs text-muted-foreground mt-1">Check homework module</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Today's Timetable</h3>
          {dashboard?.todayTimetable?.length ? (
            <div className="space-y-3">
              {dashboard.todayTimetable.map((t: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Period {t.periodNumber}</div>
                    <div className="font-bold">{t.subjectName}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{t.teacherName}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No classes today.</div>
          )}
        </div>

        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Latest Notice</h3>
          {dashboard?.latestNotice ? (
            <div className="flex-1 bg-muted p-4 rounded-lg flex flex-col">
              <div className="font-bold text-lg mb-2">{dashboard.latestNotice.title}</div>
              <p className="text-sm text-muted-foreground flex-1">{dashboard.latestNotice.content}</p>
              <div className="text-xs text-muted-foreground mt-4 text-right">
                {new Date(dashboard.latestNotice.publishedAt).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No notices available.</div>
          )}
        </div>
      </div>
    </div>
  )
}
