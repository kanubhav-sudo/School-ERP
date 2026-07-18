import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSection, updateSection, type SectionData } from '../api'
import { fetchClasses } from '../../classes/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const sectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  classId: z.string().min(1, 'Class is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200),
  roomNumber: z.string().max(50).optional(),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

type SectionFormValues = z.infer<typeof sectionSchema>

interface Props {
  section: SectionData | null
  onClose: () => void
}

export function SectionForm({ section, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEditing = !!section

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: section?.name || '',
      classId: section?.classId || '',
      capacity: section?.capacity || 30,
      roomNumber: section?.roomNumber || '',
      displayOrder: section?.displayOrder || 0,
      isActive: section?.isActive ?? true,
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const isActive = watch('isActive')

  const mutation = useMutation({
    mutationFn: (data: SectionFormValues) => {
      // roomNumber might be empty string, send undefined or null if empty so validation passes on backend (if optional string)
      const payload = {
        ...data,
        roomNumber: data.roomNumber || undefined,
      }
      if (isEditing) {
        return updateSection({ id: section.id, payload })
      }
      return createSection(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      onClose()
    },
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Section' : 'New Section'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classId">Class</Label>
            <Controller
              name="classId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class">
                      {field.value
                        ? classes.find((c) => c.id === field.value)?.name
                        : undefined}
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
              )}
            />
            {errors.classId && <p className="text-sm text-red-500">{errors.classId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Section Name (e.g., A, B, Science)</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity', { valueAsNumber: true })}
              />
              {errors.capacity && <p className="text-sm text-red-500">{errors.capacity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number (Optional)</Label>
              <Input id="roomNumber" {...register('roomNumber')} />
              {errors.roomNumber && (
                <p className="text-sm text-red-500">{errors.roomNumber.message}</p>
              )}
            </div>
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
              {isEditing ? 'Save Changes' : 'Create Section'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
