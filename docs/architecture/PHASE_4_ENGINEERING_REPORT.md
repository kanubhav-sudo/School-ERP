# Phase 4 Engineering Report: CloudEMS Platform Administration Layer

**Date**: 2026-08-04  
**Version**: CloudEMS v4.0.0  
**Phase**: Phase 4 — Platform Administration Layer  
**Status**: COMPLETED & VERIFIED  

---

## 1. Executive Summary

Phase 4 transforms **CloudEMS** from a single-school application with tenant isolation into a **multi-tenant SaaS Platform**. It introduces a centralized **Platform Administration Layer** (`/api/v1/platform/*`) accessible exclusively to `SUPER_ADMIN` users.

This layer allows onboarding, configuring, monitoring, and managing multiple school instances across their lifecycle without compromising the strict tenant data isolation established in Phase 3.

---

## 2. Key Architectural Components

### 2.1 Transactional School Provisioning Pipeline
- **Two-Phase Commit Pattern**:
  1. **Phase 1 (Creation)**: Instantiates the `School` record immediately with `status = PROVISIONING`. This guarantees every onboarding attempt is recorded, preserving traceability even on failure.
  2. **Phase 2 (Sub-provisioning)**: Runs within a single Prisma `$transaction`:
     - Creates default/custom `SchoolSettings` (branding, locale, session configuration).
     - Initializes `SchoolFeatures` toggle states.
     - Provisions academic structure using configurable `ClassTemplate` definitions (eliminates hardcoded grades).
     - Generates the initial school `ADMIN` user account.
  3. **Phase 3 (Finalization)**:
     - On **SUCCESS**: Updates status to `ACTIVE`, sets `is_active = true`, records `provisionedAt`.
     - On **FAILURE**: Catches error, updates status to `FAILED`, stores error message in `failureReason`.
- **Re-provisioning Support**: Allows retrying failed provisioning (`POST /platform/schools/:schoolId/reprovision`) by purging partial artifacts and re-running Phase 2.

### 2.2 School Lifecycle & Status Transition Engine
Introduced `SchoolStatus` enum (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`, `PROVISIONING`, `FAILED`).
A state transition guard enforces valid lifecycle paths:
- `PROVISIONING` $\rightarrow$ `ACTIVE` | `FAILED`
- `ACTIVE` $\rightarrow$ `INACTIVE` | `SUSPENDED` | `ARCHIVED`
- `INACTIVE` $\rightarrow$ `ACTIVE` | `ARCHIVED`
- `SUSPENDED` $\rightarrow$ `ACTIVE` | `ARCHIVED`
- `FAILED` $\rightarrow$ `PROVISIONING`
- `ARCHIVED` $\rightarrow$ Terminal state (no transitions allowed)

### 2.3 Feature Flags & Modular Extensibility
The `SchoolFeatures` model controls feature availability per school (`attendanceModule`, `feesModule`, `examModule`, `homeworkModule`, `noticeModule`, `transportModule`, `libraryModule`, `hostelModule`, `inventoryModule`, `payrollModule`, `onlineExamModule`).
Enables plan-based module gating without code redeployment.

### 2.4 Centralized Audit Logging Service
`audit.service.ts` provides a structured, non-blocking platform audit trail in `audit_logs`:
- Captures `userId`, `role`, `module` (`PLATFORM`, `SCHOOL`, `AUTH`, `FEES`, etc.), `action`, `entity`, `entityId`, `result` (`SUCCESS`/`FAILURE`), `oldValue`, `newValue`, `ipAddress`, `userAgent`, `device`.
- Express helper `auditPlatformEvent()` automatically populates request metadata.
- Failures in writing audit logs are safely caught to prevent blocking primary business logic.

### 2.5 Global Cross-Entity Search
`global-search.service.ts` executes parallel query execution across `School`, `User`, `Teacher`, and `Student` entities, returning normalized, type-grouped search hits for platform search bars.

---

## 3. Security & Access Control

1. **Role Guard**: All platform endpoints are guarded by `authenticate` and `authorize('SUPER_ADMIN')`.
2. **Tenant Resolution Bypass**: `resolveTenantMiddleware` updated with `PLATFORM_PATHS = ['/super-admin', '/platform', '/auth/super-admin']` to allow `SUPER_ADMIN` users to manage platform routes without requiring a tenant header (`X-School-Slug`).

---

## 4. API Specification Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/platform/dashboard` | Aggregated platform metrics & health status |
| `GET` | `/api/v1/platform/schools` | Paginated school list with status & query filtering |
| `POST` | `/api/v1/platform/schools` | Provision new school via transactional pipeline |
| `GET` | `/api/v1/platform/schools/:id` | Detailed school inspection (info, settings, features, counts) |
| `PATCH` | `/api/v1/platform/schools/:id` | Update core school contact & domain details |
| `POST` | `/api/v1/platform/schools/:id/reprovision` | Re-trigger provisioning flow for a `FAILED` school |
| `PATCH` | `/api/v1/platform/schools/:id/status` | Execute state transition (e.g. `SUSPENDED`) |
| `PUT` | `/api/v1/platform/schools/:id/settings` | Upsert school settings & locale configuration |
| `PUT` | `/api/v1/platform/schools/:id/features` | Update feature flag toggles |
| `GET` | `/api/v1/platform/audit-logs` | Filterable, paginated platform audit trail |
| `GET` | `/api/v1/platform/search` | Cross-entity search (Schools, Users, Teachers, Students) |

---

## 5. Verification & Testing

1. **Database Migration**: `20260803213000_init_saas_platform_v2` applied cleanly via Prisma reset & deploy.
2. **TypeScript Compilation**: `npx tsc --noEmit` passed with 0 errors.
3. **Production Build**: `npm run build` executed successfully.
4. **Runtime Security Verification**: `curl` smoke test verified all `/api/v1/platform/*` endpoints correctly return `401 Unauthorized` when unauthenticated.

---

## 6. Next Steps

Phase 4 is complete. The repository is ready for Phase 5 (Billing, Subscriptions & Payment Gateways) when instructed.
