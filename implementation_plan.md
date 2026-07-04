# Implementation Plan — Milestone 1.5: Engineering Foundation Hardening

This plan details the technical steps to harden the School ERP engineering foundation before feature development. No business logic or database models will be implemented.

## Proposed Changes

### 1. Environment & Central Configuration

#### [NEW] [env.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/config/env.ts)
- Validate environment variables using Zod.
- Validate:
  - `DATABASE_URL` (String, required)
  - `JWT_SECRET` (String, required, min 32 chars)
  - `PORT` (Number, default 3000)
  - `NODE_ENV` (Enum: `development`, `production`, `test`, default `development`)
  - `CORS_ORIGIN` (String, default `http://localhost:5173`)
- Refuse startup with clear, readable console warnings if validation fails.

#### [NEW] [index.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/config/index.ts)
- Consolidate all configuration imports. Export validated environment config.
- Centralize app version and details.

#### [NEW] [features.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/config/features.ts)
- Feature flag architecture mapping boolean flags:
  - `library`
  - `transport`
  - `hostel`
  - `onlineClasses`
  - `parentPortal`

---

### 2. Logging & Request ID Middleware

#### [NEW] [logger.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/utils/logger.ts)
- Install and configure `pino` and `pino-pretty` (in dev).
- Implement levels: `info`, `warn`, `error`, `debug`.
- Integrate request-bound metadata logging.

#### [NEW] [requestId.middleware.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/middlewares/requestId.middleware.ts)
- Generate a unique ID (using `crypto.randomUUID()`) for each request.
- Attach it to `res.setHeader('X-Request-ID', ...)` and pass it down via an Express request context utility (e.g., using `cls-rtracer` or an AsyncLocalStorage wrapper, or simply attaching it directly to the custom Express request interface `req.id`).
- For simplicity and standard Express pattern, we will attach it to `req.id` and pass it to logger calls.

---

### 3. Custom Error System & Global Error Handler

#### [NEW] [errors.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/utils/errors.ts)
- Create `AppError` base class extending `Error`.
- Define subclasses:
  - `ValidationError` (400)
  - `UnauthorizedError` (401)
  - `ForbiddenError` (403)
  - `NotFoundError` (404)
  - `ConflictError` (409)

#### [MODIFY] [error.middleware.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/middlewares/error.middleware.ts)
- Update global error handling middleware to catch standard `AppError` subclasses.
- Standardize the error response envelope:
  ```json
  {
    "success": false,
    "error": "Error message",
    "details": [] // for ValidationErrors
  }
  ```

---

### 4. API Response Envelope Helpers

#### [NEW] [response.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/utils/response.ts)
- Create a utility module with functional wrapper helpers:
  - `success(res, data, message)` (200)
  - `created(res, data, message)` (201)
  - `badRequest(res, message, details)` (400)
  - `unauthorized(res, message)` (401)
  - `forbidden(res, message)` (403)
  - `notFound(res, message)` (404)
  - `serverError(res, message, error)` (500)

---

### 5. Centralized Shared Constants

#### [NEW] [constants.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/utils/constants.ts)
- Centralized read-only maps for business domains:
  - **Roles**: `ADMIN`, `TEACHER`, `STUDENT`
  - **Attendance Status**: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `MEDICAL_LEAVE`, `APPROVED_LEAVE`
  - **Fee Status**: `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`
  - **Result Status**: `DRAFT`, `PUBLISHED`
  - **Account Status**: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`

#### [NEW] [constants.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/frontend/src/types/constants.ts)
- Replicate matching constants on the frontend for local state comparison and layouts.

---

### 6. API Versioning & Routing

#### [MODIFY] [index.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/index.ts)
- Mount routes under `/api/v1`.
- Clean up server configuration to import from `src/config/index.ts`.

#### [NEW] [index.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/routes/index.ts)
- Router assembly. Define a baseline router that forwards `/api/v1/*` routes to feature-specific route files.

---

### 7. UTC Time Standard Utilities

#### [NEW] [time.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/utils/time.ts)
- Helper functions to guarantee timestamps are created, stored, and verified in UTC.

---

### 8. Database Seeding Placeholder

#### [NEW] [seed.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/prisma/seed.ts)
- Basic boilerplate structure for future seeds.
- Integrates with `package.json` via `prisma:seed` script.

---

### 9. Security Hardening

- Integrate missing standard security elements in [index.ts](file:///Users/anubhavsmac/Desktop/School%20ERP/backend/src/index.ts):
  - **Helmet**: Configured with secure HTTP headers.
  - **CORS**: Explicitly restricted to configured `CORS_ORIGIN`.
  - **Compression**: Add Express Gzip compression.
  - **Express Rate Limit**: Add global API request rate limiter (`express-rate-limit`).
  - **Size Limits**: Enforce payload sizing limits (e.g., `10kb` limit on JSON inputs to prevent Dos).

---

### 10. Reserved File Storage Directories

- Create the storage directory structure with `.gitkeep` placeholding under `backend/uploads/`:
  - `student-photos`
  - `teacher-photos`
  - `homework-attachments`
  - `classwork-attachments`
  - `notice-attachments`
  - `school-logo`
  - `admit-cards`
  - `report-cards`
  - `fee-receipts`

---

### 11. Health Check Endpoint Upgrade

- Upgrade `/health` to output:
  - `status` (healthy / unhealthy)
  - `database` (connected / disconnected)
  - `env` (validated / invalid)
  - `uptime` (in seconds)
  - `version` (app version)
  - `timestamp` (UTC ISO string)

---

### 12. Git Quality Gates (Husky + lint-staged)

- Setup a root-level `package.json` to handle Git quality gates:
  - Configure Husky.
  - Set up `pre-commit` hook to run `lint-staged`.
  - `lint-staged` runs Prettier, ESLint, and TypeScript checks on modified files in both `backend` and `frontend`.

---

## Verification Plan

### Automated Checks
- Validate that both frontend and backend build/start successfully.
- Run ESLint check (`npm run lint`) to verify zero errors.
- Test endpoint health response by sending a request to `GET /health` and `GET /api/v1/health`.
- Verify Git hook triggers upon a commit trial.
