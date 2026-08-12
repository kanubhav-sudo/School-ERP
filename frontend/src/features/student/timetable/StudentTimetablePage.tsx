import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export function StudentTimetablePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-timetable'],
    queryFn: studentPortalApi.getTimetable,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="bg-card border rounded-xl shadow-xs p-4 animate-pulse space-y-3">
          <div className="h-10 bg-muted/60 rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const { timetables, periods } = data || { timetables: [], periods: [] }

  // Create a 2D map for rendering: day -> period -> entry
  const tableMap = new Map()
  DAYS.forEach((d) => tableMap.set(d, new Map()))

  interface TimetableItem {
    dayOfWeek: string
    periodNumber: number
    subject: { name: string }
    teacher: { firstName: string; lastName: string }
  }

  interface PeriodItem {
    periodNumber: number
    startTime: string
    endTime: string
  }

  timetables.forEach((t: TimetableItem) => {
    if (tableMap.has(t.dayOfWeek)) {
      tableMap.get(t.dayOfWeek).set(t.periodNumber, t)
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 bg-muted/50 border-r">Day / Period</TableHead>
              {periods.map((p: PeriodItem) => (
                <TableHead key={p.periodNumber} className="text-center border-r min-w-[150px]">
                  <div>Period {p.periodNumber}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {p.startTime} - {p.endTime}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {DAYS.map((day) => (
              <TableRow key={day}>
                <TableCell className="font-semibold bg-muted/10 border-r">{day}</TableCell>
                {periods.map((p: PeriodItem) => {
                  const entry = tableMap.get(day)?.get(p.periodNumber)
                  return (
                    <TableCell key={p.periodNumber} className="text-center border-r align-top">
                      {entry ? (
                        <div className="p-2 bg-primary/5 rounded-lg border">
                          <div className="font-bold text-sm text-primary">{entry.subject.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {entry.teacher.firstName} {entry.teacher.lastName}
                          </div>
                          {entry.room && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              Room {entry.room}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground/30 text-xs">-</div>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
