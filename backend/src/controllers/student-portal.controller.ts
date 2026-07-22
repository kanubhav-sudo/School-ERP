/**
 * Student Portal Controller
 *
 * Handles API requests for the student portal.
 */

import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import * as StudentPortalService from '../services/student-portal.service'

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const data = await StudentPortalService.getDashboardData(userId)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const data = await StudentPortalService.getMyProfile(userId)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const data = await StudentPortalService.getAttendance(userId)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const data = await StudentPortalService.getTimetable(userId)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getFees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const data = await StudentPortalService.getFees(userId)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const data = await StudentPortalService.getNotices(userId, page, limit)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const data = await StudentPortalService.getAnnouncements(userId, page, limit)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getExams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const data = await StudentPortalService.getExams(userId)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const data = await StudentPortalService.getHomework(userId)
    ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function submitHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub
    const homeworkId = req.params.id as string
    
    let fileUrl: string | undefined = undefined
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`
    }

    const data = await StudentPortalService.submitHomework(userId, homeworkId, fileUrl)
    ApiResponse.success(res, data, 'Homework submitted successfully')
  } catch (err) {
    next(err)
  }
}
