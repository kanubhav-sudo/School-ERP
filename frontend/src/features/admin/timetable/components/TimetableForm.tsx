import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const formSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
  periodNumber: z.number().min(1).max(10),
  startTime: z.string().regex(timeRegex, 'Must be HH:MM format'),
  endTime: z.string().regex(timeRegex, 'Must be HH:MM format'),
  room: z.string().optional(),
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

  const { data: teachersData } = useQuery({
    queryKey: ['teachers', { isActive: true, limit: 100 }],
    queryFn: () => fetchTeachers({ isActive: true, limit: 100 }),
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', { limit: 100 }],
    queryFn: () => fetchSubjects(),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetchSessions(), // Need to just fetch all active, simplified
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
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room ?? '',
        }
      : {
          sessionId: activeSessionId,
          dayOfWeek: 'MONDAY',
          periodNumber: 1,
          startTime: '08:00',
          endTime: '08:45',
          room: '',
        },
  })

  // Watch values for select components
  // eslint-disable-next-line react-hooks/incompatible-library
  const dayOfWeek = watch('dayOfWeek')
  const teacherId = watch('teacherId')
  const subjectId = watch('subjectId')
  const sessionId = watch('sessionId')

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
    if (entry) {
      updateMutation.mutate({ id: entry.id, payload: data })
    } else {
      createMutation.mutate({
        ...data,
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
          <form id="timetable-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Session</label>
              <Select
                value={sessionId || ''}
                onValueChange={(val) => setValue('sessionId', val as string)}
              >
                <SelectTrigger className={errors.sessionId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select Session" />
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
                    <SelectValue placeholder="Select Day" />
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
                <label className="text-sm font-medium">Period Number (1-10)</label>
                <Input
                  type="number"
                  {...register('periodNumber', { valueAsNumber: true })}
                  className={errors.periodNumber ? 'border-destructive' : ''}
                />
                {errors.periodNumber && (
                  <p className="text-xs text-destructive">{errors.periodNumber.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time (HH:MM)</label>
                <Input
                  {...register('startTime')}
                  placeholder="08:30"
                  className={errors.startTime ? 'border-destructive' : ''}
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time (HH:MM)</label>
                <Input
                  {...register('endTime')}
                  placeholder="09:15"
                  className={errors.endTime ? 'border-destructive' : ''}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher</label>
              <Select
                value={teacherId || ''}
                onValueChange={(val) => setValue('teacherId', val as string)}
              >
                <SelectTrigger className={errors.teacherId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select Teacher" />
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
                  <SelectValue placeholder="Select Subject" />
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
