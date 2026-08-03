/**
 * Document Generation Engine Service — Core Orchestration Service
 *
 * Coordinates Data Provider, Calculation Engine, Versioned Template Manager,
 * SHA-256 Checksum generation, QR Verification, and Document Persistence.
 *
 * @module services/document-engine/document-engine
 */

import crypto from 'crypto'
import { NotFoundError } from '../../core/errors'
import { DocumentType, TemplatePreset } from '../../generated/prisma'
import { DataProviderService } from './data-provider.service'
import { CalculationEngineService } from './calculation-engine.service'
import { getDefaultPresetConfig, DocumentTemplateConfig } from './presets'

export interface CompiledDocumentPayload {
  verificationId: string
  checksum: string
  documentType: DocumentType
  template: {
    id: string
    version: number
    preset: TemplatePreset
    config: DocumentTemplateConfig
  }
  school: {
    id: string
    name: string
    logoUrl?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    website?: string | null
    principalName?: string | null
  }
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
    rollNumber?: string | null
    fatherName?: string | null
    motherName?: string | null
    dateOfBirth?: Date | null
    gender?: string | null
    photoUrl?: string | null
    className: string
    sectionName: string
    sessionName: string
  }
  exam?: {
    id: string
    name: string
    startDate?: Date | null
    endDate?: Date | null
    schedules: Array<{
      subjectId: string
      subjectName: string
      subjectCode: string
      examDate: Date
      startTime: string
      endTime: string
      room?: string | null
    }>
  }
  marksSummary?: ReturnType<typeof CalculationEngineService.calculateMarksSummary>
  attendance?: ReturnType<typeof CalculationEngineService.calculateAttendance>
  issuedAt: Date
  verificationUrl: string
}

export class DocumentEngineService {
  /**
   * Helper: Generate unique verification ID (e.g. DOC-2026-ADM-8F92A1)
   */
  public static generateVerificationId(documentType: DocumentType): string {
    const year = new Date().getFullYear()
    const prefix = documentType === 'ADMIT_CARD' ? 'ADM' : documentType === 'REPORT_CARD' ? 'REP' : 'DOC'
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `DOC-${year}-${prefix}-${randomHex}`
  }

  /**
   * Helper: Generate SHA-256 checksum for document metadata payload
   */
  public static calculateChecksum(data: Record<string, unknown>): string {
    const jsonStr = JSON.stringify(data)
    return crypto.createHash('sha256').update(jsonStr).digest('hex')
  }

  /**
   * Get active template for a school and document type (creates v1 default if none exists)
   */
  static async getLatestTemplate(db: any, documentType: DocumentType) {
    let template = await db.academicDocumentTemplate.findFirst({
      where: {
        documentType,
        isActive: true,
      },
      orderBy: { version: 'desc' },
    })

    if (!template) {
      // Create initial v1 default preset
      const defaultConfig = getDefaultPresetConfig(documentType, 'CBSE')
      template = await db.academicDocumentTemplate.create({
        data: {
          documentType,
          preset: 'CBSE',
          version: 1,
          isActive: true,
          title: defaultConfig.title,
          description: `Default ${documentType} template (Version 1)`,
          configuration: defaultConfig as any,
        },
      })
    }

    return template
  }

  /**
   * Save new template version (editing creates version n+1 without overwriting historical version)
   */
  static async saveTemplateVersion(
    db: any,
    documentType: DocumentType,
    data: {
      preset?: TemplatePreset
      title?: string
      description?: string
      configuration: DocumentTemplateConfig
    },
    createdBy?: string
  ) {
    // Find latest max version number
    const latestTemplate = await db.academicDocumentTemplate.findFirst({
      where: { documentType },
      orderBy: { version: 'desc' },
    })

    const nextVersion = latestTemplate ? latestTemplate.version + 1 : 1

    return db.$transaction(async (tx: any) => {
      // Deactivate older templates for this type
      await tx.academicDocumentTemplate.updateMany({
        where: { documentType, isActive: true },
        data: { isActive: false },
      })

      // Create new template version record
      const newTemplate = await tx.academicDocumentTemplate.create({
        data: {
          documentType,
          preset: data.preset || data.configuration.preset || 'CBSE',
          version: nextVersion,
          isActive: true,
          title: data.title || data.configuration.title || `${documentType} Template v${nextVersion}`,
          description: data.description || `Updated template version ${nextVersion}`,
          configuration: data.configuration as any,
          createdBy: createdBy || 'Admin',
        },
      })

      return newTemplate
    })
  }

  /**
   * Reset template to preset defaults (creates a new version)
   */
  static async resetToPreset(
    db: any,
    documentType: DocumentType,
    preset: TemplatePreset = 'CBSE',
    createdBy?: string
  ) {
    const defaultConfig = getDefaultPresetConfig(documentType, preset)
    return this.saveTemplateVersion(
      db,
      documentType,
      {
        preset,
        title: defaultConfig.title,
        description: `Reset to ${preset} preset defaults`,
        configuration: defaultConfig,
      },
      createdBy
    )
  }

  /**
   * Compile standardized Document Payload for live rendering or printing
   */
  static async compileDocumentPayload(
    db: any,
    options: {
      documentType: DocumentType
      studentId: string
      examId?: string
      templateVersion?: number
      appBaseUrl?: string
    }
  ): Promise<CompiledDocumentPayload> {
    const { documentType, studentId, examId, templateVersion, appBaseUrl } = options

    // 1. Fetch template version or active latest template
    let templateRecord
    if (templateVersion) {
      templateRecord = await db.academicDocumentTemplate.findFirst({
        where: { documentType, version: templateVersion },
      })
    }
    if (!templateRecord) {
      templateRecord = await this.getLatestTemplate(db, documentType)
    }

    const templateConfig: DocumentTemplateConfig = templateRecord.configuration as DocumentTemplateConfig

    // 2. Data Provider — Raw Data Gathering
    const rawContext = await DataProviderService.fetchStudentDocumentContext(db, {
      studentId,
      examId,
    })

    // 3. Calculation Engine — Marks & Attendance calculations
    let marksSummary
    if (rawContext.marks) {
      marksSummary = CalculationEngineService.calculateMarksSummary(rawContext.marks)
    }

    const attendance = CalculationEngineService.calculateAttendance(rawContext.attendance)

    // 4. Generate Verification ID & Checksum
    const verificationId = this.generateVerificationId(documentType)
    const checksumData = {
      verificationId,
      schoolId: rawContext.school.id,
      studentId: rawContext.student.id,
      documentType,
      issuedAt: new Date().toISOString(),
      marksSummary: marksSummary ? { total: marksSummary.totalObtainedMarks, status: marksSummary.resultStatus } : null,
    }
    const checksum = this.calculateChecksum(checksumData)

    const baseUrl = appBaseUrl || 'http://localhost:5173'
    const verificationUrl = `${baseUrl}/verify/${verificationId}`

    return {
      verificationId,
      checksum,
      documentType,
      template: {
        id: templateRecord.id,
        version: templateRecord.version,
        preset: templateRecord.preset as TemplatePreset,
        config: templateConfig,
      },
      school: rawContext.school,
      student: rawContext.student,
      exam: rawContext.exam,
      marksSummary,
      attendance,
      issuedAt: new Date(),
      verificationUrl,
    }
  }

  /**
   * Generate official document record in DB
   */
  static async generateDocumentRecord(
    db: any,
    options: {
      documentType: DocumentType
      studentId: string
      examId?: string
      generatedBy?: string
      appBaseUrl?: string
    }
  ) {
    const payload = await this.compileDocumentPayload(db, options)

    const generatedRecord = await db.generatedDocument.create({
      data: {
        documentType: options.documentType,
        templateId: payload.template.id,
        templateVersion: payload.template.version,
        verificationId: payload.verificationId,
        studentId: options.studentId,
        examId: options.examId || null,
        title: `${payload.student.firstName} ${payload.student.lastName} - ${payload.template.config.title}`,
        generatedBy: options.generatedBy || 'System',
        status: 'GENERATED',
        checksum: payload.checksum,
        metadata: payload as any,
      },
    })

    return {
      record: generatedRecord,
      payload,
    }
  }

  /**
   * Public QR Verification Lookup — Privacy Preserved Response!
   * Does NOT expose private phone numbers or detailed subject grade breakdowns.
   */
  static async verifyDocumentPublic(db: any, verificationId: string) {
    const docRecord = await db.generatedDocument.findUnique({
      where: { verificationId },
      include: {
        school: { select: { id: true, name: true, logoUrl: true, city: true, state: true } },
      },
    })

    if (!docRecord) {
      throw new NotFoundError('Invalid Verification ID. Document not found or unverified.')
    }

    const metadata: any = docRecord.metadata || {}

    return {
      verificationId: docRecord.verificationId,
      status: docRecord.status === 'REVOKED' ? 'REVOKED' : 'VALID',
      documentType: docRecord.documentType,
      schoolName: docRecord.school?.name || metadata.school?.name || 'School ERP Academy',
      schoolLogo: docRecord.school?.logoUrl || metadata.school?.logoUrl || null,
      schoolLocation: docRecord.school ? `${docRecord.school.city || ''}, ${docRecord.school.state || ''}` : '',
      studentName: metadata.student ? `${metadata.student.firstName} ${metadata.student.lastName}` : 'Verified Student',
      admissionNumber: metadata.student?.admissionNumber || '',
      className: metadata.student?.className ? `${metadata.student.className} - ${metadata.student.sectionName}` : '',
      sessionName: metadata.student?.sessionName || '',
      examName: metadata.exam?.name || undefined,
      resultStatus: metadata.marksSummary?.resultStatus || undefined,
      overallPercentage: metadata.marksSummary?.overallPercentage || undefined,
      issuedAt: docRecord.generatedAt,
      checksum: docRecord.checksum,
    }
  }
}
