import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClass, updateClass, type ClassData } from '../api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const classSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

type ClassFormValues = z.infer<typeof classSchema>

interface Props {
  cls: ClassData | null
  onClose: () => void
}

export function ClassForm({ cls, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEditing = !!cls

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: cls?.name || '',
      displayOrder: cls?.displayOrder || 0,
      isActive: cls?.isActive ?? true,
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const isActive = watch('isActive')

  const mutation = useMutation({
    mutationFn: (data: ClassFormValues) => {
      if (isEditing) {
        return updateClass({ id: cls.id, payload: data })
      }
      return createClass(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      onClose()
    },
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Class' : 'New Class'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name (e.g., Grade 10)</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              {...register('displayOrder', { valueAsNumber: true })}
            />
            {errors.displayOrder && (
              <p className="text-sm text-red-500">{errors.displayOrder.message}</p>
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
              {isEditing ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
