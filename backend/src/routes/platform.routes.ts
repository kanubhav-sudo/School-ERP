/**
 * Platform Administration Routes — CloudEMS Platform v4
 *
 * Base path: /api/v1/platform
 * Authorization: All routes require SUPER_ADMIN role
 *
 * Route Map:
 *   GET    /platform/dashboard              - Platform metrics
 *   GET    /platform/schools                - List all schools (paginated)
 *   POST   /platform/schools                - Provision new school
 *   GET    /platform/schools/:schoolId      - Get school details
 *   PATCH  /platform/schools/:schoolId      - Update school info
 *   POST   /platform/schools/:schoolId/reprovision  - Retry failed provisioning
 *   PATCH  /platform/schools/:schoolId/status       - Change school status
 *   PUT    /platform/schools/:schoolId/settings     - Update school settings
 *   PUT    /platform/schools/:schoolId/features     - Toggle feature flags
 *   GET    /platform/audit-logs             - Platform audit logs (paginated)
 *   GET    /platform/search                 - Global cross-entity search
 *
 * @module routes/platform
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import {
  getDashboard,
  listSchoolsController,
  getSchoolController,
  provisionSchoolController,
  reprovisionSchoolController,
  updateSchoolController,
  updateSchoolSettingsController,
  updateSchoolFeaturesController,
  changeSchoolStatusController,
  getAuditLogsController,
  globalSearchController,
  resetSchoolAdminPasswordController,
} from '../controllers/platform.controller'

const router = Router()

// ── All platform routes require SUPER_ADMIN ──────────────────
router.use(authenticate, authorize('SUPER_ADMIN'))

// ── Dashboard ────────────────────────────────────────────────
router.get('/dashboard', getDashboard)

// ── Schools ──────────────────────────────────────────────────
router.get('/schools', listSchoolsController)
router.post('/schools', provisionSchoolController)
router.get('/schools/:schoolId', getSchoolController)
router.patch('/schools/:schoolId', updateSchoolController)
router.post('/schools/:schoolId/reprovision', reprovisionSchoolController)
router.patch('/schools/:schoolId/status', changeSchoolStatusController)
router.put('/schools/:schoolId/settings', updateSchoolSettingsController)
router.put('/schools/:schoolId/features', updateSchoolFeaturesController)
router.post('/schools/:schoolId/reset-admin-password', resetSchoolAdminPasswordController)

// ── Audit Logs ────────────────────────────────────────────────

router.get('/audit-logs', getAuditLogsController)

// ── Global Search ─────────────────────────────────────────────
router.get('/search', globalSearchController)

export default router
