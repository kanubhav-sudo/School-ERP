import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  fetchTeacherTimetable,
  fetchAnnouncements,
  fetchMyClasses,
} from '../teacher-portal.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, CalendarDays, BellRing, Users, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export function TeacherDashboard() {
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
      .sort((a, b) => a.startTime.localeCompare(b.startTime)) || []

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

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
                        <span className="text-sm font-semibold">{item.startTime}</span>
                        <span className="text-xs text-muted-foreground">{item.endTime}</span>
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
    </div>
  )
}
