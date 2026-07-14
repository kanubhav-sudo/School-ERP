import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchTeacherSections,
  fetchSectionStudents,
  fetchAttendanceSheet,
  markAttendance,
  type MarkAttendanceRecord,
} from '../teacher-portal.api'
import { AttendanceGrid, type StudentRow } from '../../admin/attendance/components/AttendanceGrid'

// ─── Helpers ──────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Page ─────────────────────────────────────────────────────

export function TeacherAttendancePage() {
  const queryClient = useQueryClient()

  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [pendingRecords, setPendingRecords] = useState<MarkAttendanceRecord[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ─── Dropdowns ──────────────────────────────────────────────

  const { data: sectionsData, isLoading: isLoadingSections } = useQuery({
    queryKey: ['teacher-sections'],
    queryFn: () => fetchTeacherSections(),
  })
  const sections = sectionsData ?? []

  // ─── Students enrolled in section ────────────────────────────

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['teacher-students', selectedSectionId],
    queryFn: () => fetchSectionStudents(selectedSectionId),
    enabled: !!selectedSectionId,
  })

  const students: StudentRow[] = useMemo(() => {
    return (studentsData ?? []).map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      admissionNumber: s.admissionNumber,
      rollNumber: s.rollNumber,
    }))
  }, [studentsData])

  // ─── Existing Attendance Sheet ────────────────────────────────

  const { data: existingSheet, isLoading: isLoadingSheet } = useQuery({
    queryKey: ['teacher-attendance-sheet', selectedSectionId, selectedDate],
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
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sheet'] })
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
            Mark daily attendance for your assigned sections.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : saveSuccess ? '✓ Saved' : 'Save Attendance'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
        {/* Section */}
        <div className="flex-1 min-w-[240px] max-w-sm space-y-1.5">
          <label className="text-sm font-medium">Class & Section</label>
          <Select
            value={selectedSectionId}
            onValueChange={(val) => setSelectedSectionId(val ?? '')}
            disabled={isLoadingSections}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingSections ? 'Loading...' : 'Select your section'}>
                {selectedSectionId
                  ? sections.find((s) => s.id === selectedSectionId)?.className +
                    ' - ' +
                    sections.find((s) => s.id === selectedSectionId)?.name
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sections.length === 0 && (
                <SelectItem value="none" disabled>
                  No sections assigned
                </SelectItem>
              )}
              {sections.map((sec) => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.className} - {sec.name}
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
        isLoadingStudents || isLoadingSheet ? (
          <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
            Loading data...
          </div>
        ) : (
          <AttendanceGrid
            students={students}
            existingRecords={existingSheet?.records}
            onChange={setPendingRecords}
          />
        )
      ) : (
        <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          Please select a section to mark attendance.
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
