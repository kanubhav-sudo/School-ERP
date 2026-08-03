/**
 * Document Generation Engine Types — Frontend
 *
 * @module features/document-engine/types
 */

export type DocumentType =
  | 'ADMIT_CARD'
  | 'REPORT_CARD'
  | 'FEE_RECEIPT'
  | 'TRANSFER_CERTIFICATE'
  | 'BONAFIDE_CERTIFICATE'
  | 'CHARACTER_CERTIFICATE'
  | 'STUDENT_ID_CARD'
  | 'TEACHER_ID_CARD'
  | 'SALARY_SLIP'
  | 'EXPERIENCE_CERTIFICATE'
  | 'LEAVING_CERTIFICATE'
  | 'MIGRATION_CERTIFICATE'

export type TemplatePreset = 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'CUSTOM'

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

export interface AcademicDocumentTemplateRecord {
  id: string
  schoolId: string
  documentType: DocumentType
  preset: TemplatePreset
  version: number
  isActive: boolean
  title: string
  description?: string | null
  configuration: DocumentTemplateConfig
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface SubjectCalculation {
  subjectId: string
  subjectName: string
  subjectCode: string
  maxMarks: number
  obtainedMarks: number
  percentage: number
  grade: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'E'
  status: 'PASS' | 'FAIL'
  remarks?: string | null
}

export interface MarksSummaryCalculation {
  subjects: SubjectCalculation[]
  totalMaxMarks: number
  totalObtainedMarks: number
  overallPercentage: number
  overallGrade: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'E'
  resultStatus: 'PASS' | 'COMPARTMENT' | 'FAIL'
  failedSubjectsCount: number
}

export interface AttendanceCalculation {
  totalDays: number
  presentDays: number
  percentage: number
}

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
    dateOfBirth?: string | null
    gender?: string | null
    photoUrl?: string | null
    className: string
    sectionName: string
    sessionName: string
  }
  exam?: {
    id: string
    name: string
    startDate?: string | null
    endDate?: string | null
    schedules: Array<{
      subjectId: string
      subjectName: string
      subjectCode: string
      examDate: string
      startTime: string
      endTime: string
      room?: string | null
    }>
  }
  marksSummary?: MarksSummaryCalculation
  attendance?: AttendanceCalculation
  issuedAt: string
  verificationUrl: string
}

export interface VerificationResultData {
  verificationId: string
  status: 'VALID' | 'REVOKED'
  documentType: DocumentType
  schoolName: string
  schoolLogo?: string | null
  schoolLocation?: string
  studentName: string
  admissionNumber?: string
  className?: string
  sessionName?: string
  examName?: string
  resultStatus?: 'PASS' | 'COMPARTMENT' | 'FAIL'
  overallPercentage?: number
  issuedAt: string
  checksum: string
}
