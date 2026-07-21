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
    const stats = await AdminDashboardService.getDashboardStats()
    ApiResponse.success(res, stats, 'Dashboard stats retrieved')
  } catch (err) {
    logger.error({ err }, 'Admin dashboard getDashboardStats error')
    next(err)
  }
}
