import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { studentPortalApi } from '../api/student-portal.api'
import { useAuth } from '@/context/AuthContext'
import { useTenant } from '@/context/TenantContext'
import { GreetingBanner } from '@/components/GreetingBanner'
import { DailyMotivation } from '@/components/DailyMotivation'
import { BirthdayCardModal } from '@/components/BirthdayCardModal'
import { UpcomingEventsWidget } from '@/components/UpcomingEventsWidget'
import {
  Calendar,
  FileText,
  Activity,
  BookOpen,
  Bell,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  CreditCard,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export function StudentDashboard() {
  const { user } = useAuth()
  const { schoolSlug } = useTenant()
  const [showBirthdayCard, setShowBirthdayCard] = useState(false)

  const schoolDisplayName = schoolSlug
    ? schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Your School'

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: studentPortalApi.getDashboard,
    retry: 2,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 bg-card rounded-xl border shadow-xs animate-pulse space-y-3"
            >
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-20" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-6 bg-card rounded-xl border shadow-xs animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
          <div className="p-6 bg-card rounded-xl border shadow-xs animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-28" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed rounded-xl bg-card">
          <AlertCircle className="h-12 w-12 text-destructive opacity-60" />
          <p className="text-muted-foreground text-sm font-medium">
            Failed to load dashboard data.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const stats = dashboard?.stats
  const student = dashboard?.student
  const attendancePct = stats?.attendancePercentage ?? 0
  const isGoodAttendance = attendancePct >= 75

  const formatCurrency = (amountInPaise: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format((amountInPaise || 0) / 100)

  return (
    <div className="space-y-5">
      {/* Greeting Banner — detects user's own birthday via dateOfBirth from /auth/me */}
      <GreetingBanner
        profileName={user?.profileName || user?.firstName || student?.firstName || 'Student'}
        schoolName={schoolDisplayName}
        dateOfBirth={user?.dateOfBirth}
        role="STUDENT"
        onViewBirthdayCard={() => setShowBirthdayCard(true)}
      />

      {/* Daily Motivation */}
      <DailyMotivation />

      {/* Birthday Card Modal */}
      <BirthdayCardModal
        open={showBirthdayCard}
        onClose={() => setShowBirthdayCard(false)}
        name={user?.profileName || student?.firstName || 'Student'}
        role="STUDENT"
        schoolName={schoolDisplayName}
        subtitle={
          student?.class?.name && student?.section?.name
            ? `Class ${student.class.name} - ${student.section.name}`
            : undefined
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Attendance */}
        <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Attendance</span>
            <div
              className={`p-2 rounded-lg ${isGoodAttendance ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
            >
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-extrabold mt-3 ${isGoodAttendance ? 'text-emerald-600' : 'text-rose-500'}`}
          >
            {attendancePct}%
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${isGoodAttendance ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(attendancePct, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Present: {stats?.presentDays ?? 0} · Absent: {stats?.absentDays ?? 0}
            </p>
          </div>
        </div>

        {/* Fees Due */}
        <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Fees Due</span>
            <div
              className={`p-2 rounded-lg ${(stats?.pendingFeeAmount ?? 0) > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}
            >
              {(stats?.pendingFeeAmount ?? 0) > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold mt-3 ${(stats?.pendingFeeAmount ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}
          >
            {(stats?.pendingFeeAmount ?? 0) > 0
              ? formatCurrency(stats!.pendingFeeAmount)
              : 'All Clear'}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {stats?.pendingFromMonth ? `Due from ${stats.pendingFromMonth}` : 'No outstanding dues'}
          </p>
        </div>

        {/* Upcoming Exams */}
        <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Upcoming Exams</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold mt-3">{stats?.upcomingExams ?? 0}</div>
          <p className="mt-2 text-[11px] text-muted-foreground">Scheduled in current session</p>
        </div>

        {/* Pending Homework */}
        <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending Homework</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold mt-3">{stats?.pendingAssignments ?? 0}</div>
          <p className="mt-2 text-[11px] text-muted-foreground">Assignments to complete</p>
        </div>
      </div>

      {/* Timetable & Latest Notice */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Timetable */}
        <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/30">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Today's Schedule
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              {format(new Date(), 'EEEE')}
            </Badge>
          </div>
          <div className="p-4">
            {dashboard?.todayTimetable?.length ? (
              <div className="space-y-2">
                {(
                  dashboard.todayTimetable as Array<{
                    periodNumber: number
                    subjectName: string
                    teacherName: string
                    startTime?: string
                    endTime?: string
                  }>
                ).map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {t.periodNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{t.subjectName}</p>
                      <p className="text-[11px] text-muted-foreground">{t.teacherName}</p>
                    </div>
                    {(t.startTime || t.endTime) && (
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                        {t.startTime}
                        {t.endTime ? `–${t.endTime}` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No classes today</p>
                <p className="text-xs text-muted-foreground mt-1">Enjoy your free day!</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Notice */}
        <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-muted/30">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Latest Notice</h3>
          </div>
          <div className="p-4">
            {dashboard?.latestNotice ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{dashboard.latestNotice.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(
                        (dashboard.latestNotice as { publishedAt: string }).publishedAt
                      ).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 border">
                  <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                    {(dashboard.latestNotice as { content: string }).content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No notices yet</p>
                <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events + Quick Nav */}
      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingEventsWidget portal="student" />

        {/* Quick Navigation Cards */}
        <div className="p-5 bg-card rounded-xl border shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-foreground">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/student/homework"
              className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex flex-col gap-2"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 w-fit">
                <BookOpen className="h-4 w-4" />
              </div>
              <p className="font-semibold text-xs">Homework</p>
            </Link>
            <Link
              to="/student/timetable"
              className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex flex-col gap-2"
            >
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 w-fit">
                <CalendarDays className="h-4 w-4" />
              </div>
              <p className="font-semibold text-xs">Timetable</p>
            </Link>
            <Link
              to="/student/fees"
              className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex flex-col gap-2"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 w-fit">
                <CreditCard className="h-4 w-4" />
              </div>
              <p className="font-semibold text-xs">Fee Status</p>
            </Link>
            <Link
              to="/student/exams"
              className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex flex-col gap-2"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 w-fit">
                <FileText className="h-4 w-4" />
              </div>
              <p className="font-semibold text-xs">Exams & Results</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
