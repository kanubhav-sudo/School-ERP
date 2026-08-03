/**
 * Public Document Verification Page
 *
 * Accessible at /verify/:verificationId — NO authentication required.
 * Scans QR codes from generated documents and returns tamper-proof verification status.
 * Privacy-preserved: only non-sensitive data is shown to the public.
 *
 * @module pages/PublicVerifyPage
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { documentEngineApi } from '../features/document-engine/document-engine.api'
import type { VerificationResultData } from '../features/document-engine/document-engine.types'
import {
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  User,
  School,
  Hash,
} from 'lucide-react'

export function PublicVerifyPage() {
  const { verificationId } = useParams<{ verificationId: string }>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VerificationResultData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!verificationId) return
    documentEngineApi
      .verifyPublicDocument(verificationId)
      .then(setData)
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
          'Document not found. The verification ID may be incorrect or the document may have been revoked.'
        )
      })
      .finally(() => setLoading(false))
  }, [verificationId])

  const isRevoked = data?.status === 'REVOKED'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex flex-col items-center justify-center px-4 py-12">
      {/* CloudEMS Branding */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg mb-3">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">CloudEMS Document Verification</h1>
        <p className="text-sm text-gray-500 mt-0.5">Official Academic Document Authenticity Check</p>
      </div>

      {/* Verification ID Display */}
      {verificationId && (
        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm text-gray-600">
          <Hash className="w-4 h-4 text-gray-400" />
          <span className="font-mono font-medium text-gray-800">{verificationId}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-10 w-full max-w-md flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verifying document authenticity…</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-700">Verification Failed</h2>
              <p className="text-red-500 text-sm mt-1">{error}</p>
            </div>
            <div className="w-full p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600">
              If you believe this is an error, please contact the issuing school directly.
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {!loading && data && (
        <div
          className={`bg-white rounded-2xl border shadow-xl w-full max-w-md overflow-hidden ${
            isRevoked ? 'border-red-300' : 'border-green-300'
          }`}
        >
          {/* Status Banner */}
          <div
            className={`px-6 py-4 flex items-center gap-3 ${
              isRevoked
                ? 'bg-red-50 border-b border-red-200'
                : 'bg-green-50 border-b border-green-200'
            }`}
          >
            {isRevoked ? (
              <XCircle className="w-7 h-7 text-red-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-7 h-7 text-green-500 flex-shrink-0" />
            )}
            <div>
              <h2
                className={`text-base font-bold ${
                  isRevoked ? 'text-red-700' : 'text-green-700'
                }`}
              >
                {isRevoked ? 'Document Revoked' : 'Document Verified ✓'}
              </h2>
              <p className={`text-xs ${isRevoked ? 'text-red-500' : 'text-green-600'}`}>
                {isRevoked
                  ? 'This document has been officially revoked by the issuing school.'
                  : 'This is an authentic, tamper-proof official document.'}
              </p>
            </div>
          </div>

          {/* Document Details */}
          <div className="p-6 space-y-4">
            {/* School */}
            <div className="flex items-start gap-3">
              {data.schoolLogo ? (
                <img
                  src={data.schoolLogo}
                  alt={data.schoolName}
                  className="w-10 h-10 rounded-lg object-contain border border-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <School className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Issuing School</p>
                <p className="font-semibold text-gray-900">{data.schoolName}</p>
                {data.schoolLocation && (
                  <p className="text-xs text-gray-500">{data.schoolLocation}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Student */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Student</p>
                <p className="font-semibold text-gray-900">{data.studentName}</p>
                {data.admissionNumber && (
                  <p className="text-xs text-gray-500 font-mono">Admission No: {data.admissionNumber}</p>
                )}
                {data.className && <p className="text-xs text-gray-500">{data.className}</p>}
                {data.sessionName && <p className="text-xs text-gray-500">{data.sessionName}</p>}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Document Info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Document Type</p>
                <p className="font-semibold text-gray-900">
                  {data.documentType === 'ADMIT_CARD'
                    ? 'Examination Admit Card'
                    : data.documentType === 'REPORT_CARD'
                    ? 'Academic Report Card'
                    : data.documentType.replace(/_/g, ' ')}
                </p>
                {data.examName && <p className="text-xs text-gray-500">Exam: {data.examName}</p>}
                {data.resultStatus && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      data.resultStatus === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : data.resultStatus === 'COMPARTMENT'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    Result: {data.resultStatus}{' '}
                    {data.overallPercentage !== undefined &&
                      `(${data.overallPercentage.toFixed(1)}%)`}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Issued Date */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date of Issue</p>
                <p className="font-semibold text-gray-900">
                  {new Date(data.issuedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Checksum */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">SHA-256 Integrity Checksum</p>
              <p className="font-mono text-[10px] text-gray-600 break-all leading-relaxed">
                {data.checksum}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5">
            <p className="text-center text-[11px] text-gray-400">
              Verified by{' '}
              <span className="font-semibold text-blue-600">CloudEMS</span> Academic Document Engine.
              For queries, contact the issuing school.
            </p>
          </div>
        </div>
      )}

      {/* Back Link */}
      <div className="mt-8">
        <Link
          to="/login"
          className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
        >
          ← Return to CloudEMS Portal
        </Link>
      </div>
    </div>
  )
}
