import { Request, Response, NextFunction } from 'express'
import { NoticeService } from '../services/notice.service'
import { success, created } from '../core/response'
import { noticeQuerySchema } from '../validators/notice.validator'

export class NoticeController {
  static async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const notice = await NoticeService.createNotice(req.body, req.user!.sub)
      created(res, notice, 'Notice created successfully')
    } catch (error) {
      next(error)
    }
  }

  static async getNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedQuery = noticeQuerySchema.shape.query.parse(req.query)
      const notices = await NoticeService.getNotices(parsedQuery)
      success(res, notices)
    } catch (error) {
      next(error)
    }
  }

  static async getNoticeById(req: Request, res: Response, next: NextFunction) {
    try {
      const notice = await NoticeService.getNoticeById(req.params.id as string)
      success(res, notice)
    } catch (error) {
      next(error)
    }
  }

  static async updateNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const notice = await NoticeService.updateNotice(
        req.params.id as string,
        req.body,
        req.user!.sub
      )
      success(res, notice, 'Notice updated successfully')
    } catch (error) {
      next(error)
    }
  }

  static async deleteNotice(req: Request, res: Response, next: NextFunction) {
    try {
      await NoticeService.deleteNotice(req.params.id as string, req.user!.sub)
      success(res, null, 'Notice deleted successfully')
    } catch (error) {
      next(error)
    }
  }
}
