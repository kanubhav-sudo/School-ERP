import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import { listFeeRecordsSchema, feeSummarySchema } from '../validators/fee-record.validator'
import * as FeeRecordService from '../services/fee-record.service'

export async function listFeeRecords(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listFeeRecordsSchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await FeeRecordService.listFeeRecords(parsed.data)
    ApiResponse.success(res, result, 'Fee records retrieved')
  } catch (err) {
    next(err)
  }
}

export async function getFeeSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = feeSummarySchema.safeParse(req.query)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
      return
    }

    const result = await FeeRecordService.getFeeSummary(parsed.data)
    ApiResponse.success(res, result, 'Fee summary retrieved')
  } catch (err) {
    next(err)
  }
}
