/**
 * Document Engine Controller
 *
 * Exposes API endpoints for Template Management, Live Document Previews,
 * Official Document Generation, and Public QR Code Verification.
 *
 * @module controllers/document-engine
 */

import { Request, Response, NextFunction } from 'express'
import { DocumentEngineService } from '../services/document-engine/document-engine.service'
import { DocumentType, TemplatePreset } from '../generated/prisma'
import { ValidationError } from '../core/errors'

export class DocumentEngineController {
  /**
   * GET /api/v1/documents/templates/:documentType
   * Fetch active template version configuration
   */
  static async getTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType } = req.params
      const template = await DocumentEngineService.getLatestTemplate(
        req.db,
        documentType as DocumentType
      )
      res.json({ success: true, data: template })
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /api/v1/documents/templates/:documentType
   * Save a new template version (increments version without overwriting previous)
   */
  static async saveTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType } = req.params
      const { preset, title, description, configuration } = req.body

      if (!configuration) {
        throw new ValidationError('Template configuration payload is required')
      }

      const updatedTemplate = await DocumentEngineService.saveTemplateVersion(
        req.db,
        documentType as DocumentType,
        {
          preset: preset as TemplatePreset,
          title,
          description,
          configuration,
        },
        req.user?.sub || 'Admin'
      )

      res.status(201).json({
        success: true,
        message: `Template updated to version ${updatedTemplate.version}`,
        data: updatedTemplate,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /api/v1/documents/templates/:documentType/reset
   * Reset template to preset default (CBSE, ICSE, STATE_BOARD, CUSTOM)
   */
  static async resetTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType } = req.params
      const { preset } = req.body

      const resetTemplate = await DocumentEngineService.resetToPreset(
        req.db,
        documentType as DocumentType,
        (preset as TemplatePreset) || 'CBSE',
        req.user?.sub || 'Admin'
      )

      res.json({
        success: true,
        message: `Template reset to ${preset || 'CBSE'} preset defaults (Version ${resetTemplate.version})`,
        data: resetTemplate,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * GET /api/v1/documents/preview/:documentType
   * Compile Live Document Preview payload
   */
  static async getLivePreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType } = req.params
      const { studentId, examId } = req.query as { studentId?: string; examId?: string }

      if (!studentId) {
        // If no studentId provided, grab first active student for live preview
        const firstStudent = await req.db.student.findFirst({
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        })

        if (!firstStudent) {
          throw new ValidationError('No active student found for live preview')
        }

        const payload = await DocumentEngineService.compileDocumentPayload(req.db, {
          documentType: documentType as DocumentType,
          studentId: firstStudent.id,
          examId,
        })
        res.json({ success: true, data: payload })
        return
      }

      const payload = await DocumentEngineService.compileDocumentPayload(req.db, {
        documentType: documentType as DocumentType,
        studentId,
        examId,
      })

      res.json({ success: true, data: payload })
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /api/v1/documents/generate
   * Generate official document record with Verification ID & Checksum
   */
  static async generateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, studentId, examId } = req.body

      if (!documentType || !studentId) {
        throw new ValidationError('documentType and studentId are required')
      }

      const result = await DocumentEngineService.generateDocumentRecord(req.db, {
        documentType,
        studentId,
        examId,
        generatedBy: req.user?.sub || 'Admin',
      })

      res.status(201).json({
        success: true,
        message: 'Document generated successfully',
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * GET /api/v1/documents/public/verify/:verificationId
   * PUBLIC QR Verification Endpoint — Privacy preserved!
   */
  static async verifyPublicDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const verificationIdStr = Array.isArray(req.params.verificationId)
        ? req.params.verificationId[0]
        : req.params.verificationId

      const verificationData = await DocumentEngineService.verifyDocumentPublic(req.db, verificationIdStr)

      res.json({
        success: true,
        data: verificationData,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /api/v1/documents/bulk-generate/init
   * Bulk Generation Architecture Interface — Returns status flow & queued payload design
   */
  static async bulkGenerateInit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, classId, examId } = req.body

      if (!documentType || !classId) {
        throw new ValidationError('documentType and classId are required')
      }

      const students = await req.db.student.findMany({
        where: { classId, isActive: true, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      })

      const jobId = `BULK-JOB-${Date.now()}`

      res.status(202).json({
        success: true,
        message: `Bulk generation job ${jobId} queued for ${students.length} students.`,
        data: {
          jobId,
          documentType,
          classId,
          examId,
          totalCount: students.length,
          status: 'QUEUED',
          progress: 0,
          estimatedCompletionSeconds: Math.ceil(students.length * 0.5),
        },
      })
    } catch (err) {
      next(err)
    }
  }
}
