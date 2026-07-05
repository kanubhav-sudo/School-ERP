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
  temporaryPassword?: string
}

export const accountApi = {
  getDetails: (id: string) => api.get<AccountDetails>(`/accounts/${id}`),

  resetPassword: (id: string, remarks?: string) =>
    api.post<CredentialsResponse>(`/accounts/${id}/reset-password`, { remarks }),

  reissueCredentials: (id: string, remarks?: string) =>
    api.post<CredentialsResponse>(`/accounts/${id}/reissue-credentials`, { remarks }),

  activateAccount: (id: string, remarks?: string) =>
    api.post<void>(`/accounts/${id}/activate`, { remarks }),

  suspendAccount: (id: string, remarks?: string) =>
    api.post<void>(`/accounts/${id}/suspend`, { remarks }),

  disableAccount: (id: string, remarks?: string) =>
    api.post<void>(`/accounts/${id}/disable`, { remarks }),

  unlockAccount: (id: string, remarks?: string) =>
    api.post<void>(`/accounts/${id}/unlock`, { remarks }),

  forcePasswordChange: (id: string, remarks?: string) =>
    api.post<void>(`/accounts/${id}/force-password-change`, { remarks }),
}
