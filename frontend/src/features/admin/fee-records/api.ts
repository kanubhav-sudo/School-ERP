import { apiClient } from '@/lib/axios'

export interface FeeRecord {
  id: string
  studentId: string
  feePlanId?: string
  sessionId: string
  classId: string
  month: number
  year: number
  monthlyAmount: number
  lateFine: number
  netAmount: number
  paidAmount: number
  balanceAmount: number
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'WAIVED' | 'OVERDUE'
  dueDate?: string
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
  }
  session: { id: string; name: string }
  class: { id: string; name: string }
  feePlan?: { id: string; name: string }
}

export interface FetchFeeRecordsParams {
  page?: number
  limit?: number
  sessionId?: string
  classId?: string
  month?: number
  status?: string
  studentId?: string
  search?: string
  sortBy?: string
}

export async function fetchFeeRecords(params: FetchFeeRecordsParams) {
  const { data } = await apiClient.get('/fee-records', { params })
  return data.data
}

export interface StudentFeeRow {
  studentId: string
  studentName: string
  admissionNumber: string
  className: string
  sectionName: string
  feeCategory: string
  monthlyFee: number
  currentTotalFee: number
  paidAmount: number
  pendingAmount: number
  advanceBalance: number
  pendingFrom: string
  timeline: Array<{
    month: number
    label: string
    status: string
    displayText: string
  }>
}

export interface StudentFeeListResponse {
  students: StudentFeeRow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function fetchStudentFeeList(params: {
  sessionId?: string
  classId?: string
  search?: string
  page?: number
  limit?: number
}): Promise<StudentFeeListResponse> {
  const { data } = await apiClient.get('/fee-records/students', { params })
  return data.data
}

export interface FeeSummary {
  totalPending: number
  totalPaid: number
}

export async function fetchFeeSummary(sessionId: string, month: number) {
  const { data } = await apiClient.get('/fee-records/summary', { params: { sessionId, month } })
  return data.data
}

export interface AddFeePaymentParams {
  studentId: string
  amount: number
  receiptNumber: string
  paymentDate?: string
  paymentMode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'ONLINE' | 'UPI' | 'CARD'
  transactionId?: string
  remarks?: string
}

export async function addFeePayment(params: AddFeePaymentParams) {
  const { studentId, ...payload } = params
  const { data } = await apiClient.post(`/fee-records/student/${studentId}/pay`, payload)
  return data.data
}

export async function fetchStudentFeeProfile(studentId: string, sessionId?: string) {
  const { data } = await apiClient.get(`/fee-records/student/${studentId}`, {
    params: sessionId ? { sessionId } : undefined,
  })
  return data.data
}
