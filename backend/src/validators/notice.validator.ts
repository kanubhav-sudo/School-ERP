import { z } from 'zod'
import { Role, NoticePriority } from '../generated/prisma'

export const createNoticeSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    content: z.string().min(1, 'Content is required'),
    priority: z.nativeEnum(NoticePriority).optional(),
    targetRoles: z.array(z.nativeEnum(Role)).optional(),
    targetClassIds: z.array(z.string().uuid()).optional(),
    publishedAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    attachments: z.array(z.string().url()).optional(),
  }),
})

export const updateNoticeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Notice ID format'),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255).optional(),
    content: z.string().min(1, 'Content is required').optional(),
    priority: z.nativeEnum(NoticePriority).optional(),
    targetRoles: z.array(z.nativeEnum(Role)).optional(),
    targetClassIds: z.array(z.string().uuid()).optional(),
    publishedAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    attachments: z.array(z.string().url()).optional(),
  }),
})

export const noticeQuerySchema = z.object({
  query: z.object({
    activeOnly: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    classId: z.string().uuid().optional(),
  }),
})

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>['body']
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>['body']
export type NoticeQueryInput = z.infer<typeof noticeQuerySchema>['query']
