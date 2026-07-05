/**
 * Auth Types
 *
 * Shared TypeScript types for authentication state.
 *
 * @module types/auth
 */

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
  mustChangePassword: boolean
  lastLoginAt?: string | null
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}
