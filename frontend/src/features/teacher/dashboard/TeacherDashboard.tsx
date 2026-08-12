import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  fetchDashboardStats,
  fetchTeacherTimetable,
  fetchAnnouncements,
  fetchMyClasses,
} from '../teacher-portal.api'
import { useAuth } from '@/context/AuthContext'
import { useTenant } from '@/context/TenantContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GreetingBanner } from '@/components/GreetingBanner'
import { DailyMotivation } from '@/components/DailyMotivation'
import { BirthdayWidget } from '@/components/BirthdayWidget'
import { BirthdayCardModal } from '@/components/BirthdayCardModal'
import { UpcomingEventsWidget } from '@/components/UpcomingEventsWidget'
import {
  Clock,
  CalendarDays,
  BellRing,
  Users,
  CheckCircle,
  CalendarCheck,
  BookOpen,
  Megaphone,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'

export function TeacherDashboard() {
  const { user } = useAuth()
  const { schoolSlug } = useTenant()
  const [showBirthdayCard, setShowBirthdayCard] = useState(false)

  const schoolDisplayName = schoolSlug
    ? schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Your School'

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ['teacher-dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  const { data: timetable, isLoading: timetableLoading } = useQuery({
    queryKey: ['teacher-timetable'],
    queryFn: fetchTeacherTimetable,
  })

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['teacher-announcements'],
    queryFn: () => fetchAnnouncements(1, 10),
  })

  const announcementsList = announcementsData?.announcements ?? []

  const { data: myClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-my-classes'],
    queryFn: fetchMyClasses,
  })

  // Get today's day of week: MONDAY, TUESDAY etc.
  const todayDayOfWeek = format(new Date(), 'EEEE').toUpperCase()

  const todayClasses =
    timetable
      ?.filter((t) => t.dayOfWeek === todayDayOfWeek)
      .sort((a, b) => (a.period?.startTime || '').localeCompare(b.period?.startTime || '')) || []

  const renderStatCard = (
    title: string,
    value: React.ReactNode,
    icon: React.ReactNode,
    loading: boolean
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{statsError ? '-' : value}</div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-5">
      {/* Greeting Banner */}
      <GreetingBanner
        profileName={user?.profileName || user?.username || 'Teacher'}
        schoolName={schoolDisplayName}
        dateOfBirth={user?.dateOfBirth}
        role="TEACHER"
        onViewBirthdayCard={() => setShowBirthdayCard(true)}
      />

      {/* Daily Motivation */}
      <DailyMotivation />

      {/* Birthday Card Modal */}
      <BirthdayCardModal
        open={showBirthdayCard}
        onClose={() => setShowBirthdayCard(false)}
        name={user?.profileName || user?.username || 'Teacher'}
        role="TEACHER"
        schoolName={schoolDisplayName}
      />

      {/* Stat Cards */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatCard(
          "Today's Classes",
          stats?.todayClasses ?? 0,
          <CalendarDays className="h-4 w-4 text-muted-foreground" />,
          statsLoading
        )}
        {renderStatCard(
          'Total Students',
          stats?.totalStudents ?? 0,
          <Users className="h-4 w-4 text-muted-foreground" />,
          statsLoading
        )}
        {renderStatCard(
          'Pending Attendance',
          stats?.pendingAttendance ?? 0,
          <CheckCircle className="h-4 w-4 text-muted-foreground" />,
          statsLoading
        )}
        {renderStatCard(
          'Announcements',
          stats?.announcements ?? 0,
          <BellRing className="h-4 w-4 text-muted-foreground" />,
          statsLoading
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {timetableLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : todayClasses.length > 0 ? (
              <div className="space-y-4">
                {todayClasses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-2 min-w-[80px]">
                        <span className="text-sm font-semibold">
                          {item.period?.startTime || '-'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.period?.endTime || '-'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{item.subject.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>
                            Class {item.class.name} {item.section.name}
                          </span>
                          {item.room && <span>• Room {item.room}</span>}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Period {item.periodNumber}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No classes scheduled for today.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {announcementsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : announcementsList && announcementsList.length > 0 ? (
                <div className="space-y-4">
                  {announcementsList.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-primary pl-4 py-1">
                      <p className="text-sm font-medium line-clamp-1">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        {format(new Date(announcement.createdAt), 'MMM d, yyyy')} •{' '}
                        {announcement.class.name} {announcement.section.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent announcements.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Classes Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : myClasses && myClasses.length > 0 ? (
                <div className="space-y-3">
                  {myClasses.slice(0, 4).map((cls) => (
                    <div
                      key={cls.sectionId}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {cls.className} - {cls.sectionName}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cls.subjects.slice(0, 3).map((sub) => (
                            <Badge key={sub.id} variant="secondary" className="text-[10px]">
                              {sub.name}
                            </Badge>
                          ))}
                          {cls.subjects.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{cls.subjects.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {cls.isClassTeacher && (
                        <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0 flex shrink-0 h-6">
                          Class Teacher
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  You have not been assigned to any classes yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Birthday Widgets + Upcoming Events */}
      <div className="grid gap-4 md:grid-cols-3">
        <BirthdayWidget apiPrefix="teacher-portal" mode="today" />
        <BirthdayWidget apiPrefix="teacher-portal" mode="upcoming" />
        <UpcomingEventsWidget portal="teacher" />
      </div>

      {/* Quick Actions */}
      <div className="p-5 bg-card rounded-xl border shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/teacher/attendance"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Take Attendance</p>
              <p className="text-xs text-muted-foreground">Mark today's records</p>
            </div>
          </Link>
          <Link
            to="/teacher/homework"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Add Homework</p>
              <p className="text-xs text-muted-foreground">Assign to a section</p>
            </div>
          </Link>
          <Link
            to="/teacher/exams"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Enter Marks</p>
              <p className="text-xs text-muted-foreground">Upload exam results</p>
            </div>
          </Link>
          <Link
            to="/teacher/announcements"
            className="p-4 rounded-xl border bg-muted/30 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Post Announcement</p>
              <p className="text-xs text-muted-foreground">Notify your class</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
