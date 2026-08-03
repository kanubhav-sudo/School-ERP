import { Request, Response, NextFunction } from 'express'
import { HomeworkService } from '../services/homework.service'
import { ApiResponse } from '../core'
import { z } from 'zod'
import { PublishStatus } from '../generated/prisma'
import { deleteFile } from '../utils/file.util'

const createHomeworkSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string(),
  marks: z.coerce.number().int().optional(),
  status: z.nativeEnum(PublishStatus),
  sessionId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid(),
})

const updateHomeworkSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  marks: z.coerce.number().int().optional(),
  status: z.nativeEnum(PublishStatus).optional(),
  retainedAttachment: z.string().optional(), // if present, keep it; if not, and no new file, it means deleted
})

export class HomeworkController {
  static async createHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createHomeworkSchema.safeParse(req.body)
      if (!parsed.success) {
        if (req.file) deleteFile(req.file.path)
        ApiResponse.badRequest(res, 'Invalid input', parsed.error.issues)
        return
      }

      const teacherId = req.user?.sub
      if (!teacherId) {
        if (req.file) deleteFile(req.file.path)
        ApiResponse.unauthorized(res, 'Not authorized')
        return
      }

      let attachmentUrl: string | undefined = undefined
      if (req.file) {
        attachmentUrl = `/uploads/${req.file.filename}`
      }

      const homework = await HomeworkService.createHomework(req.db, {
        ...parsed.data,
        attachmentUrl,
        teacherId,
      })
      ApiResponse.created(res, homework, 'Homework created successfully')
    } catch (error) {
      if (req.file) deleteFile(req.file.path)
      next(error)
    }
  }

  static async updateHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string }
      const parsed = updateHomeworkSchema.safeParse(req.body)
      if (!parsed.success) {
        if (req.file) deleteFile(req.file.path)
        ApiResponse.badRequest(res, 'Invalid input', parsed.error.issues)
        return
      }

      const role = req.user?.role
      const teacherId = role === 'ADMIN' ? undefined : req.user?.sub

      let attachmentUrl: string | null | undefined = undefined
      if (req.file) {
        attachmentUrl = `/uploads/${req.file.filename}`
      } else if (parsed.data.retainedAttachment) {
        attachmentUrl = parsed.data.retainedAttachment
      } else {
        attachmentUrl = null // explicitly deleted
      }

      const payload = {
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate,
        marks: parsed.data.marks,
        status: parsed.data.status,
        attachmentUrl,
      }

      const homework = await HomeworkService.updateHomework(req.db, id, payload, teacherId)
      ApiResponse.success(res, homework, 'Homework updated successfully')
    } catch (error) {
      if (req.file) deleteFile(req.file.path)
      next(error)
    }
  }

  static async deleteHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string }
      const role = req.user?.role
      const teacherId = role === 'ADMIN' ? undefined : req.user?.sub
      await HomeworkService.deleteHomework(req.db, id, teacherId)
      ApiResponse.success(res, null, 'Homework deleted successfully')
    } catch (error) {
      next(error)
    }
  }

  static async getTeacherHomeworks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user?.sub
      if (!teacherId) {
        ApiResponse.unauthorized(res, 'Not authorized')
        return
      }

      const filters = {
        classId: req.query.classId as string | undefined,
        sectionId: req.query.sectionId as string | undefined,
        subjectId: req.query.subjectId as string | undefined,
        status: req.query.status as PublishStatus | undefined,
      }

      const homeworks = await HomeworkService.getHomeworkForTeacher(req.db, teacherId, filters)
      ApiResponse.success(res, homeworks, 'Homeworks fetched successfully')
    } catch (error) {
      next(error)
    }
  }

  static async getAllHomeworks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        teacherId: req.query.teacherId as string | undefined,
        classId: req.query.classId as string | undefined,
        sectionId: req.query.sectionId as string | undefined,
        subjectId: req.query.subjectId as string | undefined,
        status: req.query.status as PublishStatus | undefined,
      }

      const homeworks = await HomeworkService.getAllHomework(req.db, filters)
      ApiResponse.success(res, homeworks, 'All homeworks fetched successfully')
    } catch (error) {
      next(error)
    }
  }
}
