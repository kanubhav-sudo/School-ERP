/**
 * Tenant Context & Provider
 *
 * Resolves the current school (tenant) from:
 * 1. The subdomain of the current hostname (e.g. myschool.cloudems.com → "myschool")
 * 2. VITE_DEFAULT_SCHOOL_SLUG env variable (used on localhost / bare domain)
 *
 * Provides the resolved slug to all downstream components and to the axios
 * interceptor so every request carries the correct X-School-Slug header.
 *
 * @module context/TenantContext
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TenantContextValue {
  /** School slug derived from subdomain or env variable. */
  schoolSlug: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveSchoolSlug(): string {
  const hostname = window.location.hostname

  // Detect subdomain (e.g. "myschool" from "myschool.cloudems.com" or "myschool.localhost")
  const parts = hostname.split('.')
  const isSubdomain =
    parts.length >= 3 ||
    (parts.length === 2 && parts[1].startsWith('localhost'))

  if (isSubdomain) {
    const subdomain = parts[0]
    // Ignore generic subdomains that are not tenant slugs
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain
    }
  }

  // Fallback to environment variable (for local dev or bare domain deployments)
  const envSlug = import.meta.env.VITE_DEFAULT_SCHOOL_SLUG as string | undefined
  if (envSlug) return envSlug

  // Last-resort default — should always be overridden in .env.local
  return 'default'
}

// ─── Context ─────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const schoolSlug = useMemo(() => resolveSchoolSlug(), [])

  return (
    <TenantContext.Provider value={{ schoolSlug }}>
      {children}
    </TenantContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
