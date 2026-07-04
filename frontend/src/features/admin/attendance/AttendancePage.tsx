import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchClasses } from '../classes/api'
import { fetchSections } from '../sections/api'
import { fetchStudents } from '../students/api'
import { fetchAttendanceSheet, markAttendance, type MarkAttendanceRecord } from './api'
import { AttendanceGrid, type StudentRow } from './components/AttendanceGrid'

// ─── Helpers ──────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Page ─────────────────────────────────────────────────────

export function AttendancePage() {
  const queryClient = useQueryClient()

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [pendingRecords, setPendingRecords] = useState<MarkAttendanceRecord[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ─── Dropdowns ──────────────────────────────────────────────

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })
  const classes = classesData ?? []

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: fetchSections,
  })
  const sections = (sectionsData ?? []).filter((s) => s.classId === selectedClassId)

  // ─── Students enrolled in section ────────────────────────────

  const { data: studentsData } = useQuery({
    queryKey: ['students', { sectionId: selectedSectionId }],
    queryFn: () => fetchStudents({ sectionId: selectedSectionId, limit: 200, page: 1 }),
    enabled: !!selectedSectionId,
  })

  const students: StudentRow[] = (studentsData?.students ?? []).map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    admissionNumber: s.admissionNumber,
    rollNumber: s.rollNumber,
  }))

  // ─── Existing Attendance Sheet ────────────────────────────────

  const { data: existingSheet } = useQuery({
    queryKey: ['attendance', 'sheet', selectedSectionId, selectedDate],
    queryFn: () => fetchAttendanceSheet(selectedSectionId, selectedDate),
    enabled: !!selectedSectionId && !!selectedDate,
  })

  // ─── Save Mutation ────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: () =>
      markAttendance({
        date: selectedDate,
        sectionId: selectedSectionId,
        records: pendingRecords,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const canSave = !!selectedSectionId && !!selectedDate && students.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mark daily attendance for a class section.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : saveSuccess ? '✓ Saved' : 'Save Attendance'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
        {/* Class */}
        <div className="flex-1 min-w-[160px] max-w-xs space-y-1.5">
          <label className="text-sm font-medium">Class</label>
          <Select
            value={selectedClassId}
            onValueChange={(val) => {
              setSelectedClassId(val ?? '')
              setSelectedSectionId('')
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section */}
        <div className="flex-1 min-w-[160px] max-w-xs space-y-1.5">
          <label className="text-sm font-medium">Section</label>
          <Select
            value={selectedSectionId}
            onValueChange={(val) => setSelectedSectionId(val ?? '')}
            disabled={!selectedClassId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec) => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="flex-1 min-w-[160px] max-w-xs space-y-1.5">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Status badge */}
        {existingSheet && (
          <div className="flex items-end pb-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
              ✓ Already recorded — editing will overwrite
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      {selectedSectionId ? (
        <AttendanceGrid
          students={students}
          existingRecords={existingSheet?.records ?? []}
          onChange={setPendingRecords}
        />
      ) : (
        <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          Please select a class and section to mark attendance.
        </div>
      )}

      {/* Error */}
      {saveMutation.isError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          Failed to save attendance. Please try again.
        </div>
      )}
    </div>
  )
}
