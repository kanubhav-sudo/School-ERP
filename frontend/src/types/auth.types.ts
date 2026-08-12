/**
 * Auth Types
 *
 * Shared TypeScript types for authentication state.
 *
 * @module types/auth
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
  schoolId: string | null
  mustChangePassword: boolean
  lastLoginAt?: string | null
  /** Populated for TEACHER and STUDENT roles from their linked profile */
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  /** Display name: full name for teacher/student, principalName or username for admin */
  profileName?: string | null
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginPayload {
  loginId: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}
