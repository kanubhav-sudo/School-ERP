# School ERP System — Milestones Tracking

This document tracks all system milestones, progress, completed tasks, and dependencies.

## Milestone 1: Project Initialization & Foundation
- **Objective**: Establish the foundation of the codebase. Scaffold React frontend and Express backend, setup standard styling and linting, and integrate a containerized PostgreSQL database via Docker.
- **Status**: Completed
- **Progress**: 100%
- **Completed Work**:
  - Scaffolded frontend with React 19, Vite, TypeScript, Tailwind CSS v4, and shadcn/ui.
  - Scaffolded backend with Node.js, Express, TypeScript, and Prisma ORM.
  - Linked database service inside a root-level `docker-compose.yml` file.
  - Configured project-wide Flat ESLint configurations, Prettier styling, and compiler path aliases.
  - Outlined initial API documentation, roads, database schemas, and architectural logs inside `docs/`.
- **Remaining Work**: None.
- **Dependencies**: None.
- **Estimated Next Milestone**: Milestone 1.5.

## Milestone 1.5: Engineering Foundation Hardening
- **Objective**: Establish production-ready scaffolding for the core API server, database singleton instance, custom error wrapper hierarchy, request logger, smart limits, and git commit gates.
- **Status**: Completed
- **Progress**: 100%
- **Completed Work**:
  - Constructed Zod validated configuration loader verifying environment variables at boot time.
  - Implemented singleton Prisma connection client under `@prisma/adapter-pg` avoiding connection pool growth.
  - Scaffolded Pino logger generating JSON logs containing custom Request-ID tracing.
  - Designed `AppError` base class wrapping HTTP statuses, alongside standard `ApiResponse` envelope helper utils.
  - Programmed rate limiting middleware, global Express error catches, and security configurations.
  - Set up Git pre-commit verification gates (Husky & lint-staged) enforcing strict typing and format rules on code staging.
- **Remaining Work**: None.
- **Dependencies**: Completed Milestone 1.
- **Estimated Next Milestone**: Milestone 2.

## Milestone 2: Core Authentication & RBAC
- **Objective**: Implement secure role-based session login (ADMIN, TEACHER, STUDENT) restricting API endpoints and routing panels. Support refresh token rotation via HttpOnly SameSite cookies.
- **Status**: Completed
- **Progress**: 100%
- **Completed Work**:
  - Programmed DB schema User table, migrations, and a seed script adding default admin credentials.
  - Built token verification (access / refresh JWTs) in a service layer, and mounted controllers to handle `/login`, `/refresh`, and `/logout`.
  - Configured authorization and authentication middlewares on backend router.
  - Integrated global React `AuthContext` managing authentication tokens, session persistence, and Axios request/response interceptors to automatically retry/refresh on 401s.
  - Constructed login view using React Hook Form and route authentication guards (`ProtectedRoute`, `GuestRoute`, `RoleRoute`).
- **Remaining Work**: None.
- **Dependencies**: Completed Milestone 1.5.
- **Estimated Next Milestone**: Milestone 3.

## Milestone 3.1: Academic Structure
- **Objective**: Setup foundational structures for academic sessions (years, terms), Classes, Sections, and Subjects.
- **Status**: Completed
- **Progress**: 100%
- **Completed Work**:
  - Defined schema mappings for Sessions, Classes, Sections, and Subjects.
  - Programmed CRUD controllers & validation endpoints for academic parameters.
  - Implemented data management tables and forms on the React Admin dashboard.
- **Remaining Work**: None.
- **Dependencies**: Completed Milestone 2.
- **Estimated Next Milestone**: Milestone 3.2.

## Milestone 3.2: User Management & Profiles
- **Objective**: Administrator-facing screens to register student & teacher profiles, map them to classes/sections, and assign subjects.
- **Status**: Completed
- **Progress**: 100%
- **Completed Work**:
  - Defined schema mappings for User Profiles (Students, Teachers, Admins).
  - Programmed CRUD controllers & services for user profiles.
  - Implemented profiles management interface on frontend (TeachersPage, StudentsPage).
- **Remaining Work**: None.
- **Dependencies**: Completed Milestone 3.1.
- **Estimated Next Milestone**: Milestone 4.

## Milestone 4: Operations & Portals
- **Objective**: Integrate noticeboards, announcement systems, homework publication dashboards, and daily attendance register files for teachers.
- **Status**: In Progress
- **Progress**: 40%
- **Completed Work**:
  - Checkpoint 4.1: Timetable Management (Schema, CRUD APIs, UI Grid, Validation).
  - Checkpoint 4.2: Attendance Management (Schema, Upsert APIs, UI Grid).
- **Remaining Work**:
  - Implement notices board CRUD and announcement banners.
  - Scaffold homework file upload endpoints and task submissions logs.
- **Dependencies**: Completed Milestone 3.
- **Estimated Next Milestone**: Milestone 5.

## Milestone 5: Fees & Results
- **Objective**: Manage fee structures, invoice records, transactional receipts, grading configurations, admit card printouts, and audit trails.
- **Status**: Pending
- **Progress**: 0%
- **Completed Work**: None.
- **Remaining Work**:
  - Code billing models and Stripe or manual cash receipt printing interfaces.
  - Program grades entry boards, marksheet computation, and PDF report cards.
  - Build audit log table monitoring administrative actions.
- **Dependencies**: Completed Milestone 4.
- **Estimated Next Milestone**: Production Release.

---

## CloudEMS SaaS Migration — Phase 1: SaaS Schema Foundation
- **Objective**: Introduce multi-tenant `School` model, extend `User` with `schoolId`, introduce `Tenant` hierarchy, restructure database to support multiple schools.
- **Status**: ✅ Completed — 2026-08-03
- **Progress**: 100%
- **Completed Work**:
  - Introduced `School`, `SchoolSettings`, `SchoolFeatures`, `Plan`, `Subscription`, `Parent`, `Notification`, `AuditLog` models in Prisma schema.
  - Extended `User` model with `schoolId` (nullable, for SUPER_ADMIN).
  - Created seed with Demo School (`slug: demo`), SUPER_ADMIN, and school ADMIN.
  - Resolved all frontend TypeScript errors after schema migration.
  - Restructured repo docs into `docs/` folder.

## CloudEMS SaaS Migration — Phase 2: Authentication Engine & Identity Redesign
- **Objective**: Upgrade authentication to be school-aware. Extend JWT with `schoolId`. Support login via phone or username. Implement `resolveTenantMiddleware`. Add `TenantContext` on frontend.
- **Status**: ✅ Completed — 2026-08-03
- **Progress**: 100%
- **Completed Work**:
  - `resolveTenantMiddleware`: Parses school slug from `X-School-Slug` header or subdomain. Rejects inactive/unknown schools. Attaches `req.school`.
  - JWT payload extended: `schoolId` now embedded in both access and refresh tokens.
  - `validateCredentials`: Accepts phone or username as `loginId`. Enforces `schoolId` scoping for all non-SUPER_ADMIN roles.
  - `authenticate.middleware.ts`: Cross-tenant JWT validation — `JWT.schoolId` must match `req.school.id`.
  - SUPER_ADMIN bypass: Platform-wide access, no `schoolId` required.
  - Frontend `TenantContext`: Resolves school slug from subdomain or `VITE_DEFAULT_SCHOOL_SLUG`.
  - Axios interceptor: Injects `X-School-Slug` on every request automatically.
  - LoginForm: Field renamed to **Login ID** with correct placeholder.
  - All 5 roles (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) supported in `UserRole`.
- **Phase 3 Dependencies Documented**:
  - `createTenantClient` (Prisma `$extends`) — deferred to Phase 3.
  - `tenantContextMiddleware` injecting Prisma scope — deferred to Phase 3.
  - Row-Level Security migration — deferred to Phase 3.
  - All business module service/controller migrations — deferred to Phase 3.
- **Remaining Work**: None for Phase 2 scope.
- **Next Phase**: Phase 3 — Tenant Scoping & Auto-Isolated Data Access.

## CloudEMS SaaS Migration — Phase 4.5: Subscription Foundation & Feature Gating
- **Objective**: Build commercial SaaS subscription foundation with feature gating. Prepare CloudEMS for multi-plan deployment. No billing/payments.
- **Status**: ✅ Completed — 2026-08-04
- **Progress**: 100%
- **Completed Work**:
  - `Subscription` model extended: `currentPlan`, `monthlyPrice`, `yearlyPrice`, `status`. Auto-provisioned as BASE on first use.
  - `UpgradeRequest` model: full PENDING → CONTACTED → COMPLETED/REJECTED workflow with audit logging.
  - `FeatureResolutionService`: `PLAN_FEATURE_CATALOG` constant; `hasFeature(db, schoolId, key)` as the authoritative feature gate.
  - `requireFeature(featureKey)` middleware: protects any route with 403 + `FEATURE_LOCKED` code.
  - `SubscriptionService`, `UpgradeRequestService`: services with auto-provision logic.
  - Subscription API: `GET/PUT /subscription`, `GET /subscription/features`, `POST /subscription/upgrade-request`.
  - Frontend `SettingsPage.tsx`: 6-tab settings hub (General, School Profile, Branding, Academic, Subscription, Security).
  - Frontend `SubscriptionTab.tsx`: plan comparison cards, live pricing, upgrade request modal.
  - Sidebar link added under System section.
  - All `tsc` and `npm run build` checks pass.
- **Remaining Work**: None.
- **Next Phase**: Phase 5 — Academic Document Engine (Report Cards, Marksheets, Admit Cards).
