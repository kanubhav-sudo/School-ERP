import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchSessions } from '../academic-sessions/api'
import { fetchPeriodMasters, setPeriodMasters } from './api'
import { Clock, Plus, Trash2, Save, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const MAX_PERIODS = 10

const timeRegex12h = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/i

function to12h(time24: string): string {
  if (!time24) return ''
  const parts = time24.split(':')
  if (parts.length < 2) return time24
  let hour = parseInt(parts[0], 10)
  const minute = parts[1]
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  const hourStr = hour.toString().padStart(2, '0')
  return `${hourStr}:${minute} ${ampm}`
}

function to24h(time12: string): string {
  if (!time12) return ''
  const match = time12.trim().match(timeRegex12h)
  if (!match) return time12
  let hour = parseInt(match[1], 10)
  const minute = match[2]
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && hour < 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0
  const hourStr = hour.toString().padStart(2, '0')
  return `${hourStr}:${minute}`
}

const periodSchema = z.object({
  periodNumber: z.number().min(1).max(MAX_PERIODS),
  startTime: z.string().regex(timeRegex12h, 'Must be hh:mm AM/PM (e.g. 08:30 AM)'),
  endTime: z.string().regex(timeRegex12h, 'Must be hh:mm AM/PM (e.g. 09:15 AM)'),
})

const formSchema = z.object({
  periods: z.array(periodSchema),
})

type FormValues = z.infer<typeof formSchema>

export function PeriodMasterPage() {
  const queryClient = useQueryClient()
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })

  // Auto-select active session
  useEffect(() => {
    if (sessions && !selectedSessionId) {
      const active = sessions.find((s) => s.isActive) || sessions[0]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (active) setSelectedSessionId(active.id)
    }
  }, [sessions, selectedSessionId])

  const { data: existingPeriods, isLoading: loadingPeriods } = useQuery({
    queryKey: ['periodMaster', selectedSessionId],
    queryFn: () => fetchPeriodMasters(selectedSessionId),
    enabled: !!selectedSessionId,
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { periods: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'periods',
  })

  // Reset form when data loads or session changes
  useEffect(() => {
    if (existingPeriods !== undefined) {
      reset({
        periods: existingPeriods.map((p) => ({
          periodNumber: p.periodNumber,
          startTime: to12h(p.startTime),
          endTime: to12h(p.endTime),
        })),
      })
    }
  }, [existingPeriods, reset])

  // Also reset when session changes
  useEffect(() => {
    reset({ periods: [] })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveSuccess(false)
    setServerError(null)
  }, [selectedSessionId, reset])

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      setPeriodMasters({
        sessionId: selectedSessionId,
        periods: data.periods.map((p, index) => ({
          ...p,
          periodNumber: index + 1, // Enforce sequential period numbers
          startTime: to24h(p.startTime),
          endTime: to24h(p.endTime),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodMaster'] })
      // Also invalidate timetable queries so grids refresh with new period columns
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
      setSaveSuccess(true)
      setServerError(null)
      setTimeout(() => setSaveSuccess(false), 4000)
    },
    onError: (error: any) => {
      setServerError(error?.response?.data?.error?.message || 'Failed to save period master')
    },
  })

  const onSubmit = (data: FormValues) => {
    setServerError(null)
    mutation.mutate(data)
  }

  const canAddMore = fields.length < MAX_PERIODS

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Period Master</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define standard timetable periods and their timings for each academic session. Up to{' '}
          {MAX_PERIODS} periods are supported.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
        <label className="text-sm font-medium">Academic Session:</label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          disabled={loadingSessions}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[200px]"
        >
          <option value="" disabled>
            Select Session
          </option>
          {sessions?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.isActive ? '(Active)' : ''}
            </option>
          ))}
        </select>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {selectedSessionId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Periods</CardTitle>
                <CardDescription>
                  Configure period start and end times in 12-hour format (e.g. 08:30 AM).{' '}
                  {fields.length}/{MAX_PERIODS} periods configured.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!canAddMore || loadingPeriods}
                onClick={() =>
                  append({
                    periodNumber: fields.length + 1,
                    startTime: '',
                    endTime: '',
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Period
                {!canAddMore && ' (max reached)'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPeriods ? (
              <div className="py-8 text-center text-muted-foreground">Loading periods...</div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {fields.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed rounded-lg">
                    <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium">No periods defined</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Start adding periods to create your timetable structure. You can add up to{' '}
                      {MAX_PERIODS} periods.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        append({
                          periodNumber: 1,
                          startTime: '',
                          endTime: '',
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add First Period
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Table header */}
                    <div className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-4 px-4 text-xs text-muted-foreground font-medium">
                      <span>#</span>
                      <span>Start Time</span>
                      <span>End Time</span>
                      <span></span>
                    </div>
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-[3rem_1fr_1fr_3rem] items-start gap-4 p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors"
                      >
                        {/* Period number badge */}
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold rounded-md text-sm">
                          P{index + 1}
                        </div>

                        {/* Start time */}
                        <div className="space-y-1">
                          <Input
                            type="text"
                            placeholder="08:30 AM"
                            {...register(`periods.${index}.startTime` as const)}
                            className={
                              errors.periods?.[index]?.startTime ? 'border-destructive' : ''
                            }
                          />
                          {errors.periods?.[index]?.startTime && (
                            <p className="text-xs text-destructive">
                              {errors.periods[index]?.startTime?.message}
                            </p>
                          )}
                        </div>

                        {/* End time */}
                        <div className="space-y-1">
                          <Input
                            type="text"
                            placeholder="09:15 AM"
                            {...register(`periods.${index}.endTime` as const)}
                            className={
                              errors.periods?.[index]?.endTime ? 'border-destructive' : ''
                            }
                          />
                          {errors.periods?.[index]?.endTime && (
                            <p className="text-xs text-destructive">
                              {errors.periods[index]?.endTime?.message}
                            </p>
                          )}
                        </div>

                        {/* Delete button */}
                        <div className="flex items-start pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer actions */}
                <div className="pt-4 flex items-center justify-between border-t">
                  <p className="text-xs text-muted-foreground">
                    {fields.length > 0
                      ? `${fields.length} period${fields.length !== 1 ? 's' : ''} configured${
                          fields.length === MAX_PERIODS ? ' (maximum reached)' : ''
                        }`
                      : 'No periods configured. Add periods to enable the timetable.'}
                  </p>
                  <div className="flex items-center gap-3">
                    {saveSuccess && (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Saved successfully
                      </div>
                    )}
                    <Button type="submit" disabled={mutation.isPending} className="min-w-[120px]">
                      {mutation.isPending ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" /> Save Periods
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
