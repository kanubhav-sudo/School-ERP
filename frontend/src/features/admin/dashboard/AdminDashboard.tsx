import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchAdminDashboardStats } from './api'
import { useAuth } from '@/context/AuthContext'
import { useTenant } from '@/context/TenantContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GreetingBanner } from '@/components/GreetingBanner'
import { DailyMotivation } from '@/components/DailyMotivation'
import { BirthdayWidget } from '@/components/BirthdayWidget'
import { BirthdayCardModal } from '@/components/BirthdayCardModal'
import { UpcomingEventsWidget } from '@/components/UpcomingEventsWidget'
import {
  Users,
  GraduationCap,
  School,
  Grid,
  CreditCard,
  CheckCircle2,
  CalendarCheck,
  Bell,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  UserPlus,
  UserCheck,
  Megaphone,
  BookOpen,
} from 'lucide-react'

export function AdminDashboard() {
  const { user } = useAuth()
  const { schoolSlug } = useTenant()
  const [showBirthdayCard, setShowBirthdayCard] = useState(false)

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchAdminDashboardStats,
    retry: 2,
  })

  // Derive a display name for the school from slug
  const schoolDisplayName = schoolSlug
    ? schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Your School'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted rounded-xl animate-pulse" />
        <div className="h-10 bg-muted/60 rounded-lg animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-6 bg-card rounded-xl border shadow-sm animate-pulse space-y-3"
            >
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-20" />
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
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed rounded-xl bg-card">
          <AlertCircle className="h-12 w-12 text-destructive opacity-60" />
          <p className="text-muted-foreground text-sm font-medium">
            Failed to load dashboard statistics.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amountInPaise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format((amountInPaise || 0) / 100)
  }

  return (
    <div className="space-y-5">
      {/* Greeting Banner */}
      <GreetingBanner
        profileName={user?.profileName || user?.username || 'Admin'}
        schoolName={schoolDisplayName}
        sessionName={stats?.activeSessionName}
        dateOfBirth={user?.dateOfBirth}
        role="ADMIN"
        onViewBirthdayCard={() => setShowBirthdayCard(true)}
      />

      {/* Daily Motivation */}
      <DailyMotivation />

      {/* Birthday Card Modal */}
      <BirthdayCardModal
        open={showBirthdayCard}
        onClose={() => setShowBirthdayCard(false)}
        name={user?.profileName || user?.username || 'Admin'}
        role="ADMIN"
        schoolName={schoolDisplayName}
        principalName={user?.profileName}
      />

      {/* Active Session Badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border w-fit text-xs font-semibold shadow-xs">
        <Calendar className="h-4 w-4 text-primary" />
        <span>Active Session:</span>
        <span className="text-primary font-bold">{stats?.activeSessionName || '2026-2027'}</span>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold hover:bg-primary/20 ml-1">
          v1.0 Live
        </Badge>
      </div>

      {/* School Population & Structure */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          School Population &amp; Structure
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Students</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3">{stats?.totalStudents ?? 0}</div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Enrolled across classes</span>
              <Link
                to="/admin/students"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Teachers</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3">{stats?.totalTeachers ?? 0}</div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Active faculty members</span>
              <Link
                to="/admin/teachers"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active Classes</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <School className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3">{stats?.totalClasses ?? 0}</div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Configured grades</span>
              <Link
                to="/admin/classes"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Sections</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Grid className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3">{stats?.totalSections ?? 0}</div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Class divisions</span>
              <Link
                to="/admin/sections"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Financial & Operational Pulse */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Financial &amp; Operational Pulse
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Pending Fees</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold mt-3 text-amber-600">
              {formatCurrency(stats?.totalPendingFees ?? 0)}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Outstanding balance</span>
              <Link
                to="/admin/finance/fee-records"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                Manage <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Collected Fees</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold mt-3 text-emerald-600">
              {formatCurrency(stats?.totalCollectedFees ?? 0)}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Paid in session</span>
              <Link
                to="/admin/finance/fee-records"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                Records <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Today's Attendance
              </span>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3">{stats?.todaysAttendance ?? 0}</div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Records marked today</span>
              <Link
                to="/admin/attendance"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                Register <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active Notices</span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                <Bell className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3">{stats?.activeNotices ?? 0}</div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Published on board</span>
              <Link
                to="/admin/notices"
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                Board <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Birthday Widgets + Upcoming Events */}
      <div className="grid gap-4 md:grid-cols-3">
        <BirthdayWidget apiPrefix="admin-dashboard" mode="today" />
        <BirthdayWidget apiPrefix="admin-dashboard" mode="upcoming" />
        <UpcomingEventsWidget portal="admin" />
      </div>

      {/* Quick Action Hub */}
      <div className="p-6 bg-card rounded-xl border shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/students?action=add"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Add Student</p>
              <p className="text-xs text-muted-foreground">Enrol a new student</p>
            </div>
          </Link>

          <Link
            to="/admin/teachers?action=add"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Add Teacher</p>
              <p className="text-xs text-muted-foreground">Register faculty member</p>
            </div>
          </Link>

          <Link
            to="/admin/attendance"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Take Attendance</p>
              <p className="text-xs text-muted-foreground">Mark today's attendance</p>
            </div>
          </Link>

          <Link
            to="/admin/notices?action=create"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Post Notice</p>
              <p className="text-xs text-muted-foreground">Publish to noticeboard</p>
            </div>
          </Link>

          <Link
            to="/admin/homework?action=create"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Create Homework</p>
              <p className="text-xs text-muted-foreground">Assign to a class</p>
            </div>
          </Link>

          <Link
            to="/admin/documents"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Document Engine</p>
              <p className="text-xs text-muted-foreground">Admit &amp; Report Cards</p>
            </div>
          </Link>

          <Link
            to="/admin/finance/fee-records"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Fee Collection</p>
              <p className="text-xs text-muted-foreground">Collect &amp; log payments</p>
            </div>
          </Link>

          <Link
            to="/admin/settings"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-slate-500/10 text-slate-600">
              <School className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">School Settings</p>
              <p className="text-xs text-muted-foreground">Profile &amp; subscription</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
