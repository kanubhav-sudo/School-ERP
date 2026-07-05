import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createNotice, updateNotice } from '../api'
import type { Notice, CreateNoticePayload, NoticePriority, Role } from '../api'

const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).optional(),
  targetRoles: z
    .array(z.enum(['SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const))
    .optional(),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

type NoticeFormValues = z.infer<typeof noticeSchema>

interface NoticeFormProps {
  notice?: Notice
  onClose: () => void
}

export function NoticeForm({ notice, onClose }: NoticeFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!notice

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: notice?.title || '',
      content: notice?.content || '',
      priority: notice?.priority || 'MEDIUM',
      targetRoles: notice?.targetRoles || [],
      publishedAt: notice?.publishedAt
        ? new Date(notice.publishedAt).toISOString().slice(0, 16)
        : undefined,
      expiresAt: notice?.expiresAt
        ? new Date(notice.expiresAt).toISOString().slice(0, 16)
        : undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: NoticeFormValues) => {
      // Ensure date format or undefined
      const payload: CreateNoticePayload = {
        title: data.title,
        content: data.content,
        priority: data.priority as NoticePriority,
        targetRoles: data.targetRoles as Role[],
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      }

      if (isEditing) {
        return updateNotice({ id: notice.id, payload })
      }
      return createNotice(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      onClose()
    },
  })

  const onSubmit = (data: NoticeFormValues) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register('title')} placeholder="e.g. End of Semester Exam Schedule" />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <textarea
          id="content"
          {...register('content')}
          className="w-full h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Notice details..."
        />
        {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            {...register('priority')}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Note: targetRoles and targetClassIds can be multi-selects. For simplicity, skipping multi-select UI in basic form, leaving targetRoles as optional string[] */}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="publishedAt">Publish At</Label>
          <Input id="publishedAt" type="datetime-local" {...register('publishedAt')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expires At</Label>
          <Input id="expiresAt" type="datetime-local" {...register('expiresAt')} />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : isEditing ? 'Update Notice' : 'Create Notice'}
        </Button>
      </div>
    </form>
  )
}
