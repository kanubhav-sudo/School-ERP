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
import { fetchTimetableBySection, deleteTimetable, type TimetableEntry } from './api'
import { fetchClasses } from '../classes/api'
import { fetchSections } from '../sections/api'
import { fetchPeriodMasters } from '../period-master/api'
import { fetchSessions } from '../academic-sessions/api'
import { TimetableForm } from './components/TimetableForm'
import { TimetableGrid } from './components/TimetableGrid'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export function TimetablePage() {
  const queryClient = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)

  // Dependencies for dropdowns
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClasses(),
  })
  const classes = classesData ?? []

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: () => fetchSections(),
  })
  const sections = (sectionsData ?? []).filter((s) => s.classId === selectedClassId)

  const { data: timetableEntries, isLoading: timetableLoading } = useQuery({
    queryKey: ['timetable', 'section', selectedSectionId],
    queryFn: () => fetchTimetableBySection(selectedSectionId),
    enabled: !!selectedSectionId,
  })

  // Period Master dependencies
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })
  
  const activeSessionId = sessionsData?.find((s) => s.isActive)?.id

  const { data: periodMasters, isLoading: periodsLoading } = useQuery({
    queryKey: ['periodMaster', activeSessionId],
    queryFn: () => fetchPeriodMasters(activeSessionId!),
    enabled: !!activeSessionId,
  })

  const isLoading = timetableLoading || periodsLoading

  const deleteMutation = useMutation({
    mutationFn: deleteTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
  })


  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingEntry(null)
    setIsFormOpen(true)
  }

  const handleDelete = (entry: TimetableEntry) => {
    if (
      confirm(`Remove ${entry.subject.name} on ${entry.dayOfWeek} period ${entry.periodNumber}?`)
    ) {
      deleteMutation.mutate(entry.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Timetable Management</h1>
        <Button onClick={handleCreate} disabled={!selectedSectionId}>
          Add Entry
        </Button>
      </div>

      {/* Selectors */}
      <div className="flex gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
        <div className="flex-1 max-w-xs space-y-2">
          <label className="text-sm font-medium">Class</label>
          <Select
            value={selectedClassId}
            onValueChange={(val) => {
              setSelectedClassId(val as string)
              setSelectedSectionId('')
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Class">
                {selectedClassId ? classes.find((c) => c.id === selectedClassId)?.name : undefined}
              </SelectValue>
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

        <div className="flex-1 max-w-xs space-y-2">
          <label className="text-sm font-medium">Section</label>
          <Select
            value={selectedSectionId}
            onValueChange={(val) => setSelectedSectionId(val as string)}
            disabled={!selectedClassId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Section">
                {selectedSectionId
                  ? sections.find((s) => s.id === selectedSectionId)?.name
                  : undefined}
              </SelectValue>
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
      </div>

      {/* Period Master warning */}
      {activeSessionId && (periodMasters ?? []).length === 0 && !periodsLoading && (
        <Alert variant="destructive" className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No periods configured for the active session.{' '}
            <a href="/admin/period-master" className="underline font-medium">Configure Period Master</a>{' '}
            before creating timetable entries.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid */}
      {selectedSectionId ? (
        isLoading ? (
          <div>Loading timetable...</div>
        ) : (
          <TimetableGrid
            entries={timetableEntries ?? []}
            periodMasters={periodMasters}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )
      ) : (
        <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          Please select a class and section to view the timetable.
        </div>
      )}

      {/* Form Dialog */}
      {isFormOpen && (
        <TimetableForm
          entry={editingEntry}
          sectionId={selectedSectionId}
          classId={selectedClassId}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  )
}
