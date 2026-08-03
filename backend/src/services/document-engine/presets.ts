/**
 * Default Document Engine Presets (CBSE, ICSE, State Board, Custom)
 *
 * @module services/document-engine/presets
 */

import { DocumentType, TemplatePreset } from '../../generated/prisma'

export interface BlockConfig {
  id: string
  type: string
  name: string
  enabled: boolean
  order: number
}

export interface DocumentTemplateConfig {
  preset: TemplatePreset
  title: string
  subtitle?: string
  branding: {
    schoolName?: string
    logoUrl?: string | null
    headerText?: string
    footerText?: string
    address?: string
    contact?: string
    primaryColor: string
    accentColor: string
    fontFamily: 'Inter' | 'Roboto' | 'Outfit' | 'Playfair'
  }
  watermark: {
    enabled: boolean
    text: string
    opacity: number
  }
  signatureBlocks: {
    showPrincipal: boolean
    principalLabel: string
    principalSignatureUrl?: string | null
    showExamController: boolean
    examControllerLabel: string
    examControllerSignatureUrl?: string | null
    showTeacher: boolean
    teacherLabel: string
    showCandidate: boolean
    candidateLabel: string
    showParent: boolean
    parentLabel: string
    stampPosition: 'LEFT' | 'RIGHT' | 'CENTER' | 'FLOATING' | 'NONE'
    stampUrl?: string | null
  }
  instructions: string[]
  blocks: BlockConfig[]
  displayOptions: {
    showStudentPhoto: boolean
    showQR: boolean
    showVerificationId: boolean
    showAttendance: boolean
    showRank: boolean
    showGradeLegend: boolean
    showCoScholastic: boolean
  }
}

export const DEFAULT_ADMIT_CARD_BLOCKS: BlockConfig[] = [
  { id: 'header', type: 'header', name: 'School Header & Logo', enabled: true, order: 1 },
  { id: 'studentInfo', type: 'studentInfo', name: 'Student Details & Photograph', enabled: true, order: 2 },
  { id: 'examInfo', type: 'examInfo', name: 'Examination & Timetable Grid', enabled: true, order: 3 },
  { id: 'instructions', type: 'instructions', name: 'Candidate Instructions', enabled: true, order: 4 },
  { id: 'signatures', type: 'signatures', name: 'Signature & Stamp Block', enabled: true, order: 5 },
  { id: 'footer', type: 'footer', name: 'Footer & QR Verification', enabled: true, order: 6 },
]

export const DEFAULT_REPORT_CARD_BLOCKS: BlockConfig[] = [
  { id: 'header', type: 'header', name: 'School Header & Logo', enabled: true, order: 1 },
  { id: 'studentInfo', type: 'studentInfo', name: 'Student Details', enabled: true, order: 2 },
  { id: 'marksTable', type: 'marksTable', name: 'Scholastic Performance Table', enabled: true, order: 3 },
  { id: 'coScholastic', type: 'coScholastic', name: 'Co-Scholastic & Attendance Summary', enabled: true, order: 4 },
  { id: 'remarks', type: 'remarks', name: 'Teacher & Principal Remarks', enabled: true, order: 5 },
  { id: 'signatures', type: 'signatures', name: 'Signature & Stamp Block', enabled: true, order: 6 },
  { id: 'footer', type: 'footer', name: 'Footer & QR Verification', enabled: true, order: 7 },
]

export const DEFAULT_CBSE_ADMIT_CARD_PRESET: DocumentTemplateConfig = {
  preset: 'CBSE',
  title: 'HALL TICKET / ADMIT CARD',
  subtitle: 'CENTRAL BOARD OF SECONDARY EDUCATION PATTERN',
  branding: {
    primaryColor: '#1e3a8a',
    accentColor: '#3b82f6',
    fontFamily: 'Inter',
    headerText: 'ANNUAL EXAMINATION HALL TICKET',
    footerText: 'This Admit Card is computer generated. Entry permitted only with valid ID card.',
  },
  watermark: {
    enabled: true,
    text: 'OFFICIAL ADMIT CARD',
    opacity: 0.08,
  },
  signatureBlocks: {
    showPrincipal: true,
    principalLabel: 'Principal',
    showExamController: true,
    examControllerLabel: 'Controller of Examination',
    showTeacher: false,
    teacherLabel: 'Class Teacher',
    showCandidate: true,
    candidateLabel: 'Candidate Signature',
    showParent: false,
    parentLabel: 'Parent Signature',
    stampPosition: 'RIGHT',
  },
  instructions: [
    'Candidates must carry this Admit Card along with their valid Student Identity Card to the examination hall.',
    'Arrive at the examination venue at least 15 minutes before the scheduled start time.',
    'Mobile phones, smart watches, electronic gadgets, and unauthorized printed material are strictly prohibited.',
    'Write your Roll Number and Admission Number clearly on the answer sheets provided.',
  ],
  blocks: DEFAULT_ADMIT_CARD_BLOCKS,
  displayOptions: {
    showStudentPhoto: true,
    showQR: true,
    showVerificationId: true,
    showAttendance: false,
    showRank: false,
    showGradeLegend: false,
    showCoScholastic: false,
  },
}

export const DEFAULT_CBSE_REPORT_CARD_PRESET: DocumentTemplateConfig = {
  preset: 'CBSE',
  title: 'ANNUAL PROGRESS REPORT CARD',
  subtitle: 'ACADEMIC PERFORMANCE & EVALUATION',
  branding: {
    primaryColor: '#0f766e',
    accentColor: '#14b8a6',
    fontFamily: 'Inter',
    headerText: 'ACADEMIC ASSESSMENT & PERFORMANCE REPORT',
    footerText: 'This is an official document. Tampering or unauthorized alteration is illegal.',
  },
  watermark: {
    enabled: true,
    text: 'ACADEMIC REPORT',
    opacity: 0.06,
  },
  signatureBlocks: {
    showPrincipal: true,
    principalLabel: 'Principal',
    showExamController: true,
    examControllerLabel: 'Exam Controller',
    showTeacher: true,
    teacherLabel: 'Class Teacher',
    showCandidate: false,
    candidateLabel: 'Candidate Signature',
    showParent: true,
    parentLabel: 'Parent Signature',
    stampPosition: 'RIGHT',
  },
  instructions: [
    'Grading Scale: A1 (91-100), A2 (81-90), B1 (71-80), B2 (61-70), C1 (51-60), C2 (41-50), D (33-40), E (<33 - Needs Improvement).',
    'Pass Criteria: Minimum 33% marks required in aggregate and individual subjects.',
  ],
  blocks: DEFAULT_REPORT_CARD_BLOCKS,
  displayOptions: {
    showStudentPhoto: true,
    showQR: true,
    showVerificationId: true,
    showAttendance: true,
    showRank: false,
    showGradeLegend: true,
    showCoScholastic: true,
  },
}

export function getDefaultPresetConfig(
  documentType: DocumentType,
  preset: TemplatePreset = 'CBSE'
): DocumentTemplateConfig {
  if (documentType === 'ADMIT_CARD') {
    return {
      ...DEFAULT_CBSE_ADMIT_CARD_PRESET,
      preset,
    }
  }

  // Default Report Card & generic fallback
  return {
    ...DEFAULT_CBSE_REPORT_CARD_PRESET,
    preset,
  }
}
