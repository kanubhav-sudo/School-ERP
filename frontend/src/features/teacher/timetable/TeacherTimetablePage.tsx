import { useQuery } from '@tanstack/react-query'
import { fetchTeacherTimetable } from '../teacher-portal.api'
import { fetchPeriodMasters } from '../../admin/period-master/api'
import { TimetableGrid } from '../../admin/timetable/components/TimetableGrid'
import { Skeleton } from '@/components/ui/skeleton'

export function TeacherTimetablePage() {
  const {
    data: timetable,
    isLoading: timetableLoading,
    isError,
  } = useQuery({
    queryKey: ['teacher-timetable'],
    queryFn: fetchTeacherTimetable,
  })

  const sessionId = timetable?.[0]?.session?.id

  const { data: periodMasters, isLoading: periodsLoading } = useQuery({
    queryKey: ['periodMaster', sessionId],
    queryFn: () => fetchPeriodMasters(sessionId!),
    enabled: !!sessionId,
  })

  const isLoading = timetableLoading || (!!sessionId && periodsLoading)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <div className="p-8 text-center text-destructive">Failed to load timetable.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your weekly teaching schedule
        </p>
      </div>

      <div className="mt-6">
        {timetable && timetable.length > 0 ? (
          <TimetableGrid
            // @ts-expect-error - Teacher API format slightly differs from Admin API format but the grid accepts it anyway
            entries={timetable}
            periodMasters={periodMasters}
          />
        ) : (
          <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
            No classes scheduled.
          </div>
        )}
      </div>
    </div>
  )
}
