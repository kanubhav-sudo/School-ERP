# Changelog

All notable changes to the School ERP project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-08-03 — CloudEMS Phase 2: Authentication Engine & Identity Redesign

### Added
- `resolveTenant.middleware.ts`: Resolves school tenant from `X-School-Slug` header (dev) or HTTP subdomain. Attaches `req.school` to every request. Rejects unknown or inactive schools.
- `TenantContext.tsx`: Frontend React context that parses the current hostname subdomain or falls back to `VITE_DEFAULT_SCHOOL_SLUG` env variable. Exposes `schoolSlug` globally.
- `TenantSlugSyncer` component in `App.tsx` that pushes the resolved slug into the axios module on mount.
- `setSchoolSlug` / `getSchoolSlug` in `axios.ts`: In-memory school slug storage injected as `X-School-Slug` header on every API request.
- `VITE_DEFAULT_SCHOOL_SLUG=demo` in `frontend/.env` — no hardcoded slugs in source code.
- `SUPER_ADMIN` and `PARENT` roles added to `UserRole` enum in `auth.types.ts`.
- `getDashboardPath` in `guards.tsx` now handles all 5 roles.

### Changed
- `auth.validator.ts`: Login field renamed from `username` to `loginId`. Accepts phone number OR username. Student ID/admission number explicitly excluded.
- `auth.service.ts` — `validateCredentials` now accepts `(loginId, password, schoolId?)`. Queries by `username OR phone`. Enforces `schoolId` match for all non-SUPER_ADMIN users.
- `auth.service.ts` — `AccessTokenPayload` and `RefreshTokenPayload` extended with optional `schoolId`.
- `signAccessToken` and `signRefreshToken` now inject `schoolId` into JWT when present.
- `authenticate.middleware.ts`: Verifies `JWT.schoolId === req.school.id` for all non-SUPER_ADMIN users. Blocks cross-tenant access at the token validation layer.
- `auth.controller.ts`: Passes `req.school?.id` into `validateCredentials`. Returns `schoolId` in login, refresh, and `/me` responses.
- `AuthContext.tsx`: Updated to use renamed `LoginPayload` (field `loginId`).
- `LoginForm.tsx`: Input label changed to **Login ID**, placeholder to **"Enter phone number or username"**.
- `index.ts`: `resolveTenantMiddleware` registered globally before route mounting.

### Architectural Decisions
- **SUPER_ADMIN bypass**: `SUPER_ADMIN` users are not tied to a school. The `authenticate` middleware skips `schoolId` validation for this role. The `resolveTenantMiddleware` allows requests to proceed without a `req.school` if no slug is provided.
- **Phone is nullable**: Existing users without phone numbers continue to log in via username. No migration required.
- **loginId field**: Named `loginId` on frontend/backend to eliminate ambiguity. Explicitly prevents email or student ID login.
- **Env-based slug**: `VITE_DEFAULT_SCHOOL_SLUG` prevents hardcoding — school can be switched by changing the env file.

---

## [0.2.0] — 2026-07-04
### Added
- Completed **Milestone 2 (Core Authentication & RBAC)**.
- User database schema with `Role` enum (`ADMIN`, `TEACHER`, `STUDENT`).
- Backend routes under `/api/v1/auth/` for `/login`, `/refresh`, `/logout`.
- Access and Refresh token pairs using JWT, stored via secure HttpOnly cookie rotation.
- Roles authorization middlewares (`authenticate`, `authorize`).
- React global context `AuthContext` to manage frontend session state.
- Axios silent refresh interceptors dynamically renewing expired access tokens.
- Frontend UI LoginForm with robust client-side Zod validation schemas.
- Route navigation guards (`ProtectedRoute`, `GuestRoute`, `RoleRoute`).

### Fixed
- Configured `@prisma/adapter-pg` driver adapter ensuring Prisma 7 compatibility in local environments.
- Handled Express 5 wildcard parameters (`path-to-regexp` v8) compatibility crash.
- Mapped Vite development server proxy target port to backend port `8000`.
- Resolved all remaining ESLint flat configurations warning flags.

---

## [0.1.0] — 2026-06-30
### Added
- Root setup (`.gitignore`, `.editorconfig`, Docker PostgreSQL Compose).
- Scaffolded Vite React TS frontend and Node Express TS backend.
- Tailwind CSS v4 and shadcn/ui framework configurations.
- Integrated flat ESLint configs and Prettier guidelines.
- Created documentation suite inside `/docs/` and project memory inside `/.project/`.
