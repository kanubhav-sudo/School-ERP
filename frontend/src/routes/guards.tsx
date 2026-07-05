/**
 * Route Guards
 *
 * ProtectedRoute — requires authentication
 * GuestRoute    — accessible only when NOT authenticated (login page)
 * RoleRoute     — requires specific role(s)
 *
 * @module routes/guards
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/auth.types'

// Full-screen loader shown while session is being restored
function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Restoring session…</p>
      </div>
    </div>
  )
}

/** Blocks unauthenticated users — redirects to /login */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoader />
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" state={{ from: location }} replace />
  }

  return <>{children}</>
}

/** Blocks authenticated users from the login page — redirects to dashboard */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <AuthLoader />
  if (isAuthenticated && user) {
    const dashboardPath = getDashboardPath(user.role)
    return <Navigate to={dashboardPath} replace />
  }
  return <>{children}</>
}

/** Requires a specific role — shows /unauthorized on mismatch */
export function RoleRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoader />
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}

// eslint-disable-next-line react-refresh/only-export-components
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'TEACHER':
      return '/teacher/dashboard'
    case 'STUDENT':
      return '/student/dashboard'
  }
}
