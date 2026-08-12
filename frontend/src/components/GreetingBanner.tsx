/**
 * GreetingBanner
 *
 * Reusable dynamic greeting banner for all portals.
 * - Time-based greeting (morning/afternoon/evening)
 * - Multiple variants per time slot, rotated by day-of-year
 * - Birthday detection: shows birthday message when today = user's DOB
 * - Displays user name, school name, current date, academic session
 *
 * @module components/GreetingBanner
 */

import { format } from 'date-fns'
import { Cake, Sun, Cloud, Moon, Sparkles } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

export interface GreetingBannerProps {
  profileName: string
  schoolName?: string
  sessionName?: string
  dateOfBirth?: string | null
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN'
  onViewBirthdayCard?: () => void
}

// ─── Greeting Data ─────────────────────────────────────────────

const MORNING_GREETINGS = [
  'Good Morning',
  'Rise and Shine',
  "Good Morning — Let's Make Today Count",
  'A Wonderful Morning to You',
  'Good Morning — Ready to Inspire?',
  'Great Morning Ahead',
  'Morning! The Day is Full of Possibilities',
]

const AFTERNOON_GREETINGS = [
  'Good Afternoon',
  'Hope Your Day is Going Well',
  'Good Afternoon — Keep Up the Great Work',
  "Halfway Through — You're Doing Great",
  'Good Afternoon — Stay Focused',
  'The Afternoon is Yours',
  'Good Afternoon — Keep the Energy Up',
]

const EVENING_GREETINGS = [
  'Good Evening',
  'Well Done Today',
  'Good Evening — Time to Wind Down',
  'A Productive Day Deserves a Great Evening',
  'Good Evening — Rest Up for Tomorrow',
  "The Day's Work is Done — Well Done",
  'Good Evening — You Earned It',
]

// ─── Helpers ──────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function isBirthdayToday(dateOfBirth?: string | null): boolean {
  if (!dateOfBirth) return false
  const dob = new Date(dateOfBirth)
  const today = new Date()
  return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()
}

function getGreeting(): { text: string; icon: React.ReactNode; gradient: string } {
  const hour = new Date().getHours()
  const day = getDayOfYear()

  if (hour >= 5 && hour < 12) {
    const greeting = MORNING_GREETINGS[day % MORNING_GREETINGS.length]
    return {
      text: greeting,
      icon: <Sun className="h-5 w-5 text-amber-500" />,
      gradient:
        'from-amber-50 via-orange-50/60 to-transparent dark:from-amber-950/20 dark:via-orange-950/10 dark:to-transparent',
    }
  } else if (hour >= 12 && hour < 17) {
    const greeting = AFTERNOON_GREETINGS[day % AFTERNOON_GREETINGS.length]
    return {
      text: greeting,
      icon: <Cloud className="h-5 w-5 text-sky-500" />,
      gradient:
        'from-sky-50 via-blue-50/60 to-transparent dark:from-sky-950/20 dark:via-blue-950/10 dark:to-transparent',
    }
  } else {
    const greeting = EVENING_GREETINGS[day % EVENING_GREETINGS.length]
    return {
      text: greeting,
      icon: <Moon className="h-5 w-5 text-indigo-500" />,
      gradient:
        'from-indigo-50 via-purple-50/60 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent',
    }
  }
}

function getFirstName(profileName: string): string {
  return profileName.split(' ')[0]
}

// ─── Component ────────────────────────────────────────────────

export function GreetingBanner({
  profileName,
  schoolName,
  sessionName,
  dateOfBirth,
  onViewBirthdayCard,
}: GreetingBannerProps) {
  const isToday = isBirthdayToday(dateOfBirth)
  const { text: greetingText, icon: greetingIcon, gradient } = getGreeting()
  const firstName = getFirstName(profileName)
  const today = new Date()
  const formattedDate = format(today, 'EEEE, d MMMM yyyy')

  if (isToday) {
    // ── Birthday mode ──────────────────────────────────────────
    return (
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-purple-500/5 rounded-xl border border-rose-200 dark:border-rose-800">
        {/* Confetti dots */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full animate-bounce opacity-60"
              style={{
                width: `${4 + (i % 5) * 2}px`,
                height: `${4 + (i % 5) * 2}px`,
                left: `${(i * 17 + 3) % 95}%`,
                top: `${(i * 23 + 5) % 80}%`,
                animationDuration: `${0.8 + (i % 4) * 0.4}s`,
                animationDelay: `${(i % 5) * 0.1}s`,
                backgroundColor: ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c'][
                  i % 6
                ],
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Cake className="h-6 w-6 text-rose-500 animate-bounce" />
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              🎉 Happy Birthday, {firstName}!
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            We wish you happiness, success, and a wonderful year ahead.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            {schoolName && <span className="font-medium text-foreground/70">· {schoolName}</span>}
            {sessionName && (
              <span className="font-medium text-foreground/70">· Session: {sessionName}</span>
            )}
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          {onViewBirthdayCard && (
            <button
              onClick={onViewBirthdayCard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg text-sm font-semibold shadow-md hover:from-rose-600 hover:to-pink-600 transition-all duration-200 hover:shadow-lg"
            >
              <Cake className="h-4 w-4" />
              View Birthday Card
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Normal greeting mode ──────────────────────────────────────
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r ${gradient} rounded-xl border`}
    >
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          {greetingIcon}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greetingText}, {firstName}!
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
          <span className="font-medium">{formattedDate}</span>
          {schoolName && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="font-medium text-foreground/70">{schoolName}</span>
            </span>
          )}
          {sessionName && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="font-medium text-foreground/70">Session: {sessionName}</span>
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <Sparkles className="h-8 w-8 text-primary/20" />
      </div>
    </div>
  )
}
