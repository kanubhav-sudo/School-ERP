import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import { createPeriodMasterSchema } from '../validators/period-master.validator'
import * as PeriodMasterService from '../services/period-master.service'

export async function getPeriodMasters(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params as { sessionId: string }
    const entries = await PeriodMasterService.getPeriodMastersBySession(sessionId)
    ApiResponse.success(res, entries, 'Period masters retrieved')
  } catch (err) {
    next(err)
  }
}

export async function setPeriodMasters(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createPeriodMasterSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }
    const entries = await PeriodMasterService.setPeriodMasters(parsed.data)
    ApiResponse.success(res, entries, 'Period masters updated successfully')
  } catch (err) {
    next(err)
  }
}
