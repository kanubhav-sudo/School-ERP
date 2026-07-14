import { apiClient as api } from '@/lib/axios'
import type { UserRole } from '@/types/auth.types'

export interface AccountAuditLog {
  id: string
  action: string
  remarks?: string
  createdAt: string
  actor?: {
    username: string
    role: UserRole
  }
}

export interface AccountDetails {
  id: string
  username: string
  email: string
  role: UserRole
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED'
  mustChangePassword: boolean
  failedLoginAttempts: number
  lastFailedLoginAt: string | null
  lockedUntil: string | null
  lastLoginAt: string | null
  passwordChangedAt: string | null
  createdAt: string
  updatedAt: string
  accountAuditLogs: AccountAuditLog[]
}

export interface CredentialsResponse {
  temporaryPassword: string
}

// All backend responses are wrapped in { success, data, message }.
// These helpers unwrap res.data.data so callers get the inner payload directly.

export const accountApi = {
  getDetails: (id: string): Promise<AccountDetails> =>
    api.get(`/accounts/${id}`).then((res) => res.data.data),

  resetPassword: (id: string, remarks?: string): Promise<CredentialsResponse> =>
    api.post(`/accounts/${id}/reset-password`, { remarks }).then((res) => res.data.data),

  reissueCredentials: (id: string, remarks?: string): Promise<CredentialsResponse> =>
    api.post(`/accounts/${id}/reissue-credentials`, { remarks }).then((res) => res.data.data),

  activateAccount: (id: string, remarks?: string): Promise<void> =>
    api.post(`/accounts/${id}/activate`, { remarks }).then(() => undefined),

  suspendAccount: (id: string, remarks?: string): Promise<void> =>
    api.post(`/accounts/${id}/suspend`, { remarks }).then(() => undefined),

  disableAccount: (id: string, remarks?: string): Promise<void> =>
    api.post(`/accounts/${id}/disable`, { remarks }).then(() => undefined),

  unlockAccount: (id: string, remarks?: string): Promise<void> =>
    api.post(`/accounts/${id}/unlock`, { remarks }).then(() => undefined),

  forcePasswordChange: (id: string, remarks?: string): Promise<void> =>
    api.post(`/accounts/${id}/force-password-change`, { remarks }).then(() => undefined),
}
