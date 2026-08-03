# Changelog

All notable changes to the School ERP project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.5.0] — 2026-08-04 — CloudEMS Phase 4.5: Subscription Foundation & Feature Gating

### Added

#### Prisma Schema Changes
- Updated `Subscription` model: added `currentPlan` (String, default "BASE"), `monthlyPrice` (Int, default 1000), `yearlyPrice` (Int, default 10000); made `planId` optional; made `endDate` optional; changed default `status` from `TRIAL` to `ACTIVE`
- Added `UpgradeRequest` model: `schoolId`, `currentPlan`, `requestedPlan`, `status` (PENDING/CONTACTED/COMPLETED/REJECTED), `requestedBy`, `notes`, timestamps; indexed on `schoolId` and `status`
- Added `upgradeRequests UpgradeRequest[]` relation to `School` model
- Migration: `20260804010000_add_subscription_foundation`

#### Backend — Feature Gating Architecture

- **`feature-resolution.service.ts`**: Centralized feature permission system with `PLAN_FEATURE_CATALOG` constant defining `BASE` and `PREMIUM` plan feature matrices. Methods: `resolveSchoolFeatures(db, schoolId)`, `hasFeature(db, schoolId, featureKey)`, `getPlanCatalog()`. **RULE: Business logic MUST NEVER check `if (plan === "PREMIUM")` — it MUST call `hasFeature()` instead.**

- **`feature-guard.middleware.ts`**: Reusable Express middleware `requireFeature(featureKey)` — protects routes by checking resolved features. Returns `403 Forbidden` with `{ code: 'FEATURE_LOCKED', feature: featureKey }` if feature is not enabled.

- **`subscription.service.ts`**: `getSubscriptionDetails(db, schoolId)` — auto-provisions BASE subscription on first use; `updateSubscription()` — supports custom per-school pricing overrides.

- **`upgrade-request.service.ts`**: `createUpgradeRequest()` — validates no duplicate pending request; logs audit event. `listUpgradeRequests()` — lists requests with school details.

#### Backend — Subscription API (`/api/v1/subscription/*`)

- `GET  /subscription` — Subscription details, plan catalog, resolved features, and pending upgrade request state
- `GET  /subscription/features` — Resolved feature permission map for current tenant
- `POST /subscription/upgrade-request` — Submit upgrade request for callback (no payment processing)
- `PUT  /subscription` — (SUPER_ADMIN) Update per-school custom pricing/plan

#### Plan Catalog (Backend-Configured)

- **BASE Plan**: Attendance, Fees & Finance, Homework, Exams & Marks, Results & Report Cards, Timetable, Noticeboard — ₹1,000/month | ₹10,000/year (save ₹2,000)
- **PREMIUM Plan**: Base features + Transport Module, AI Remarks, AI Homework Assistant, AI Analytics (all placeholder — modules not built) — ₹2,500/month | ₹25,000/year (save ₹5,000)

#### Frontend — Settings Page (`/admin/settings`)

- **`SettingsPage.tsx`**: Tabbed settings hub with 6 tabs: General, School Profile, Branding, Academic Settings, Subscription, Security. URL-param driven tab state (`?tab=subscription`). Subscription tab shows a live pulsing indicator.

- **`SubscriptionTab.tsx`**: Commercial subscription page:
  - Active subscription banner (current plan, status badge, school-specific price)
  - BASE PLAN card: feature list from backend catalog, pricing with annual discount
  - PREMIUM PLAN card: dynamically rendered premium feature list from backend catalog; placeholder badges for upcoming modules; "More Premium Features Coming Soon"
  - Upgrade Request Modal: "Upgrade to Premium?" dialog → `POST /subscription/upgrade-request` → success message → button changes to "Upgrade Request Pending"

- Sidebar: Added "⚙️ Settings & Subscription" under System section in AdminLayout
- Route: `/admin/settings` registered in App.tsx

#### Frontend — Bug Fix

- Fixed `document-engine.api.ts`: corrected import from `api` → `apiClient` from `../../lib/axios`

### Architecture Notes

- Feature gating is future-proof: adding any new premium module just requires adding a feature key to `PLAN_FEATURE_CATALOG.PREMIUM.features` and wrapping the route with `requireFeature('feature_key')`
- Pricing is per-school, not global: each `Subscription` record stores its own `monthlyPrice` and `yearlyPrice` overridden during provisioning or platform update

---

## [5.0.0] — 2026-08-04 — CloudEMS Phase 5: Academic Document Engine

### Added

#### Document Generation Engine (Backend)

- **4-Layer Architecture**: Data Provider → Calculation Engine → Template Manager → Verification
  - `data-provider.service.ts`: Collects all raw context (student, school, exam, marks, attendance) from DB
  - `calculation-engine.service.ts`: Computes grades (A1–E), subject totals, percentage, result status (PASS/COMPARTMENT/FAIL), attendance percentage
  - `document-engine.service.ts`: Orchestrates the full pipeline — template resolution, payload compilation, checksum generation, QR URL construction, document persistence
  - `presets.ts`: CBSE, ICSE, STATE_BOARD, CUSTOM default template configurations

- **Versioned Template System**: Every template edit creates version n+1 without overwriting historical versions. Ensures old documents always render against the template version they were generated with.

- **SHA-256 Integrity**: Each document gets a cryptographic `checksum` field locking student ID, school ID, document type, issue date, and marks summary. Tampering detected instantly on public verification.

- **QR Verification ID**: Format `DOC-YYYY-TYP-XXXXXXXX` — scannable, globally unique, publicly verifiable without any authentication.

#### Prisma Schema

- `DocumentType` enum: ADMIT_CARD, REPORT_CARD, FEE_RECEIPT, TRANSFER_CERTIFICATE, BONAFIDE_CERTIFICATE, CHARACTER_CERTIFICATE, STUDENT_ID_CARD, TEACHER_ID_CARD, SALARY_SLIP, EXPERIENCE_CERTIFICATE, LEAVING_CERTIFICATE, MIGRATION_CERTIFICATE
- `TemplatePreset` enum: CBSE, ICSE, STATE_BOARD, CUSTOM
- `GeneratedDocumentStatus` enum: GENERATED, PRINTED, REVOKED
- `AcademicDocumentTemplate` model: versioned, per-document-type JSON configuration store with `isActive` flag
- `GeneratedDocument` model: official document record with verificationId, checksum, templateId, templateVersion, metadata (frozen payload snapshot), status

#### API Routes (`/api/v1/documents/*`)

- `GET  /documents/templates/:documentType` — Fetch active template config
- `POST /documents/templates/:documentType` — Save new template version (v+1)
- `POST /documents/templates/:documentType/reset` — Reset to preset defaults (new version)
- `GET  /documents/preview/:documentType` — Compile live document preview payload
- `POST /documents/generate` — Generate official document with verificationId + checksum
- `GET  /documents/public/verify/:verificationId` — Public QR verification (no auth, privacy-preserved)
- `POST /documents/bulk-generate/init` — Bulk generation architecture stub (Phase 6 queue)

#### Frontend — Document Engine Components

- `document-engine.types.ts`: Full frontend type definitions matching backend payload shapes
- `document-engine.api.ts`: Axios API client for all document engine endpoints
- `DocumentEngine.tsx`: Universal A4 paper container with watermark overlay, QR footer, print media CSS, `@page` size directive
- `AdmitCardRenderer.tsx`: CBSE-style high-fidelity admit card with exam schedule table, student info grid, signature blocks, configurable colors/fonts
- `ReportCardRenderer.tsx`: Academic report card with subject-wise marks table, grade legend, co-scholastic section, attendance summary, overall result badge, signature blocks
- `BlockBasedTemplateEditor.tsx`: Full visual template editor (6 tabs: Presets, Branding, Blocks, Watermark, Signatures, Instructions) with real-time live preview pane

#### Frontend — Pages & Routes

- `DocumentEnginePage.tsx` (`/admin/documents`): Admin hub for template management — lists document types, launches editor, triggers live preview
- `PublicVerifyPage.tsx` (`/verify/:verificationId`): Public QR landing page — no authentication required, privacy-preserved, shows school name, student name (no contact details), result status, SHA-256 checksum

#### Exam Module Redesign

- `ExamsPage.tsx`: Replaced hardcoded `AdmitCardModal` and `ResultCardModal` with Document Engine renderers
  - `handleViewAdmitCard()`: Now calls `/documents/preview/ADMIT_CARD` per student + exam, renders `AdmitCardRenderer`
  - `handleViewResult()`: Now calls `/documents/preview/REPORT_CARD` per student + exam, renders `ReportCardRenderer`
  - Graceful fallback to legacy modals if engine returns error
  - "Document Engine Settings" link replaces old template settings button
- Legacy `AdmitCardModal` and `ResultCardModal` kept as fallback (not removed)

#### Admin Sidebar

- "📄 Document Engine" nav link added under Operations → Exams & Results

### Architecture Notes

- **Bulk Generation**: API, data models, status flow, and interfaces are defined. Full async queue processing (worker-based class-level batch) deferred to Phase 6.
- **Template Versioning**: Historical documents always render against the template version they were issued with, ensuring legal reproducibility.
- **Public Verification Privacy**: The public verify endpoint exposes only: school name/logo, student name, admission number, class, session, document type, result status (no marks breakdown), issue date, checksum. Phone numbers, detailed grades, and personal data are never exposed publicly.

---

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
