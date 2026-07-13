import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createFeePlan, updateFeePlan, type FeePlan } from '../api'
import { fetchSessions } from '@/features/admin/academic-sessions/api'
import { fetchClasses } from '@/features/admin/classes/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const feePlanSchema = z.object({
  name: z.string().min(1, 'Fee plan name is required').max(200, 'Name too long'),
  sessionId: z.string().min(1, 'Academic session is required'),
  classId: z.string().min(1, 'Class is required'),
  monthlyAmount: z
    .number()
    .int('Amount must be a whole number')
    .positive('Amount must be positive'),
  description: z.string().max(1000).optional(),
})

type FeePlanFormValues = z.infer<typeof feePlanSchema>

interface Props {
  feePlan: FeePlan | null
  onClose: () => void
}

/** Format paise to rupees for display in form defaults */
function paiseToRupees(paise: number): number {
  return Math.round(paise / 100)
}

export function FeePlanForm({ feePlan, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEditing = !!feePlan

  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FeePlanFormValues>({
    resolver: zodResolver(feePlanSchema),
    defaultValues: {
      name: feePlan?.name ?? '',
      sessionId: feePlan?.sessionId ?? '',
      classId: feePlan?.classId ?? '',
      monthlyAmount: feePlan ? paiseToRupees(feePlan.monthlyAmount) : undefined,
      description: feePlan?.description ?? '',
    },
  })

  // Calculate net fee preview
  // eslint-disable-next-line react-hooks/incompatible-library
  const monthlyNum = Number(watch('monthlyAmount')) || 0

  const mutation = useMutation({
    mutationFn: (data: FeePlanFormValues) => {
      const payload = {
        name: data.name,
        sessionId: data.sessionId,
        classId: data.classId,
        monthlyAmount: data.monthlyAmount,
        description: data.description || undefined,
      }
      if (isEditing) {
        return updateFeePlan({ id: feePlan.id, payload })
      }
      return createFeePlan(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] })
      onClose()
    },
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Fee Plan' : 'New Fee Plan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Class 8 Monthly Fee" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Session + Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionId">Academic Session *</Label>
              <select
                id="sessionId"
                {...register('sessionId')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">— Select Session —</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.sessionId && (
                <p className="text-sm text-red-500">{errors.sessionId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="classId">Class *</Label>
              <select
                id="classId"
                {...register('classId')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">— Select Class —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.classId && <p className="text-sm text-red-500">{errors.classId.message}</p>}
            </div>
          </div>

          {/* Monthly Amount */}
          <div className="space-y-2">
            <Label htmlFor="monthlyAmount">Monthly Fee Amount (₹) *</Label>
            <Input
              id="monthlyAmount"
              type="number"
              min={1}
              {...register('monthlyAmount', { valueAsNumber: true })}
              placeholder="e.g. 2500"
            />
            {errors.monthlyAmount && (
              <p className="text-sm text-red-500">{errors.monthlyAmount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={2}
              placeholder="Optional notes about this fee plan..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
            />
          </div>

          {/* ── Fee Preview ── */}
          {monthlyNum > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Fee Preview
              </p>
              <div className="flex justify-between text-sm">
                <span>Monthly Fee</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(monthlyNum)}
                </span>
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-sm text-red-500">
              {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {isEditing ? 'Save Changes' : 'Create Fee Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
