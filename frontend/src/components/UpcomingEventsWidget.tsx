/**
 * UpcomingEventsWidget
 *
 * Lightweight upcoming events widget for all dashboards.
 * Sources data from existing ERP endpoints — no new calendar module.
 * Shows: Exams, Homework Due, Fee Due within next 7 days.
 *
 * @module components/UpcomingEventsWidget
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { BookOpen, FileText, Clock, CalendarDays } from 'lucide-react'
import { format, addDays, isToday, isTomorrow, startOfDay } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────

interface EventItem {
  id: string
  type: 'EXAM' | 'HOMEWORK' | 'FEE'
  title: string
  date: Date
  badge?: string
}

type PortalType = 'admin' | 'teacher' | 'student'

interface UpcomingEventsWidgetProps {
  portal: PortalType
}

// ─── Fetchers ─────────────────────────────────────────────────

interface ExamRecord {
  id: string
  examDate?: string
  date?: string
  examName?: string
  name?: string
  title?: string
  className?: string
  class?: { name: string }
}

async function fetchExams(portal: PortalType): Promise<EventItem[]> {
  const endpoint =
    portal === 'admin'
      ? '/exams'
      : portal === 'teacher'
        ? '/teacher-portal/exams'
        : '/student-portal/exams'

  const { data } = await apiClient
    .get(endpoint, { params: { limit: 50 } })
    .catch(() => ({ data: { data: [] } }))
  const exams: ExamRecord[] = Array.isArray(data.data) ? data.data : (data.data?.exams ?? [])
  const now = startOfDay(new Date())
  const cutoff = addDays(now, 8)

  return exams
    .filter((e) => {
      const d = new Date(e.examDate || e.date || '')
      return d >= now && d <= cutoff
    })
    .map((e) => ({
      id: `exam-${e.id}`,
      type: 'EXAM' as const,
      title: e.examName || e.name || e.title || 'Exam',
      date: new Date(e.examDate || e.date || ''),
      badge: e.className || e.class?.name || '',
    }))
}

interface HomeworkRecord {
  id: string
  dueDate?: string
  date?: string
  title?: string
  subject?: { name: string }
  subjectName?: string
}

async function fetchHomeworkDue(portal: PortalType): Promise<EventItem[]> {
  const endpoint =
    portal === 'admin'
      ? '/homework'
      : portal === 'teacher'
        ? '/teacher-portal/homework'
        : '/student-portal/homework'

  const { data } = await apiClient
    .get(endpoint, { params: { limit: 50 } })
    .catch(() => ({ data: { data: [] } }))
  const hw: HomeworkRecord[] = Array.isArray(data.data) ? data.data : (data.data?.homework ?? [])
  const now = startOfDay(new Date())
  const cutoff = addDays(now, 8)

  return hw
    .filter((h) => {
      const d = new Date(h.dueDate || h.date || '')
      return d >= now && d <= cutoff
    })
    .map((h) => ({
      id: `hw-${h.id}`,
      type: 'HOMEWORK' as const,
      title: h.title || 'Homework Due',
      date: new Date(h.dueDate || h.date || ''),
      badge: h.subject?.name || h.subjectName || '',
    }))
}

// ─── Date Label ───────────────────────────────────────────────

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, MMM d')
}

// ─── Icon & Color ─────────────────────────────────────────────

function getEventStyle(type: EventItem['type']): {
  icon: React.ReactNode
  color: string
  bg: string
} {
  switch (type) {
    case 'EXAM':
      return {
        icon: <FileText className="h-3.5 w-3.5" />,
        color: 'text-purple-600',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
      }
    case 'HOMEWORK':
      return {
        icon: <BookOpen className="h-3.5 w-3.5" />,
        color: 'text-amber-600',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
      }
    case 'FEE':
      return {
        icon: <Clock className="h-3.5 w-3.5" />,
        color: 'text-rose-600',
        bg: 'bg-rose-100 dark:bg-rose-900/30',
      }
  }
}

// ─── Component ────────────────────────────────────────────────

export function UpcomingEventsWidget({ portal }: UpcomingEventsWidgetProps) {
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: [`upcoming-exams-${portal}`],
    queryFn: () => fetchExams(portal),
    staleTime: 10 * 60 * 1000,
  })

  const { data: homework = [], isLoading: hwLoading } = useQuery({
    queryKey: [`upcoming-homework-${portal}`],
    queryFn: () => fetchHomeworkDue(portal),
    staleTime: 10 * 60 * 1000,
  })

  const isLoading = examsLoading || hwLoading

  const allEvents: EventItem[] = [...exams, ...homework].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  return (
    <div className="p-5 bg-card rounded-xl border shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Upcoming Events</h3>
        <span className="text-xs text-muted-foreground">(Next 7 Days)</span>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      ) : allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No upcoming events in the next 7 days</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allEvents.slice(0, 6).map((event) => {
            const style = getEventStyle(event.type)
            const dateLabel = getDateLabel(event.date)
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div className={`p-1.5 rounded-md shrink-0 ${style.bg} ${style.color}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                  {event.badge && (
                    <p className="text-[10px] text-muted-foreground truncate">{event.badge}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded ${
                    isToday(event.date)
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {dateLabel}
                </span>
              </div>
            )
          })}
          {allEvents.length > 6 && (
            <p className="text-xs text-center text-muted-foreground pt-1">
              +{allEvents.length - 6} more events
            </p>
          )}
        </div>
      )}
    </div>
  )
}
