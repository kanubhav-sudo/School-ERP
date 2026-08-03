/**
 * Document Engine Express Routes
 *
 * @module routes/document-engine
 */

import { Router } from 'express'
import { DocumentEngineController } from '../controllers/document-engine.controller'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'

const router = Router()

// ── Public Verification Endpoint (No Auth Required!) ────────
router.get('/public/verify/:verificationId', DocumentEngineController.verifyPublicDocument)

// ── Protected Admin & Staff Endpoints ────────────────────────
router.use(authenticate)

// Template Management Routes
router.get(
  '/templates/:documentType',
  authorize('ADMIN', 'SUPER_ADMIN'),
  DocumentEngineController.getTemplate
)
router.post(
  '/templates/:documentType',
  authorize('ADMIN', 'SUPER_ADMIN'),
  DocumentEngineController.saveTemplate
)
router.post(
  '/templates/:documentType/reset',
  authorize('ADMIN', 'SUPER_ADMIN'),
  DocumentEngineController.resetTemplate
)

// Live Preview & Document Generation Routes
router.get(
  '/preview/:documentType',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  DocumentEngineController.getLivePreview
)
router.post(
  '/generate',
  authorize('ADMIN', 'SUPER_ADMIN'),
  DocumentEngineController.generateDocument
)

// Bulk Generation Extension Endpoint
router.post(
  '/bulk-generate/init',
  authorize('ADMIN', 'SUPER_ADMIN'),
  DocumentEngineController.bulkGenerateInit
)

export default router
