import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTimetable, updateTimetable, type TimetableEntry } from '../api'
import { fetchTeachers } from '../../teachers/api'
import { fetchSubjects } from '../../subjects/api'
import { fetchSessions } from '../../academic-sessions/api'
import { fetchPeriodMasters } from '../../period-master/api'


const formSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
  periodNumber: z.number().min(1).max(10),
  room: z.string().optional(),
  isOverride: z.boolean(),
  overrideDate: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface TimetableFormProps {
  entry: TimetableEntry | null
  sectionId: string
  classId: string
  onClose: () => void
}


export function TimetableForm({ entry, sectionId, classId, onClose }: TimetableFormProps) {
  const queryClient = useQueryClient()

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', { limit: 100 }],
    queryFn: () => fetchSubjects(),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetchSessions(),
  })

  // Try to find the active session by default
  const activeSessionId = sessionsData?.find((s) => s.isActive)?.id ?? ''

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: entry
      ? {
          sessionId: entry.session.id,
          teacherId: entry.teacher.id,
          subjectId: entry.subject.id,
          dayOfWeek: entry.dayOfWeek,
          periodNumber: entry.periodNumber,
          room: entry.room ?? '',
          isOverride: entry.isOverride ?? false,
          overrideDate: entry.overrideDate ? new Date(entry.overrideDate).toISOString().split('T')[0] : '',
        }
      : {
          sessionId: activeSessionId,
          dayOfWeek: 'MONDAY',
          periodNumber: 1,
          room: '',
          isOverride: false,
          overrideDate: '',
        },
  })

  // Watch values for select components
  const dayOfWeek = watch('dayOfWeek')
  const teacherId = watch('teacherId')
  const subjectId = watch('subjectId')
  const sessionId = watch('sessionId')
  const isOverride = watch('isOverride')

  // Filter teachers by selected session + class (only show assigned teachers when possible)
  const { data: teachersData } = useQuery({
    queryKey: ['teachers', { isActive: true, limit: 100, sessionId: sessionId || undefined, classId: classId || undefined }],
    queryFn: () => fetchTeachers({ isActive: true, limit: 100, sessionId: sessionId || undefined, classId: classId || undefined }),
  })

  // Load Period Master for selected session
  const { data: periodMasters } = useQuery({
    queryKey: ['periodMaster', sessionId],
    queryFn: () => fetchPeriodMasters(sessionId!),
    enabled: !!sessionId,
  })

  const sortedPeriods = (periodMasters ?? []).sort((a, b) => a.periodNumber - b.periodNumber)

  // Auto-populate active session when sessions data loads (create mode only).
  // defaultValues are frozen at mount, so we use setValue once the async
  // query resolves and we know the active session ID.
  useEffect(() => {
    if (!entry && activeSessionId && !sessionId) {
      setValue('sessionId', activeSessionId)
    }
  }, [activeSessionId, entry, sessionId, setValue])

  const createMutation = useMutation({
    mutationFn: createTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
      onClose()
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Failed to save timetable entry')
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
      onClose()
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Failed to save timetable entry')
    },
  })

  const onSubmit = (data: FormData) => {
    // Clean up overrideDate for backend validation (z.string().datetime().optional())
    const payload = { ...data }
    if (payload.isOverride && payload.overrideDate) {
      payload.overrideDate = new Date(payload.overrideDate).toISOString()
    } else {
      delete payload.overrideDate
    }

    if (entry) {
      updateMutation.mutate({ id: entry.id, payload })
    } else {
      createMutation.mutate({
        ...payload,
        sectionId,
        classId,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {entry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="timetable-form" onSubmit={handleSubmit(onSubmit as SubmitHandler<FormData>)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Session</label>
              <Select
                value={sessionId || ''}
                onValueChange={(val) => setValue('sessionId', val as string)}
              >
                <SelectTrigger className={errors.sessionId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select Session">
                    {sessionId
                      ? sessionsData?.find((s) => s.id === sessionId)?.name
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sessionsData?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.isActive ? '(Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sessionId && (
                <p className="text-xs text-destructive">{errors.sessionId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Day of Week</label>
                <Select
                  value={dayOfWeek || ''}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onValueChange={(val) => setValue('dayOfWeek', val as any)}
                >
                  <SelectTrigger className={errors.dayOfWeek ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select Day">
                      {dayOfWeek}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(
                      (d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {errors.dayOfWeek && (
                  <p className="text-xs text-destructive">{errors.dayOfWeek.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <Select
                  value={watch('periodNumber')?.toString() || ''}
                  onValueChange={(val) => setValue('periodNumber', parseInt(val))}
                >
                  <SelectTrigger className={errors.periodNumber ? 'border-destructive' : ''}>
                    <SelectValue placeholder={sortedPeriods.length === 0 ? 'No periods configured' : 'Select Period'}>
                      {watch('periodNumber')
                        ? (() => {
                            // eslint-disable-next-line react-hooks/incompatible-library
                            const pm = sortedPeriods.find((p) => p.periodNumber === watch('periodNumber'))
                            return pm
                              ? `Period ${pm.periodNumber} (${pm.startTime}–${pm.endTime})`
                              : `Period ${watch('periodNumber')}`
                          })()
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sortedPeriods.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No periods — configure Period Master first
                      </SelectItem>
                    ) : (
                      sortedPeriods.map((p) => (
                        <SelectItem key={p.periodNumber} value={p.periodNumber.toString()}>
                          Period {p.periodNumber} — {p.startTime} to {p.endTime}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.periodNumber && (
                  <p className="text-xs text-destructive">{errors.periodNumber.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-md border border-border p-4 bg-muted/50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOverride"
                  {...register('isOverride')}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isOverride" className="text-sm font-medium">
                  Apply to this date only (Today only / Override)
                </label>
              </div>
              
              {isOverride && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Override Date</label>
                  <Input
                    type="date"
                    {...register('overrideDate')}
                    className={errors.overrideDate ? 'border-destructive' : ''}
                  />
                  {errors.overrideDate && (
                    <p className="text-xs text-destructive">{errors.overrideDate.message}</p>
                  )}
                </div>
              )}
            </div>            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher</label>
              <Select
                value={teacherId || ''}
                onValueChange={(val) => setValue('teacherId', val as string)}
              >
                <SelectTrigger className={errors.teacherId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select Teacher">
                    {teacherId
                      ? (() => {
                          const t = teachersData?.teachers.find((t) => t.id === teacherId)
                          return t ? `${t.firstName} ${t.lastName} (${t.employeeId})` : undefined
                        })()
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teachersData?.teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teacherId && (
                <p className="text-xs text-destructive">{errors.teacherId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select
                value={subjectId || ''}
                onValueChange={(val) => setValue('subjectId', val as string)}
              >
                <SelectTrigger className={errors.subjectId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select Subject">
                    {subjectId
                      ? (() => {
                          const s = subjectsData?.find((s) => s.id === subjectId)
                          return s ? `${s.name} (${s.code})` : undefined
                        })()
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subjectsData?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && (
                <p className="text-xs text-destructive">{errors.subjectId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Room (Optional)</label>
              <Input
                {...register('room')}
                placeholder="e.g. 101-A"
                className={errors.room ? 'border-destructive' : ''}
              />
              {errors.room && <p className="text-xs text-destructive">{errors.room.message}</p>}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="timetable-form" disabled={isPending}>
            {isPending ? 'Saving...' : entry ? 'Update Entry' : 'Add Entry'}
          </Button>
        </div>
      </div>
    </div>
  )
}
