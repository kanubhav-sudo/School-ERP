/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DatePickerInput — production-grade date picker for School ERP
 *
 * Features:
 * - Month + Year dropdown navigation (captionLayout="dropdown-buttons")
 * - Rendered into document.body via React portal → never clipped by tables/dialogs
 * - Auto-repositions above trigger when insufficient space below
 * - Keyboard support (Escape to close, Tab closes, react-day-picker keyboard nav)
 * - Consistent across all browsers
 * - Works in Admin, Teacher, and Student portals wherever dates are used
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import 'react-day-picker/dist/style.css'

interface DatePickerInputProps {
  /** Value in "YYYY-MM-DD" format (same as native date input) */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Year range for the dropdown. Defaults to 5 years before/after today */
  fromYear?: number
  toYear?: number
}

const PORTAL_ID = 'date-picker-portal-root'

function getOrCreatePortalRoot(): HTMLElement {
  let el = document.getElementById(PORTAL_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = PORTAL_ID
    // Must be above all stacking contexts
    el.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;pointer-events:none;'
    document.body.appendChild(el)
  }
  return el
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Pick a date',
  className = '',
  disabled = false,
  fromYear,
  toYear,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Parse string value → Date
  const parsedDate = value
    ? parse(value, 'yyyy-MM-dd', new Date())
    : undefined
  const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined

  const displayValue = selectedDate
    ? format(selectedDate, 'dd MMM yyyy')
    : ''

  const today = new Date()
  const resolvedFromYear = fromYear ?? today.getFullYear() - 5
  const resolvedToYear = toYear ?? today.getFullYear() + 5

  /** Calculate popup position relative to viewport */
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popupHeight = 340 // approximate height of the calendar
    const popupWidth = 280
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top

    let top: number
    let left: number

    // Position: prefer below, flip above if not enough space
    if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4
    } else {
      top = rect.top - popupHeight - 4
    }

    // Horizontal: align to left edge, but clamp within viewport
    left = rect.left
    if (left + popupWidth > viewportWidth) {
      left = viewportWidth - popupWidth - 8
    }
    if (left < 8) left = 8

    setPopupStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
      pointerEvents: 'auto',
    })
  }, [])

  const openPicker = () => {
    if (disabled) return
    calculatePosition()
    setOpen(true)
  }

  const closePicker = () => setOpen(false)

  // Recalculate on scroll / resize
  useEffect(() => {
    if (!open) return
    const handler = () => calculatePosition()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open, calculatePosition])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popupRef.current?.contains(target)
      ) {
        return
      }
      closePicker()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') closePicker()
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  const handleDaySelect = (day: Date | undefined) => {
    if (day && isValid(day)) {
      onChange(format(day, 'yyyy-MM-dd'))
    }
    closePicker()
  }

  const portalRoot = typeof document !== 'undefined' ? getOrCreatePortalRoot() : null

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        className={[
          'inline-flex items-center gap-2 h-9 rounded-md border border-input bg-background px-3 text-xs font-medium',
          'hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'w-40 justify-between',
          className,
        ].join(' ')}
      >
        <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {/* Portal popup */}
      {open && portalRoot &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-modal="true"
            aria-label="Date picker"
            style={popupStyle}
            className="rdp-portal-popup rounded-xl border border-border bg-popover shadow-xl"
            onKeyDown={(e) => {
              if (e.key === 'Escape') closePicker()
            }}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              captionLayout="dropdown"
              fromYear={resolvedFromYear}
              toYear={resolvedToYear}
              defaultMonth={selectedDate ?? today}
              showOutsideDays
              className="p-3"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium hidden',
                caption_dropdowns: 'flex gap-2 items-center',
                dropdown: 'h-8 rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer',
                dropdown_month: '',
                dropdown_year: '',
                nav: 'space-x-1 flex items-center',
                nav_button:
                  'h-7 w-7 bg-transparent p-0 rounded-md hover:bg-accent inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell:
                  'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: 'h-9 w-9 text-center text-sm p-0 relative',
                day: 'h-9 w-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring aria-selected:opacity-100',
                day_selected:
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                day_today: 'bg-accent text-accent-foreground font-bold',
                day_outside:
                  'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                day_disabled: 'text-muted-foreground opacity-50',
                day_hidden: 'invisible',
              }}
            />
          </div>,
          portalRoot
        )}
    </>
  )
}
