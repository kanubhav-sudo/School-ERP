/**
 * Auth Context & Provider
 *
 * Manages the global authentication state.
 * - Calls /auth/refresh on app load to restore session
 * - Exposes login(), logout(), and the current user
 * - Access token lives in-memory (via axios.ts)
 *
 * @module context/AuthContext
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import axios from 'axios'
import { apiClient, setAccessToken } from '../lib/axios'
import type { AuthUser, LoginPayload } from '../types/auth.types'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: attempt to restore session via refresh token cookie
  useEffect(() => {
    const restore = async () => {
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        setAccessToken(data.data.accessToken)
        setUser(data.data.user)
      } catch {
        // No valid session — user needs to log in
        setUser(null)
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await apiClient.post('/auth/login', payload)
    setAccessToken(data.data.accessToken)
    setUser(data.data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
