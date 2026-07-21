import { Request, Response, NextFunction } from 'express'
import { HomeworkService } from '../services/homework.service'
import { ApiResponse } from '../core'
import { z } from 'zod'
import { PublishStatus } from '../generated/prisma'

const createHomeworkSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string(),
  attachmentUrl: z.string().optional(),
  marks: z.number().int().optional(),
  status: z.nativeEnum(PublishStatus),
  sessionId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid()
})

const updateHomeworkSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  attachmentUrl: z.string().optional(),
  marks: z.number().int().optional(),
  status: z.nativeEnum(PublishStatus).optional()
})

export class HomeworkController {
  static async createHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createHomeworkSchema.safeParse(req.body)
      if (!parsed.success) {
        ApiResponse.badRequest(res, 'Invalid input', parsed.error.issues)
        return
      }

      const teacherId = req.user?.sub
      if (!teacherId) {
        ApiResponse.unauthorized(res, 'Not authorized')
        return
      }

      const homework = await HomeworkService.createHomework({ ...parsed.data, teacherId })
      ApiResponse.created(res, homework, 'Homework created successfully')
    } catch (error) {
      next(error)
    }
  }

  static async updateHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string }
      const parsed = updateHomeworkSchema.safeParse(req.body)
      if (!parsed.success) {
        ApiResponse.badRequest(res, 'Invalid input', parsed.error.issues)
        return
      }

      const role = req.user?.role
      const teacherId = role === 'ADMIN' ? undefined : req.user?.sub
      const homework = await HomeworkService.updateHomework(id, parsed.data, teacherId)
      ApiResponse.success(res, homework, 'Homework updated successfully')
    } catch (error) {
      next(error)
    }
  }

  static async deleteHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string }
      const role = req.user?.role
      const teacherId = role === 'ADMIN' ? undefined : req.user?.sub
      await HomeworkService.deleteHomework(id, teacherId)
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
        status: req.query.status as PublishStatus | undefined
      }

      const homeworks = await HomeworkService.getHomeworkForTeacher(teacherId, filters)
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
        status: req.query.status as PublishStatus | undefined
      }

      const homeworks = await HomeworkService.getAllHomework(filters)
      ApiResponse.success(res, homeworks, 'All homeworks fetched successfully')
    } catch (error) {
      next(error)
    }
  }
}
