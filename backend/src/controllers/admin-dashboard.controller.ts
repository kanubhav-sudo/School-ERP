import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import * as AdminDashboardService from '../services/admin-dashboard.service'
import { logger } from '../core'

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await AdminDashboardService.getDashboardStats(req.db)
    ApiResponse.success(res, stats, 'Dashboard stats retrieved')
  } catch (err) {
    logger.error({ err }, 'Admin dashboard getDashboardStats error')
    next(err)
  }
}

export async function getTodaysBirthdays(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const birthdays = await AdminDashboardService.getTodaysBirthdays(req.db)
    ApiResponse.success(res, birthdays, "Today's birthdays retrieved")
  } catch (err) {
    logger.error({ err }, 'Admin dashboard getTodaysBirthdays error')
    next(err)
  }
}

export async function getUpcomingBirthdays(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const birthdays = await AdminDashboardService.getUpcomingBirthdays(req.db)
    ApiResponse.success(res, birthdays, 'Upcoming birthdays retrieved')
  } catch (err) {
    logger.error({ err }, 'Admin dashboard getUpcomingBirthdays error')
    next(err)
  }
}
