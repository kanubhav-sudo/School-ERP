/**
 * Document Engine API Service
 *
 * Axios requests for fetching templates, saving versions, live previews,
 * document generation, and public QR verification.
 *
 * @module features/document-engine/api
 */

import { api } from '../../lib/axios'
import type {
  DocumentType,
  TemplatePreset,
  DocumentTemplateConfig,
  AcademicDocumentTemplateRecord,
  CompiledDocumentPayload,
  VerificationResultData,
} from './document-engine.types'

export const documentEngineApi = {
  /**
   * Fetch active template configuration for document type
   */
  async getTemplate(documentType: DocumentType): Promise<AcademicDocumentTemplateRecord> {
    const res = await api.get(`/documents/templates/${documentType}`)
    return res.data.data
  },

  /**
   * Save a new template version
   */
  async saveTemplate(
    documentType: DocumentType,
    data: {
      preset?: TemplatePreset
      title?: string
      description?: string
      configuration: DocumentTemplateConfig
    }
  ): Promise<AcademicDocumentTemplateRecord> {
    const res = await api.post(`/documents/templates/${documentType}`, data)
    return res.data.data
  },

  /**
   * Reset template to preset defaults (CBSE, ICSE, STATE_BOARD, CUSTOM)
   */
  async resetTemplate(
    documentType: DocumentType,
    preset: TemplatePreset = 'CBSE'
  ): Promise<AcademicDocumentTemplateRecord> {
    const res = await api.post(`/documents/templates/${documentType}/reset`, { preset })
    return res.data.data
  },

  /**
   * Get Live Document Preview payload
   */
  async getLivePreview(
    documentType: DocumentType,
    params?: { studentId?: string; examId?: string }
  ): Promise<CompiledDocumentPayload> {
    const res = await api.get(`/documents/preview/${documentType}`, { params })
    return res.data.data
  },

  /**
   * Generate official document record with Verification ID & Checksum
   */
  async generateDocument(data: {
    documentType: DocumentType
    studentId: string
    examId?: string
  }): Promise<{ record: Record<string, unknown>; payload: CompiledDocumentPayload }> {
    const res = await api.post('/documents/generate', data)
    return res.data.data
  },

  /**
   * Public QR Verification lookup (No auth header required)
   */
  async verifyPublicDocument(verificationId: string): Promise<VerificationResultData> {
    const res = await api.get(`/documents/public/verify/${verificationId}`)
    return res.data.data
  },
}
