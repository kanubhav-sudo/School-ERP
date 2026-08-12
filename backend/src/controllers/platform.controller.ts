/**
 * Platform Administration Controller — CloudEMS Platform v4
 *
 * Handles all SUPER_ADMIN platform routes:
 *  - Platform dashboard metrics
 *  - School provisioning
 *  - School CRUD (list, get, update, archive)
 *  - Settings & features management
 *  - School status transitions
 *  - Audit log retrieval
 *  - Global search
 *
 * Authorization: ALL routes require authenticate + authorize('SUPER_ADMIN')
 *
 * @module controllers/platform
 */

import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import * as R from '../core/response'
import {
  provisionSchoolSchema,
  updateSchoolSchema,
  updateSettingsSchema,
  updateFeaturesSchema,
  changeStatusSchema,
  auditLogFilterSchema,
  globalSearchSchema,
} from '../validators/platform.validator'
import {
  listSchools,
  getSchoolById,
  updateSchool,
  updateSchoolSettings,
  updateSchoolFeatures,
  changeSchoolStatus,
  getPlatformDashboardMetrics,
} from '../services/platform-school.service'
import { provisionSchool, reprovisionSchool } from '../services/school-provisioning.service'
import { getAuditLogs, auditPlatformEvent } from '../services/audit.service'
import { globalSearch } from '../services/global-search.service'
import { SchoolStatus } from '../generated/prisma'

// ─── Helpers ──────────────────────────────────────────────────

/** Parse ZodError issues into readable field-message pairs */
function parseZodError(err: ZodError) {
  return err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
}

/** Safely extract a route param as string (Express v5 types params as string | undefined) */
function param(req: Request, key: string): string {
  const val = req.params[key]
  if (!val) throw new Error(`Missing route parameter: ${key}`)
  return String(val)
}

/** Safely extract a query string value as string | undefined */
function query(req: Request, key: string): string | undefined {
  const val = req.query[key]
  if (val === undefined || val === null) return undefined
  return Array.isArray(val) ? String(val[0]) : String(val)
}

// ─── Platform Dashboard ───────────────────────────────────────

export async function getDashboard(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const metrics = await getPlatformDashboardMetrics()
    R.success(res, metrics, 'Platform dashboard metrics retrieved')
  } catch (err) {
    next(err)
  }
}

// ─── List Schools ─────────────────────────────────────────────

export async function listSchoolsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = query(req, 'status')
    const search = query(req, 'search')
    const pageStr = query(req, 'page')
    const limitStr = query(req, 'limit')

    const result = await listSchools({
      status: status as SchoolStatus | undefined,
      search,
      page: pageStr ? parseInt(pageStr, 10) : 1,
      limit: limitStr ? parseInt(limitStr, 10) : 20,
    })

    R.success(res, result, 'Schools retrieved successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Get School ───────────────────────────────────────────────

export async function getSchoolController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = param(req, 'schoolId')
    const school = await getSchoolById(schoolId)
    R.success(res, school, 'School retrieved successfully')
  } catch (err) {
    next(err)
  }
}

// ─── Provision School ─────────────────────────────────────────

export async function provisionSchoolController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = provisionSchoolSchema.parse(req.body)

    const school = await provisionSchool({
      ...validated,
      createdByUserId: req.user?.sub,
    })

    await auditPlatformEvent(req, 'SCHOOL_PROVISIONED', 'School', school.id, {
      newValue: { name: school.name, slug: school.slug },
    })

    R.created(res, school, `School "${school.name}" provisioned successfully`)
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Re-Provision Failed School ───────────────────────────────

export async function reprovisionSchoolController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = param(req, 'schoolId')
    const validated = provisionSchoolSchema.parse(req.body)

    await reprovisionSchool(schoolId, {
      ...validated,
      createdByUserId: req.user?.sub,
    })

    await auditPlatformEvent(req, 'SCHOOL_REPROVISIONED', 'School', schoolId)

    R.success(res, { schoolId }, 'School re-provisioned successfully')
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Update School ────────────────────────────────────────────

export async function updateSchoolController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = param(req, 'schoolId')
    const validated = updateSchoolSchema.parse(req.body)
    const school = await updateSchool(schoolId, validated)

    await auditPlatformEvent(req, 'SCHOOL_UPDATED', 'School', schoolId, {
      newValue: validated as Record<string, unknown>,
    })

    R.success(res, school, 'School updated successfully')
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Update School Settings ───────────────────────────────────

export async function updateSchoolSettingsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = param(req, 'schoolId')
    const validated = updateSettingsSchema.parse(req.body)
    const settings = await updateSchoolSettings(schoolId, validated)

    await auditPlatformEvent(req, 'SCHOOL_SETTINGS_UPDATED', 'SchoolSettings', schoolId)

    R.success(res, settings, 'School settings updated successfully')
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Update School Features ───────────────────────────────────

export async function updateSchoolFeaturesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = param(req, 'schoolId')
    const validated = updateFeaturesSchema.parse(req.body)
    const features = await updateSchoolFeatures(schoolId, validated)

    await auditPlatformEvent(req, 'SCHOOL_FEATURES_UPDATED', 'SchoolFeatures', schoolId, {
      newValue: validated as Record<string, unknown>,
    })

    R.success(res, features, 'School features updated successfully')
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Change School Status ─────────────────────────────────────

export async function changeSchoolStatusController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = param(req, 'schoolId')
    const { status, reason } = changeStatusSchema.parse(req.body)

    const school = await changeSchoolStatus(schoolId, status as SchoolStatus, reason)

    await auditPlatformEvent(req, `SCHOOL_STATUS_CHANGED_TO_${status}`, 'School', schoolId, {
      newValue: { status, reason },
    })

    R.success(res, school, `School status changed to ${status}`)
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Audit Logs ───────────────────────────────────────────────

export async function getAuditLogsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Flatten query to plain string record for Zod parsing
    const flatQuery: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') flatQuery[k] = v
      else if (Array.isArray(v) && typeof v[0] === 'string') flatQuery[k] = v[0] as string
    }

    const filter = auditLogFilterSchema.parse(flatQuery)
    const result = await getAuditLogs(filter)
    R.success(res, result, 'Audit logs retrieved successfully')
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Invalid filter parameters', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Global Search ────────────────────────────────────────────

export async function globalSearchController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = query(req, 'q') ?? ''
    const { q: validatedQ } = globalSearchSchema.parse({ q })
    const results = await globalSearch(validatedQ)
    R.success(res, results, `Found ${results.totalHits} results for "${validatedQ}"`)
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Invalid search query', parseZodError(err))
      return
    }
    next(err)
  }
}

// ─── Reset School Admin Password ──────────────────────────────

import { resetSchoolAdminPasswordSchema } from '../validators/platform.validator'
import { resetSchoolAdminPassword } from '../services/platform-school.service'

export async function resetSchoolAdminPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = param(req, 'schoolId')
    const { adminUserId, newPassword } = resetSchoolAdminPasswordSchema.parse(req.body)

    const updatedUser = await resetSchoolAdminPassword(schoolId, adminUserId, newPassword)

    await auditPlatformEvent(req, 'SCHOOL_ADMIN_PASSWORD_RESET', 'User', adminUserId, {
      newValue: { schoolId, username: updatedUser.username },
    })

    R.success(
      res,
      { id: updatedUser.id, username: updatedUser.username, schoolId: updatedUser.schoolId },
      `Password reset successfully for School Admin "${updatedUser.username}"`
    )
  } catch (err) {
    if (err instanceof ZodError) {
      R.badRequest(res, 'Validation failed', parseZodError(err))
      return
    }
    next(err)
  }
}
