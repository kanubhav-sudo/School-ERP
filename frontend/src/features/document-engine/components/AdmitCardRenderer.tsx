/**
 * Admit Card Renderer Component
 *
 * High-fidelity CBSE style Admit Card layout component.
 * Rendered within DocumentEngine container.
 *
 * @module features/document-engine/components/AdmitCardRenderer
 */

import React from 'react'
import type { CompiledDocumentPayload } from '../document-engine.types'
import { DocumentEngine } from './DocumentEngine'

interface AdmitCardRendererProps {
  payload: CompiledDocumentPayload
  showPrintButton?: boolean
}

export const AdmitCardRenderer: React.FC<AdmitCardRendererProps> = ({
  payload,
  showPrintButton = true,
}) => {
  const { school, student, exam, template } = payload
  const config = template.config
  const branding = config.branding
  const sigs = config.signatureBlocks

  const primaryColor = branding.primaryColor || '#1e3a8a'
  const accentColor = branding.accentColor || '#3b82f6'

  // Format date helper
  const formatDate = (dStr?: string | Date | null) => {
    if (!dStr) return '-'
    const d = new Date(dStr)
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Day name helper
  const getDayName = (dStr: string) => {
    const d = new Date(dStr)
    return isNaN(d.getTime())
      ? ''
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
  }

  return (
    <DocumentEngine payload={payload} showPrintButton={showPrintButton}>
      <div className="space-y-6">
        {/* 1. School Branding & Header */}
        <div
          className="pb-4 border-b-4 flex items-center justify-between"
          style={{ borderColor: primaryColor }}
        >
          <div className="flex items-center space-x-4">
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school.name}
                className="w-20 h-20 object-contain rounded"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow"
                style={{ backgroundColor: primaryColor }}
              >
                {school.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: primaryColor }}>
                {branding.schoolName || school.name}
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                {school.address ? `${school.address}, ${school.city || ''} ${school.state || ''}` : 'Affiliated to CBSE, New Delhi'}
              </p>
              <p className="text-xs text-gray-500">
                Email: {school.contactEmail || 'info@school.edu'} | Phone: {school.contactPhone || '+91 98765 43210'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className="inline-block px-3 py-1 text-xs font-bold text-white uppercase rounded shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {config.preset} PATTERN
            </span>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">VERSION {template.version}</p>
          </div>
        </div>

        {/* 2. Document Title Banner */}
        <div
          className="py-2.5 px-4 text-center rounded shadow-sm text-white flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="text-left">
            <span className="text-[10px] tracking-wider uppercase font-semibold text-blue-200">
              {config.subtitle || 'EXAMINATION ADMIT CARD'}
            </span>
            <h2 className="text-lg font-bold tracking-wide uppercase leading-tight">
              {config.title}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded tracking-wide">
              {exam?.name || 'ANNUAL EXAMINATION'} ({student.sessionName})
            </span>
          </div>
        </div>

        {/* 3. Student Profile & Photo Grid */}
        <div className="grid grid-cols-12 gap-4 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
          <div className="col-span-9 space-y-2.5 text-xs text-gray-800">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-gray-500 font-medium">Student Name:</span>{' '}
                <span className="font-bold text-sm text-gray-900 uppercase">
                  {student.firstName} {student.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Roll Number:</span>{' '}
                <span className="font-bold text-sm text-blue-900 font-mono">
                  {student.rollNumber || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Admission No:</span>{' '}
                <span className="font-semibold text-gray-900">{student.admissionNumber}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Class & Section:</span>{' '}
                <span className="font-bold text-gray-900">
                  Class {student.className} - {student.sectionName}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Father's Name:</span>{' '}
                <span className="font-medium text-gray-900">{student.fatherName || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Mother's Name:</span>{' '}
                <span className="font-medium text-gray-900">{student.motherName || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Date of Birth:</span>{' '}
                <span className="font-medium text-gray-900">{formatDate(student.dateOfBirth)}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Gender:</span>{' '}
                <span className="font-medium text-gray-900 uppercase">{student.gender || '-'}</span>
              </div>
            </div>
          </div>

          {/* Photograph Box */}
          <div className="col-span-3 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white text-center">
            {config.displayOptions.showStudentPhoto && student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt="Student Photo"
                className="w-24 h-28 object-cover rounded border border-gray-200"
              />
            ) : (
              <div className="w-24 h-28 bg-gray-100 rounded border border-gray-300 flex flex-col items-center justify-center p-2 text-gray-400">
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-[9px] leading-tight font-medium text-gray-500">PASTE RECENT PHOTOGRAPH</span>
              </div>
            )}
            <span className="text-[9px] text-gray-400 mt-1 font-mono">Attested Photo</span>
          </div>
        </div>

        {/* 4. Exam Timetable Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center" style={{ color: primaryColor }}>
            <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: accentColor }}></span>
            Examination Schedule & Timetable
          </h3>
          <table className="w-full text-left border-collapse text-xs border border-gray-300">
            <thead>
              <tr style={{ backgroundColor: primaryColor }} className="text-white text-[11px]">
                <th className="p-2 border border-gray-300 w-12 text-center">S.No</th>
                <th className="p-2 border border-gray-300 w-24">Subject Code</th>
                <th className="p-2 border border-gray-300">Subject Name</th>
                <th className="p-2 border border-gray-300 w-28">Exam Date</th>
                <th className="p-2 border border-gray-300 w-24">Day</th>
                <th className="p-2 border border-gray-300 w-32">Time</th>
                <th className="p-2 border border-gray-300 w-20 text-center">Hall / Room</th>
              </tr>
            </thead>
            <tbody>
              {exam?.schedules && exam.schedules.length > 0 ? (
                exam.schedules.map((sched, idx) => (
                  <tr key={sched.subjectId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border border-gray-300 text-center font-medium">{idx + 1}</td>
                    <td className="p-2 border border-gray-300 font-mono text-gray-700">{sched.subjectCode}</td>
                    <td className="p-2 border border-gray-300 font-bold text-gray-900">{sched.subjectName}</td>
                    <td className="p-2 border border-gray-300">{formatDate(sched.examDate)}</td>
                    <td className="p-2 border border-gray-300 font-medium text-gray-700">{getDayName(sched.examDate)}</td>
                    <td className="p-2 border border-gray-300 text-gray-800">{sched.startTime} - {sched.endTime}</td>
                    <td className="p-2 border border-gray-300 text-center font-semibold text-blue-900">{sched.room || 'Main Hall'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                    No examination timetable scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Candidate Instructions */}
        {config.instructions && config.instructions.length > 0 && (
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[11px] mb-1.5" style={{ color: primaryColor }}>
              Important Candidate Instructions
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 text-[11px]">
              {config.instructions.map((inst, i) => (
                <li key={i} className="leading-snug">{inst}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 6. Signatures & Stamp Section */}
        <div className="pt-6 grid grid-cols-4 gap-4 items-end text-center text-xs text-gray-700">
          {sigs.showCandidate && (
            <div className="border-t border-gray-400 pt-2">
              <div className="h-10"></div>
              <p className="font-semibold text-gray-800">{sigs.candidateLabel || 'Candidate Signature'}</p>
            </div>
          )}

          {sigs.showTeacher && (
            <div className="border-t border-gray-400 pt-2">
              <div className="h-10"></div>
              <p className="font-semibold text-gray-800">{sigs.teacherLabel || 'Class Teacher'}</p>
            </div>
          )}

          {sigs.showExamController && (
            <div className="border-t border-gray-400 pt-2">
              {sigs.examControllerSignatureUrl ? (
                <img src={sigs.examControllerSignatureUrl} alt="Controller Sign" className="h-10 mx-auto object-contain" />
              ) : (
                <div className="h-10"></div>
              )}
              <p className="font-semibold text-gray-800">{sigs.examControllerLabel || 'Exam Controller'}</p>
            </div>
          )}

          {sigs.showPrincipal && (
            <div className="border-t border-gray-400 pt-2">
              {sigs.principalSignatureUrl ? (
                <img src={sigs.principalSignatureUrl} alt="Principal Sign" className="h-10 mx-auto object-contain" />
              ) : (
                <div className="h-10"></div>
              )}
              <p className="font-semibold text-gray-800">{sigs.principalLabel || 'Principal Signature'}</p>
            </div>
          )}
        </div>
      </div>
    </DocumentEngine>
  )
}
