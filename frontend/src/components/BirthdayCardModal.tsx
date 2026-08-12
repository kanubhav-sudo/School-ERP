/**
 * BirthdayCardModal
 *
 * Professional birthday card rendered in an A4-style modal.
 * Uses the same print mechanism as the Document Engine.
 * Includes pure CSS confetti animation — no external libraries.
 *
 * @module components/BirthdayCardModal
 */

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { X, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────

export interface BirthdayCardModalProps {
  open: boolean
  onClose: () => void
  name: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  schoolName: string
  schoolLogoUrl?: string | null
  principalName?: string | null
  schoolStampUrl?: string | null
  /** Optional extra info line (class/designation) */
  subtitle?: string | null
}

// ─── CSS confetti keyframes (injected once) ───────────────────

const CONFETTI_STYLE = `
@keyframes confettiDrop {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0.2; }
}
.confetti-piece {
  position: fixed;
  width: 8px;
  height: 8px;
  top: -10px;
  animation: confettiDrop linear infinite;
  pointer-events: none;
  z-index: 9999;
  border-radius: 2px;
}
@media print {
  .birthday-no-print { display: none !important; }
  .birthday-card-root { box-shadow: none !important; border: none !important; }
}
`

const CONFETTI_COLORS = [
  '#f472b6',
  '#a78bfa',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#fb923c',
  '#e879f9',
  '#38bdf8',
]

// ─── Component ────────────────────────────────────────────────

export function BirthdayCardModal({
  open,
  onClose,
  name,
  role,
  schoolName,
  schoolLogoUrl,
  principalName,
  schoolStampUrl,
  subtitle,
}: BirthdayCardModalProps) {
  const styleInjected = useRef(false)

  useEffect(() => {
    if (!styleInjected.current) {
      const s = document.createElement('style')
      s.textContent = CONFETTI_STYLE
      document.head.appendChild(s)
      styleInjected.current = true
    }
  }, [])

  const handlePrint = () => window.print()

  const handleDownloadPdf = () => {
    // Open print dialog which lets user save as PDF
    window.print()
  }

  if (!open) return null

  const today = format(new Date(), 'd MMMM yyyy')
  const roleLabel = role === 'STUDENT' ? 'Student' : role === 'TEACHER' ? 'Teacher' : 'Staff'

  // Confetti pieces
  const confettiPieces = Array.from({ length: 30 }).map((_, i) => ({
    left: `${(i * 13 + 3) % 98}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: `${2.5 + (i % 5) * 0.6}s`,
    delay: `${(i % 8) * 0.2}s`,
    size: `${6 + (i % 4) * 3}px`,
    shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm birthday-no-print">
      {/* CSS Confetti */}
      {confettiPieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece birthday-no-print"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Modal container */}
      <div className="relative w-full max-w-2xl mx-4 my-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-3 birthday-no-print">
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownloadPdf} size="sm" variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              Save as PDF
            </Button>
          </div>
          <Button onClick={onClose} size="sm" variant="ghost" className="gap-1.5">
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        {/* Birthday Card — A4 proportional */}
        <div
          className="birthday-card-root bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {/* Card top gradient band */}
          <div className="h-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />

          <div className="p-10 text-center">
            {/* School logo */}
            {schoolLogoUrl ? (
              <img
                src={schoolLogoUrl}
                alt={`${schoolName} logo`}
                className="h-20 w-20 object-contain mx-auto rounded-full border-4 border-rose-100 shadow-md"
              />
            ) : (
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {schoolName?.charAt(0) ?? 'S'}
              </div>
            )}

            <h2 className="mt-3 text-sm font-semibold text-gray-500 uppercase tracking-widest">
              {schoolName}
            </h2>

            {/* Decorative line */}
            <div className="flex items-center justify-center gap-3 my-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
              <span className="text-3xl">🎂</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
            </div>

            {/* Main birthday wish */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-rose-400 uppercase tracking-widest mb-2">
                With warm wishes on your special day
              </p>
              <h1
                className="text-4xl font-extrabold mb-1"
                style={{
                  background: 'linear-gradient(135deg, #f43f5e, #ec4899, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                🎉 Happy Birthday!
              </h1>
              <p className="text-2xl font-bold text-gray-800 mt-2">{name}</p>
              <p className="text-sm text-gray-400 mt-1">
                {roleLabel}
                {subtitle ? ` · ${subtitle}` : ''}
              </p>
            </div>

            {/* Wish message */}
            <div className="mx-auto max-w-sm bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-5 mb-8">
              <p className="text-gray-600 text-sm leading-relaxed italic">
                "May this birthday mark the beginning of a wonderful journey filled with success,
                happiness, and great achievements. Wishing you all the very best in everything you
                do. May each new day bring fresh opportunities and new reasons to smile."
              </p>
            </div>

            {/* Signature section */}
            <div className="flex items-end justify-between mt-8 pt-6 border-t border-gray-100">
              <div className="text-left">
                {schoolStampUrl && (
                  <img
                    src={schoolStampUrl}
                    alt="School stamp"
                    className="h-16 w-16 object-contain opacity-80 mb-2"
                  />
                )}
                <p className="text-xs text-gray-400">Dated: {today}</p>
              </div>

              <div className="text-center">
                <div className="h-10 border-b border-gray-300 mb-2 min-w-[120px]" />
                <p className="text-xs font-bold text-gray-700">{principalName || 'Principal'}</p>
                <p className="text-xs text-gray-400">Principal</p>
                <p className="text-xs text-gray-400">{schoolName}</p>
              </div>
            </div>
          </div>

          {/* Card bottom gradient band */}
          <div className="h-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
        </div>
      </div>
    </div>
  )
}
