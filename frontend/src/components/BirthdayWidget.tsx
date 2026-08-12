/**
 * BirthdayWidget
 *
 * Reusable widget for displaying today's and upcoming birthdays on dashboards.
 * Used by Admin and Teacher dashboards (never Student — privacy).
 *
 * @module components/BirthdayWidget
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { Cake, GraduationCap, Users } from 'lucide-react'
import { format, isSameDay } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────

export interface BirthdayEntry {
  id: string
  name: string
  role: 'STUDENT' | 'TEACHER'
  class?: string | null
  designation?: string | null
  dateOfBirth: string
}

interface BirthdayWidgetProps {
  /** API prefix: 'admin-dashboard' or 'teacher-portal' */
  apiPrefix: 'admin-dashboard' | 'teacher-portal'
  mode: 'today' | 'upcoming'
}

// ─── Fetchers ─────────────────────────────────────────────────

async function fetchBirthdays(
  apiPrefix: string,
  mode: 'today' | 'upcoming'
): Promise<BirthdayEntry[]> {
  const { data } = await apiClient.get(`/${apiPrefix}/birthdays/${mode}`)
  return data.data
}

// ─── Helpers ──────────────────────────────────────────────────

function getDaysUntil(dob: string): number {
  const today = new Date()
  const d = new Date(dob)
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate())
  if (isSameDay(next, today)) return 0
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

function getDobDisplay(dob: string, mode: 'today' | 'upcoming'): string {
  if (mode === 'today') return '🎂 Today!'
  const days = getDaysUntil(dob)
  const d = new Date(dob)
  const next = new Date(new Date().getFullYear(), d.getMonth(), d.getDate())
  if (next < new Date()) next.setFullYear(new Date().getFullYear() + 1)

  if (days === 1) return `Tomorrow · ${format(next, 'MMM d')}`
  return `In ${days} days · ${format(next, 'MMM d')}`
}

// ─── Component ────────────────────────────────────────────────

export function BirthdayWidget({ apiPrefix, mode }: BirthdayWidgetProps) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: [`birthday-${apiPrefix}-${mode}`],
    queryFn: () => fetchBirthdays(apiPrefix, mode),
    staleTime: 5 * 60 * 1000,
  })

  const title = mode === 'today' ? "Today's Birthdays" : 'Upcoming Birthdays'
  const subtitle = mode === 'upcoming' ? 'Next 7 Days' : ''

  if (isLoading) {
    return (
      <div className="p-5 bg-card rounded-xl border shadow-xs space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-36" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 bg-card rounded-xl border shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cake className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <span className="text-xs text-muted-foreground">({subtitle})</span>}
        </div>
        {entries.length > 0 && (
          <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-800">
            {entries.length}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Cake className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            {mode === 'today' ? 'No birthdays today' : 'No upcoming birthdays in the next 7 days'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              {/* Role icon */}
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  entry.role === 'STUDENT'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                }`}
              >
                {entry.role === 'STUDENT' ? (
                  <GraduationCap className="h-3.5 w-3.5" />
                ) : (
                  <Users className="h-3.5 w-3.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{entry.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.class || entry.designation || entry.role}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-xs font-semibold ${
                    mode === 'today' ? 'text-rose-500' : 'text-muted-foreground'
                  }`}
                >
                  {getDobDisplay(entry.dateOfBirth, mode)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
