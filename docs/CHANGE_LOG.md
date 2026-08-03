# Changelog

All notable changes to the School ERP project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] — 2026-08-04 — CloudEMS Phase 4: Platform Administration Layer

### Added

#### Schema & Migration
- `SchoolStatus` enum: `ACTIVE | INACTIVE | SUSPENDED | ARCHIVED | PROVISIONING | FAILED`
- `School` model: Added `status`, `failureReason`, `provisionedAt`, `schoolType`, `contactEmail`, `contactPhone`, `website`, `address`, `city`, `state`, `country`, `pincode` fields
- `AuditLog` model: Added `module`, `result`, `device` fields for rich platform-wide audit trail
- Prisma migration `20260803213000_init_saas_platform_v2` updated with full Phase 3 + Phase 4 schema

#### Services
- `audit.service.ts`: Centralised platform audit logging with `writeAuditLog()`, `auditPlatformEvent()`, `getAuditLogs()` (paginated, filterable)
- `school-provisioning.service.ts`: Two-phase commit provisioning pipeline — creates School record immediately (status = PROVISIONING), runs all sub-steps in `$transaction`, updates to ACTIVE on success or FAILED with reason on failure. Supports `reprovisionSchool()` for retry.
- `platform-school.service.ts`: Full school lifecycle management — `listSchools()`, `getSchoolById()`, `updateSchool()`, `updateSchoolSettings()`, `updateSchoolFeatures()`, `changeSchoolStatus()` (with transition guard), `getPlatformDashboardMetrics()`
- `global-search.service.ts`: Cross-entity search across Schools, Users, Teachers, Students in parallel

#### API Routes (`/api/v1/platform/*`)
- `GET /platform/dashboard` — Aggregated platform metrics
- `GET /platform/schools` — Paginated school list with filters
- `POST /platform/schools` — Provision new school (wizard input → transactional pipeline)
- `GET /platform/schools/:schoolId` — School detail with settings, features, counts
- `PATCH /platform/schools/:schoolId` — Update school contact/location info
- `POST /platform/schools/:schoolId/reprovision` — Retry failed provisioning
- `PATCH /platform/schools/:schoolId/status` — Status transition with guard
- `PUT /platform/schools/:schoolId/settings` — Update academic/branding settings
- `PUT /platform/schools/:schoolId/features` — Toggle feature flags
- `GET /platform/audit-logs` — Paginated, multi-filter audit log retrieval
- `GET /platform/search` — Global cross-entity search

#### Security
- All platform routes protected by `authenticate` + `authorize('SUPER_ADMIN')` middleware
- `resolveTenantMiddleware` updated to bypass `/platform` routes (no school slug required for SUPER_ADMIN)
- Valid status transition matrix prevents illegal transitions (e.g. `ARCHIVED → ACTIVE`)

### Changed
- `resolveTenant.middleware.ts`: Extended bypass list to include `/platform` prefix
- `routes/index.ts`: Registered `/platform` routes
- `slugify` package added as dependency for auto-slug generation

---

## [3.0.0] — 2026-08-03 — CloudEMS Phase 3: Tenant Scoping & Auto-Isolated Data Access

### Added
- `tenant-client.ts`: Prisma `$extends` tenant client extension in `backend/src/database/tenant-client.ts` for automatic query scoping (`schoolId` injection) and soft-delete filtering (`isDeleted: false` / `deletedAt: null`).
- `tenant-context.middleware.ts`: Express middleware in `backend/src/middlewares/tenant-context.middleware.ts` that instantiates and attaches `req.db` to every request.
- `storage.service.ts`: Storage service in `backend/src/services/storage.service.ts` supporting tenant-isolated file management.
- `TENANT_ISOLATION_TEST_PLAN.md`: Comprehensive test plan in `docs/testing/TENANT_ISOLATION_TEST_PLAN.md`.
- `MIGRATION_SAFETY_PLAN.md`: Migration safety framework in `docs/architecture/MIGRATION_SAFETY_PLAN.md`.
- `PHASE_3_ENGINEERING_REPORT.md`: Comprehensive Phase 3 engineering report in `docs/architecture/PHASE_3_ENGINEERING_REPORT.md`.

### Changed
- `prisma/schema.prisma`: Added `schoolId` and relations to all 21 tenant-scoped models (`Student`, `Teacher`, `AcademicSession`, `Class`, `Section`, `Subject`, `Attendance`, `Timetable`, `PeriodMaster`, `Homework`, `Notice`, `FeePlan`, `FeeRecord`, `Exam`, `Account`, etc.).
- Refactored all 19 business services in `backend/src/services/` to accept `req.db` as their DB context and removed all direct imports/calls to raw `prisma` client.
- Refactored all 19 Express controllers in `backend/src/controllers/` to pass `req.db` into service method calls.

### Architectural Guarantees
- Zero-oversight tenant isolation: DB queries automatically scoped to `schoolId` via Prisma client extension (`req.db`).
- Protection against cross-tenant data leaks: Developers cannot accidentally query across tenants when using `req.db`.

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
