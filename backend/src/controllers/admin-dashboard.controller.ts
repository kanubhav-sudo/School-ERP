import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import * as AdminDashboardService from '../services/admin-dashboard.service'

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await AdminDashboardService.getDashboardStats()
    ApiResponse.success(res, stats, 'Dashboard stats retrieved')
  } catch (err) {
    next(err)
  }
}
