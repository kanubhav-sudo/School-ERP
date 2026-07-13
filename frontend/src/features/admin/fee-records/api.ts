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

export interface ListFeeRecordsParams {
  page?: number
  limit?: number
  sessionId?: string
  classId?: string
  month?: number
  status?: string
  studentId?: string
}

export interface FeeRecordListResponse {
  feeRecords: FeeRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function fetchFeeRecords(
  params: ListFeeRecordsParams = {}
): Promise<FeeRecordListResponse> {
  const { data } = await apiClient.get('/fee-records', { params })
  return data.data
}

export interface FeeSummary {
  totalPending: number
  totalPaid: number
}

export async function fetchFeeSummary(sessionId: string, month: number): Promise<FeeSummary> {
  const { data } = await apiClient.get('/fee-records/summary', { params: { sessionId, month } })
  return data.data
}
