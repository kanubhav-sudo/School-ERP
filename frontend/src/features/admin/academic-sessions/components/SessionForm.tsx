import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSession, updateSession, type AcademicSession } from '../api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const sessionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})

type SessionFormValues = z.infer<typeof sessionSchema>

interface Props {
  session: AcademicSession | null
  onClose: () => void
}

export function SessionForm({ session, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEditing = !!session

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: session?.name || '',
      startDate: session ? new Date(session.startDate).toISOString().split('T')[0] : '',
      endDate: session ? new Date(session.endDate).toISOString().split('T')[0] : '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: SessionFormValues) => {
      const payload = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      }
      if (isEditing) {
        return updateSession({ id: session.id, payload })
      }
      return createSession(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] })
      onClose()
    },
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Academic Session' : 'New Academic Session'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Session Name (e.g., 2024-2025)</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-500">
              {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {isEditing ? 'Save Changes' : 'Create Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
