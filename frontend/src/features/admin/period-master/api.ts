import { apiClient as api } from '@/lib/axios'

export interface PeriodMasterEntry {
  id: string
  sessionId: string
  periodNumber: number
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

export interface SetPeriodMasterPayload {
  sessionId: string
  periods: Array<{
    periodNumber: number
    startTime: string
    endTime: string
  }>
}

export async function fetchPeriodMasters(sessionId: string): Promise<PeriodMasterEntry[]> {
  const { data } = await api.get(`/period-master/${sessionId}`)
  return data.data
}

export async function setPeriodMasters(payload: SetPeriodMasterPayload): Promise<PeriodMasterEntry[]> {
  const { data } = await api.post('/period-master', payload)
  return data.data
}
