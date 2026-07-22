import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import { listFeeRecordsSchema, feeSummarySchema, payFeeSchema } from '../validators/fee-record.validator'
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

export async function processPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.params.studentId as string
    const parsed = payFeeSchema.safeParse(req.body)
    
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Invalid payment data', parsed.error.issues)
      return
    }

    const result = await FeeRecordService.addFeePayment(studentId, parsed.data, req.user?.sub as string)
    ApiResponse.success(res, result, 'Fee payment processed successfully')
  } catch (err) {
    next(err)
  }
}

export async function getStudentFeeList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.query.sessionId as string | undefined
    const classId = req.query.classId as string | undefined
    const search = req.query.search as string | undefined
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20

    const result = await FeeRecordService.getStudentFeeList({ sessionId, classId, search, page, limit })
    ApiResponse.success(res, result, 'Student fee list retrieved')
  } catch (err) {
    next(err)
  }
}

export async function getStudentFeeProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.params.studentId as string
    const sessionId = req.query.sessionId as string | undefined
    const result = await FeeRecordService.getStudentFeeProfile(studentId, sessionId)
    ApiResponse.success(res, result, 'Student fee profile retrieved')
  } catch (err) {
    next(err)
  }
}

