/**
 * Report Card Renderer Component
 *
 * High-fidelity CBSE style Report Card layout component.
 * Rendered within DocumentEngine container.
 *
 * @module features/document-engine/components/ReportCardRenderer
 */

import React from 'react'
import type { CompiledDocumentPayload } from '../document-engine.types'
import { DocumentEngine } from './DocumentEngine'

interface ReportCardRendererProps {
  payload: CompiledDocumentPayload
  showPrintButton?: boolean
}

export const ReportCardRenderer: React.FC<ReportCardRendererProps> = ({
  payload,
  showPrintButton = true,
}) => {
  const { school, student, exam, marksSummary, attendance, template } = payload
  const config = template.config
  const branding = config.branding
  const sigs = config.signatureBlocks

  const primaryColor = branding.primaryColor || '#0f766e'
  const accentColor = branding.accentColor || '#14b8a6'

  const formatDate = (dStr?: string | Date | null) => {
    if (!dStr) return '-'
    const d = new Date(dStr)
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Result Badge color helper
  const getResultBadgeStyle = (status?: string) => {
    if (status === 'PASS') return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    if (status === 'COMPARTMENT') return 'bg-amber-100 text-amber-800 border-amber-300'
    return 'bg-rose-100 text-rose-800 border-rose-300'
  }

  return (
    <DocumentEngine payload={payload} showPrintButton={showPrintButton}>
      <div className="space-y-5">
        {/* 1. School Header */}
        <div
          className="pb-3 border-b-4 flex items-center justify-between"
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
                Contact: {school.contactPhone || '+91 98765 43210'} | Website: {school.website || 'www.school.edu'}
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
            <p className="text-[10px] text-gray-400 mt-1 font-mono">TEMPLATE V{template.version}</p>
          </div>
        </div>

        {/* 2. Title Banner */}
        <div
          className="py-2.5 px-4 text-center rounded shadow-sm text-white flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="text-left">
            <span className="text-[10px] tracking-wider uppercase font-semibold text-teal-200">
              {config.subtitle || 'ACADEMIC ASSESSMENT REPORT'}
            </span>
            <h2 className="text-lg font-bold tracking-wide uppercase leading-tight">
              {config.title}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded tracking-wide">
              {exam?.name || 'ANNUAL ASSESSMENT'} ({student.sessionName})
            </span>
          </div>
        </div>

        {/* 3. Student Profile Grid */}
        <div className="grid grid-cols-12 gap-4 bg-teal-50/40 p-3.5 rounded-lg border border-teal-100 text-xs text-gray-800">
          <div className="col-span-9 grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="text-gray-500 font-medium">Student Name:</span>{' '}
              <span className="font-bold text-sm text-gray-900 uppercase">
                {student.firstName} {student.lastName}
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Roll Number:</span>{' '}
              <span className="font-bold text-sm text-teal-900 font-mono">
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
            {config.displayOptions.showAttendance && (
              <div>
                <span className="text-gray-500 font-medium">Attendance:</span>{' '}
                <span className="font-bold text-gray-900">
                  {attendance?.presentDays || 0} / {attendance?.totalDays || 0} ({attendance?.percentage || 0}%)
                </span>
              </div>
            )}
          </div>

          {/* Student Photo */}
          <div className="col-span-3 flex items-center justify-center border border-teal-200 rounded p-1 bg-white">
            {config.displayOptions.showStudentPhoto && student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt="Student Photo"
                className="w-20 h-24 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-24 bg-gray-100 rounded flex flex-col items-center justify-center text-gray-400">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-[8px] text-gray-400">STUDENT PHOTO</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Scholastic Performance Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center" style={{ color: primaryColor }}>
            <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: accentColor }}></span>
            Part 1: Scholastic Performance
          </h3>
          <table className="w-full text-left border-collapse text-xs border border-gray-300">
            <thead>
              <tr style={{ backgroundColor: primaryColor }} className="text-white text-[11px]">
                <th className="p-2 border border-gray-300 w-10 text-center">S.No</th>
                <th className="p-2 border border-gray-300 w-24">Subject Code</th>
                <th className="p-2 border border-gray-300">Subject Name</th>
                <th className="p-2 border border-gray-300 w-24 text-center">Max Marks</th>
                <th className="p-2 border border-gray-300 w-24 text-center">Marks Obtained</th>
                <th className="p-2 border border-gray-300 w-20 text-center">Grade</th>
                <th className="p-2 border border-gray-300 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {marksSummary?.subjects && marksSummary.subjects.length > 0 ? (
                marksSummary.subjects.map((item, idx) => (
                  <tr key={item.subjectId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border border-gray-300 text-center font-medium">{idx + 1}</td>
                    <td className="p-2 border border-gray-300 font-mono text-gray-700">{item.subjectCode}</td>
                    <td className="p-2 border border-gray-300 font-bold text-gray-900">{item.subjectName}</td>
                    <td className="p-2 border border-gray-300 text-center font-medium">{item.maxMarks}</td>
                    <td className="p-2 border border-gray-300 text-center font-bold text-gray-900">{item.obtainedMarks}</td>
                    <td className="p-2 border border-gray-300 text-center font-bold text-teal-800">{item.grade}</td>
                    <td className="p-2 border border-gray-300 text-center font-medium">
                      <span className={item.status === 'PASS' ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                    No marks entry recorded for this examination.
                  </td>
                </tr>
              )}
              {/* Summary Total Row */}
              {marksSummary && (
                <tr className="bg-teal-50/80 font-bold text-gray-900 border-t-2 border-teal-600">
                  <td colSpan={3} className="p-2.5 border border-gray-300 text-right uppercase tracking-wider text-xs">
                    Grand Total
                  </td>
                  <td className="p-2.5 border border-gray-300 text-center">{marksSummary.totalMaxMarks}</td>
                  <td className="p-2.5 border border-gray-300 text-center text-sm font-black text-teal-900">
                    {marksSummary.totalObtainedMarks}
                  </td>
                  <td className="p-2.5 border border-gray-300 text-center text-sm font-black text-teal-800">
                    {marksSummary.overallGrade}
                  </td>
                  <td className="p-2.5 border border-gray-300 text-center">
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-black rounded border ${getResultBadgeStyle(marksSummary.resultStatus)}`}>
                      {marksSummary.resultStatus}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Overall Performance Summary Box */}
        {marksSummary && (
          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-center text-xs">
            <div className="p-2 bg-white rounded border border-gray-200">
              <span className="text-gray-500 font-medium text-[10px] uppercase block">Percentage</span>
              <span className="text-base font-black text-gray-900">{marksSummary.overallPercentage}%</span>
            </div>
            <div className="p-2 bg-white rounded border border-gray-200">
              <span className="text-gray-500 font-medium text-[10px] uppercase block">Overall Grade</span>
              <span className="text-base font-black text-teal-700">{marksSummary.overallGrade}</span>
            </div>
            <div className="p-2 bg-white rounded border border-gray-200">
              <span className="text-gray-500 font-medium text-[10px] uppercase block">Final Result</span>
              <span className={`text-sm font-black uppercase px-2 py-0.5 rounded ${getResultBadgeStyle(marksSummary.resultStatus)}`}>
                {marksSummary.resultStatus}
              </span>
            </div>
          </div>
        )}

        {/* 6. CBSE Grading Scale Legend */}
        {config.displayOptions.showGradeLegend && (
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-[10px] text-gray-600">
            <span className="font-bold text-gray-800 uppercase block mb-1">CBSE Grading Scale:</span>
            <div className="grid grid-cols-4 gap-1">
              <span><strong>A1:</strong> 91-100%</span>
              <span><strong>A2:</strong> 81-90%</span>
              <span><strong>B1:</strong> 71-80%</span>
              <span><strong>B2:</strong> 61-70%</span>
              <span><strong>C1:</strong> 51-60%</span>
              <span><strong>C2:</strong> 41-50%</span>
              <span><strong>D:</strong> 33-40%</span>
              <span><strong>E:</strong> Below 33%</span>
            </div>
          </div>
        )}

        {/* 7. Signatures & Stamp */}
        <div className="pt-6 grid grid-cols-4 gap-4 items-end text-center text-xs text-gray-700">
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

          {sigs.showParent && (
            <div className="border-t border-gray-400 pt-2">
              <div className="h-10"></div>
              <p className="font-semibold text-gray-800">{sigs.parentLabel || 'Parent Signature'}</p>
            </div>
          )}
        </div>
      </div>
    </DocumentEngine>
  )
}
