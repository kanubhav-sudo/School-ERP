import { type TimetableEntry, type DayOfWeek } from '../api'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Clock, MapPin } from 'lucide-react'

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

interface TimetableGridProps {
  entries: TimetableEntry[]
  onEdit: (entry: TimetableEntry) => void
  onDelete: (entry: TimetableEntry) => void
}

export function TimetableGrid({ entries, onEdit, onDelete }: TimetableGridProps) {
  // Create a map: Day -> Period -> Entry
  const gridMap = new Map<DayOfWeek, Map<number, TimetableEntry>>()
  DAYS.forEach((d) => gridMap.set(d, new Map()))

  entries.forEach((e) => {
    gridMap.get(e.dayOfWeek)?.set(e.periodNumber, e)
  })

  // Find max period number actually used, but at least 5
  let maxPeriodUsed = 5
  entries.forEach((e) => {
    if (e.periodNumber > maxPeriodUsed) maxPeriodUsed = e.periodNumber
  })

  const periods = Array.from({ length: maxPeriodUsed }, (_, i) => i + 1)

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
          <tr>
            <th className="p-3 font-medium w-32 border-r border-border">Day / Period</th>
            {periods.map((p) => (
              <th
                key={p}
                className="p-3 font-medium text-center min-w-[200px] border-r border-border last:border-0"
              >
                Period {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {DAYS.map((day) => (
            <tr key={day} className="divide-x divide-border">
              <td className="p-3 font-medium bg-muted/20 text-muted-foreground">{day}</td>
              {periods.map((p) => {
                const entry = gridMap.get(day)?.get(p)
                return (
                  <td
                    key={p}
                    className="p-2 align-top h-32 relative group hover:bg-accent/30 transition-colors"
                  >
                    {entry ? (
                      <div className="flex flex-col h-full bg-background rounded-lg border border-border p-3 shadow-sm relative">
                        <div className="font-semibold text-primary">{entry.subject.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {entry.teacher.firstName} {entry.teacher.lastName}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-2 space-x-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.startTime}-{entry.endTime}
                          </span>
                          {entry.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {entry.room}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => onEdit(entry)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(entry)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs italic">
                        Free Period
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
