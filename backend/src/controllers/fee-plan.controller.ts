import { Request, Response, NextFunction } from 'express'
import {
  createFeePlan,
  updateFeePlan,
  deleteFeePlan,
  getFeePlanById,
  listFeePlans,
} from '../services/fee-plan.service'
import { ApiResponse } from '../core/response'
import {
  createFeePlanSchema,
  updateFeePlanSchema,
  listFeePlansSchema,
} from '../validators/fee-plan.validator'

export class FeePlanController {
  static async createFeePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createFeePlanSchema.safeParse(req.body)
      if (!parsed.success) {
        ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
        return
      }

      const feePlan = await createFeePlan(parsed.data, req.user!.sub)
      ApiResponse.created(res, feePlan, 'Fee plan created successfully')
    } catch (error) {
      next(error)
    }
  }

  static async getFeePlans(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listFeePlansSchema.safeParse(req.query)
      if (!parsed.success) {
        ApiResponse.badRequest(res, 'Invalid query parameters', parsed.error.issues)
        return
      }

      const result = await listFeePlans(parsed.data)
      ApiResponse.success(res, result)
    } catch (error) {
      next(error)
    }
  }

  static async getFeePlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const feePlan = await getFeePlanById(req.params.id as string)
      ApiResponse.success(res, feePlan)
    } catch (error) {
      next(error)
    }
  }

  static async updateFeePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateFeePlanSchema.safeParse(req.body)
      if (!parsed.success) {
        ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
        return
      }

      const feePlan = await updateFeePlan(req.params.id as string, parsed.data, req.user!.sub)
      ApiResponse.success(res, feePlan, 'Fee plan updated successfully')
    } catch (error) {
      next(error)
    }
  }

  static async deleteFeePlan(req: Request, res: Response, next: NextFunction) {
    try {
      await deleteFeePlan(req.params.id as string, req.user!.sub)
      ApiResponse.success(res, null, 'Fee plan deleted successfully')
    } catch (error) {
      next(error)
    }
  }
}
