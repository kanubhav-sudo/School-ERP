import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../core/response'
import * as AccountService from '../services/account.service'
import { accountActionSchema } from '../validators/account.validator'

// ─── Get Account Details ──────────────────────────────────────

export async function getAccountDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const details = await AccountService.getAccountDetails(id)
    ApiResponse.success(res, details, 'Account details retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── Reset Password ───────────────────────────────────────────

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const adminId = req.user!.sub
    const parsed = accountActionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const result = await AccountService.resetPassword(id, adminId, parsed.data.remarks)
    ApiResponse.success(res, result, 'Password reset successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Reissue Credentials ──────────────────────────────────────

export async function reissueCredentials(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const adminId = req.user!.sub
    const parsed = accountActionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    const result = await AccountService.reissueCredentials(id, adminId, parsed.data.remarks)
    ApiResponse.success(res, result, 'Credentials reissued successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Activate Account ─────────────────────────────────────────

export async function activateAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const adminId = req.user!.sub
    const parsed = accountActionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    await AccountService.activateAccount(id, adminId, parsed.data.remarks)
    ApiResponse.success(res, null, 'Account activated successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Suspend Account ──────────────────────────────────────────

export async function suspendAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const adminId = req.user!.sub
    const parsed = accountActionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    await AccountService.suspendAccount(id, adminId, parsed.data.remarks)
    ApiResponse.success(res, null, 'Account suspended successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Disable Account ──────────────────────────────────────────

export async function disableAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const adminId = req.user!.sub
    const parsed = accountActionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    await AccountService.disableAccount(id, adminId, parsed.data.remarks)
    ApiResponse.success(res, null, 'Account disabled successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Unlock Account ───────────────────────────────────────────

export async function unlockAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const adminId = req.user!.sub
    const parsed = accountActionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    await AccountService.unlockAccount(id, adminId, parsed.data.remarks)
    ApiResponse.success(res, null, 'Account unlocked successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Force Password Change ────────────────────────────────────

export async function forcePasswordChange(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string
    const adminId = req.user!.sub
    const parsed = accountActionSchema.safeParse(req.body)
    if (!parsed.success) {
      ApiResponse.badRequest(res, 'Validation failed', parsed.error.issues)
      return
    }

    await AccountService.forcePasswordChange(id, adminId, parsed.data.remarks)
    ApiResponse.success(res, null, 'Forced password change on next login')
  } catch (err) {
    next(err)
  }
}
