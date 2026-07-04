import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSubject, updateSubject, type SubjectData } from '../api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  description: z.string().optional(),
  credits: z.number().min(0, 'Credits must be non-negative'),
  isActive: z.boolean(),
})

type SubjectFormValues = z.infer<typeof subjectSchema>

interface Props {
  subject: SubjectData | null
  onClose: () => void
}

export function SubjectForm({ subject, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEditing = !!subject

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: subject?.name || '',
      code: subject?.code || '',
      description: subject?.description || '',
      credits: subject?.credits || 0,
      isActive: subject?.isActive ?? true,
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const isActive = watch('isActive')

  const mutation = useMutation({
    mutationFn: (data: SubjectFormValues) => {
      const payload = {
        ...data,
        description: data.description || undefined,
      }
      if (isEditing) {
        return updateSubject({ id: subject.id, payload })
      }
      return createSubject(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      onClose()
    },
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Subject' : 'New Subject'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name (e.g., Mathematics)</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Subject Code (e.g., MATH101)</Label>
              <Input id="code" {...register('code')} />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                step="0.5"
                {...register('credits', { valueAsNumber: true })}
              />
              {errors.credits && <p className="text-sm text-red-500">{errors.credits.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" {...register('description')} />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="isActive">Active</Label>
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
              {isEditing ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
