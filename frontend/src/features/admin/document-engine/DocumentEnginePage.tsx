/**
 * Document Engine Admin Page
 *
 * Central hub for managing Academic Document Templates (Admit Cards, Report Cards).
 * Provides template editor launch, live preview, and document generation actions.
 *
 * @module features/admin/document-engine/DocumentEnginePage
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { documentEngineApi } from '../../document-engine/document-engine.api'
import { BlockBasedTemplateEditor } from '../../document-engine/components/BlockBasedTemplateEditor'
import { AdmitCardRenderer } from '../../document-engine/components/AdmitCardRenderer'
import { ReportCardRenderer } from '../../document-engine/components/ReportCardRenderer'
import type { DocumentType, CompiledDocumentPayload } from '../../document-engine/document-engine.types'
import {
  FileText,
  Settings,
  Eye,
  Download,
  Shield,
  CheckCircle,
  AlertCircle,
  Layers,
} from 'lucide-react'

const DOCUMENT_TYPES: Array<{
  type: DocumentType
  label: string
  description: string
  icon: React.ReactNode
  color: string
}> = [
  {
    type: 'ADMIT_CARD',
    label: 'Admit Card',
    description: 'Official hall ticket for examinations with exam schedule & student details',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    type: 'REPORT_CARD',
    label: 'Report Card',
    description: 'Academic result document with subject-wise marks, grades & performance summary',
    icon: <Layers className="w-6 h-6" />,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
]

export function DocumentEnginePage() {
  const queryClient = useQueryClient()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorDocType, setEditorDocType] = useState<DocumentType>('ADMIT_CARD')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDocType, setPreviewDocType] = useState<DocumentType>('ADMIT_CARD')
  const [previewPayload, setPreviewPayload] = useState<CompiledDocumentPayload | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const openEditor = (docType: DocumentType) => {
    setEditorDocType(docType)
    setEditorOpen(true)
  }

  const openPreview = async (docType: DocumentType) => {
    setPreviewDocType(docType)
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewPayload(null)
    try {
      const payload = await documentEngineApi.getLivePreview(docType)
      setPreviewPayload(payload)
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      setPreviewError(
        errorObj?.response?.data?.message ||
        'Could not load preview. Ensure at least one active student exists.'
      )
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Document Engine</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage document templates, preview layouts, and generate official school documents.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Phase 5 — Active
        </div>
      </div>

      {/* Engine Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">CloudEMS Document Generation Engine</h2>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Every official document generated includes a tamper-proof <strong>Verification ID</strong>,{' '}
              <strong>SHA-256 checksum</strong>, and a scannable <strong>QR code</strong> for instant
              public authenticity verification at <code className="bg-white/20 px-1 rounded text-xs">cloudems.verify</code>.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              {['Versioned Templates', 'CBSE / ICSE / State Board Presets', 'QR Verification', 'A4 Print-Ready', 'SHA-256 Checksum'].map(
                (feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-medium"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {feat}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Type Cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Document Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOCUMENT_TYPES.map(({ type, label, description, icon, color }) => (
            <div
              key={type}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${color}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base">{label}</h3>
                  <p className="text-gray-500 text-sm mt-0.5 leading-snug">{description}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  onClick={() => openEditor(type)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Edit Template
                </button>
                <button
                  onClick={() => openPreview(type)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Live Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Generation Architecture Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 text-sm">Bulk Generation — Architecture Ready</h3>
            <p className="text-amber-700 text-sm mt-1">
              The Bulk Generation API (<code className="bg-amber-100 px-1 rounded text-xs">POST /documents/bulk-generate/init</code>) is
              designed and wired. Full async queue processing (class-level batch generation) will be enabled in Phase 6. 
              To generate documents per-student, use the Admit Card / Report Card actions in the <strong>Exams</strong> module.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">How the Engine Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Data Provider',
              desc: 'Collects student, school, exam, and marks data from all sources',
              color: 'bg-blue-100 text-blue-700',
            },
            {
              step: '02',
              title: 'Calculation Engine',
              desc: 'Computes grades, totals, percentages, attendance, and result status',
              color: 'bg-purple-100 text-purple-700',
            },
            {
              step: '03',
              title: 'Template Renderer',
              desc: 'Applies the versioned template config to render a pixel-perfect A4 document',
              color: 'bg-emerald-100 text-emerald-700',
            },
            {
              step: '04',
              title: 'Verification',
              desc: 'Stamps SHA-256 checksum + QR verification ID for tamper-proof authenticity',
              color: 'bg-amber-100 text-amber-700',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mb-3 ${color}`}>
                {step}
              </span>
              <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
              <p className="text-gray-500 text-xs mt-1 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Template Editor Modal */}
      <BlockBasedTemplateEditor
        documentType={editorDocType}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false)
          queryClient.invalidateQueries({ queryKey: ['document-template'] })
        }}
      />

      {/* Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[850px] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Live Preview —{' '}
                    {previewDocType === 'ADMIT_CARD' ? 'Admit Card' : 'Report Card'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Showing sample output using first active student in the system
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setPreviewOpen(false); setPreviewPayload(null) }}
                className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {previewLoading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Compiling document preview…</span>
                </div>
              )}
              {previewError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {previewError}
                </div>
              )}
              {previewPayload && !previewLoading && (
                <>
                  {previewDocType === 'ADMIT_CARD' ? (
                    <AdmitCardRenderer payload={previewPayload} showPrintButton={true} />
                  ) : (
                    <ReportCardRenderer payload={previewPayload} showPrintButton={true} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
