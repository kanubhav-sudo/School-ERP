import { apiClient } from '@/lib/axios'
import type { SubscriptionPayload, ResolvedFeatures, PendingUpgradeRequest } from './subscription.types'

export async function fetchSubscription(): Promise<SubscriptionPayload> {
  const res = await apiClient.get('/subscription')
  return res.data.data
}

export async function fetchSchoolFeatures(): Promise<ResolvedFeatures> {
  const res = await apiClient.get('/subscription/features')
  return res.data.data
}

export async function submitUpgradeRequest(
  requestedPlan: string = 'PREMIUM',
  notes?: string
): Promise<PendingUpgradeRequest> {
  const res = await apiClient.post('/subscription/upgrade-request', {
    requestedPlan,
    notes,
  })
  return res.data.data
}
