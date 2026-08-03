/**
 * Document Engine Container Component
 *
 * Universal A4 paper layout renderer. Handles:
 * - A4 Page dimensions (210mm x 297mm portrait)
 * - Print Media CSS (`@media print`)
 * - Typography font family injection
 * - Branding primary & accent color variables
 * - Watermark text & opacity overlay
 * - High-resolution browser print layout
 *
 * @module features/document-engine/components/DocumentEngine
 */

import React from 'react'
import type { CompiledDocumentPayload } from '../document-engine.types'

interface DocumentEngineProps {
  payload: CompiledDocumentPayload
  children: React.ReactNode
  showPrintButton?: boolean
}

export const DocumentEngine: React.FC<DocumentEngineProps> = ({
  payload,
  children,
  showPrintButton = true,
}) => {
  const { template, school, verificationId, verificationUrl } = payload
  const config = template.config
  const branding = config.branding
  const watermark = config.watermark

  const handlePrint = () => {
    window.print()
  }

  // QR Code URL using standardized Google Chart API / QRServer API fallback for reliable cross-browser SVG rendering
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
    verificationUrl
  )}`

  return (
    <div className="flex flex-col items-center w-full my-4 font-sans print:my-0 print:p-0">
      {/* Action Bar (Screen only) */}
      {showPrintButton && (
        <div className="flex items-center justify-between w-full max-w-[210mm] mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm print:hidden">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
              v{template.version}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {config.title} ({config.preset} Preset)
              </h4>
              <p className="text-xs text-gray-500">Verification ID: {verificationId}</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 002-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print A4 Document
          </button>
        </div>
      )}

      {/* Printable A4 Container */}
      <div
        id="printable-document"
        className="relative w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-xl print:shadow-none print:m-0 print:w-full print:min-h-0 border border-gray-300 print:border-none p-8 flex flex-col justify-between overflow-hidden"
        style={{
          fontFamily: branding.fontFamily === 'Roboto' ? 'Roboto, sans-serif' : branding.fontFamily === 'Outfit' ? 'Outfit, sans-serif' : branding.fontFamily === 'Playfair' ? 'Georgia, serif' : 'Inter, sans-serif',
        }}
      >
        {/* Watermark Overlay */}
        {watermark.enabled && watermark.text && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            style={{ opacity: watermark.opacity || 0.08 }}
          >
            <span className="text-6xl font-black tracking-widest uppercase text-gray-900 rotate-[-35deg] text-center border-4 border-dashed border-gray-900 p-8 rounded-xl">
              {watermark.text}
            </span>
          </div>
        )}

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          {/* Main Document Body */}
          <div>{children}</div>

          {/* Document Footer & QR Verification Box */}
          <div className="mt-8 pt-4 border-t-2 border-gray-300 flex items-end justify-between text-xs text-gray-600">
            <div className="space-y-1 max-w-[65%]">
              <p className="font-semibold text-gray-800">
                {branding.footerText || 'This is an official computer-generated document.'}
              </p>
              <p className="text-[10px] text-gray-500">
                Issued by: <span className="font-medium text-gray-700">{school.name}</span> | Date:{' '}
                {new Date(payload.issuedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[9px] font-mono text-gray-400">
                VERIFICATION ID: <span className="font-bold text-gray-800">{verificationId}</span> | SHA-256:{' '}
                {payload.checksum.substring(0, 16)}...
              </p>
            </div>

            {/* QR Code & Scan Prompt */}
            {config.displayOptions.showQR && (
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded border border-gray-200 print:bg-transparent">
                <img
                  src={qrCodeImageUrl}
                  alt="Document QR Code"
                  className="w-16 h-16 object-contain"
                  loading="eager"
                />
                <div className="text-[9px] leading-tight text-gray-600">
                  <p className="font-bold text-gray-800">SCAN TO VERIFY</p>
                  <p className="text-gray-500">Official Authenticity</p>
                  <p className="text-[8px] text-blue-600 underline truncate max-w-[90px]">
                    cloudems.verify
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global CSS for Print Media */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-document, #printable-document * {
            visibility: visible;
          }
          #printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
