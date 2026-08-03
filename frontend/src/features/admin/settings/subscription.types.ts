export interface FeatureMeta {
  key: string
  name: string
  description: string
  category: 'CORE' | 'PREMIUM'
  isPlaceholder?: boolean
}

export interface PlanCatalogItem {
  code: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  annualSavings: number
  features: FeatureMeta[]
}

export interface SubscriptionInfo {
  id: string
  schoolId: string
  currentPlan: string
  monthlyPrice: number
  yearlyPrice: number
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  startDate: string
  endDate?: string | null
}

export interface ResolvedFeatures {
  schoolId: string
  currentPlan: string
  planName: string
  features: Record<string, boolean>
  activeFeatureKeys: string[]
}

export interface PendingUpgradeRequest {
  id: string
  requestedPlan: string
  status: 'PENDING' | 'CONTACTED' | 'COMPLETED' | 'REJECTED'
  createdAt: string
}

export interface SubscriptionPayload {
  subscription: SubscriptionInfo
  catalog: Record<string, PlanCatalogItem>
  resolvedFeatures: ResolvedFeatures
  hasPendingUpgradeRequest: boolean
  pendingUpgradeRequest: PendingUpgradeRequest | null
}
