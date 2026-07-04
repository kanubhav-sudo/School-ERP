# School ERP System — Granular Checkpoints

This file documents the granular checkpoints for each milestone, allowing easy verification and rollback boundaries.

---

## Milestone 1: Project Initialization & Foundation (100% Complete)

### Checkpoint 1.1: Root Repository Layout
- **Objective**: Establish git repository configs, containerized DB configurations, and root package layout.
- **Files Involved**: `README.md`, `.gitignore`, `.editorconfig`, `docker-compose.yml`, `.env.example`, `LICENSE`.
- **Dependencies**: None.
- **Verification Requirements**: Run `docker compose config` to confirm postgres integration structure is valid.
- **Status**: Done

### Checkpoint 1.2: Frontend Scaffold
- **Objective**: Initialize React TypeScript frontend with Vite, Tailwind CSS v4, and shadcn/ui.
- **Files Involved**: `frontend/*` structure, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/eslint.config.js`.
- **Dependencies**: Checkpoint 1.1.
- **Verification Requirements**: Execute `npm run build` and `npm run dev` in `frontend/` directory. Confirm successful start.
- **Status**: Done

### Checkpoint 1.3: Backend Scaffold
- **Objective**: Setup Node.js Express TypeScript server, dependencies, path aliases, and Prisma mapping configuration.
- **Files Involved**: `backend/*` structure, `backend/package.json`, `backend/tsconfig.json`, `backend/eslint.config.mjs`, `backend/prisma/schema.prisma`.
- **Dependencies**: Checkpoint 1.1.
- **Verification Requirements**: Run `npm run build` and `npm run dev` in `backend/` directory. Confirm successful compile and start.
- **Status**: Done

### Checkpoint 1.4: Code Standards & Flat Linting Configuration
- **Objective**: Configure uniform ESLint flat configs and Prettier rules, enforcing checks on files before any build.
- **Files Involved**: `.prettierrc`, `frontend/eslint.config.js`, `backend/eslint.config.mjs`.
- **Dependencies**: Checkpoints 1.2 and 1.3.
- **Verification Requirements**: Run `npm run lint` in both frontend and backend directories. Confirmed clean output.
- **Status**: Done

---

## Milestone 1.5: Engineering Foundation Hardening (100% Complete)

### Checkpoint 1.5.1: Environment Variable Check & Zod Validation
- **Objective**: Enforce schema validations on environment parameters at backend launch.
- **Files Involved**: `backend/src/config/env.ts`, `backend/src/config/index.ts`, `.env.development`, `.env.production`, `.env.test`.
- **Dependencies**: Checkpoint 1.3.
- **Verification Requirements**: Attempt starting backend without key env variables (e.g. `DATABASE_URL`). Backend must fail immediately. Adding the variable must resolve the boot block.
- **Status**: Done

### Checkpoint 1.5.2: Singleton Database client Module
- **Objective**: Create singleton Prisma db access wrapper to prevent db client initialization leakage.
- **Files Involved**: `backend/src/database/prisma.ts`, `backend/src/database/index.ts`.
- **Dependencies**: Checkpoint 1.3.
- **Verification Requirements**: Search backend codebase to verify that `PrismaClient` is not instantiated anywhere else.
- **Status**: Done

### Checkpoint 1.5.3: Pino Structured Logger
- **Objective**: Set up structured logger printing JSON logs rather than raw console text.
- **Files Involved**: `backend/src/core/logger.ts`, `backend/src/middlewares/requestId.middleware.ts`, `backend/src/middlewares/requestLogger.middleware.ts`.
- **Dependencies**: Checkpoint 1.3.
- **Verification Requirements**: Boot server, make request to health endpoint, confirm console prints standard JSON log lines containing `reqId` tags.
- **Status**: Done

### Checkpoint 1.5.4: Custom Errors & Response Envelope Wrapper
- **Objective**: Establish clear `AppError` wrapper classes and a standardized JSON wrapper for replies.
- **Files Involved**: `backend/src/core/errors.ts`, `backend/src/core/response.ts`, `backend/src/middlewares/error.middleware.ts`.
- **Dependencies**: Checkpoint 1.3.
- **Verification Requirements**: Trigger a database error or invalid routing endpoint, verify response matches standard `{ success: false, error: ... }` envelop structure.
- **Status**: Done

### Checkpoint 1.5.5: Git pre-commit gates
- **Objective**: Integrate Husky and lint-staged to run formatting and compilation checks.
- **Files Involved**: `.husky/`, `package.json`.
- **Dependencies**: Checkpoint 1.4.
- **Verification Requirements**: Make a deliberate TypeScript typing syntax error in a file, try to execute `git commit`, confirm commit fails. Fix the error, confirm commit passes.
- **Status**: Done

---

## Milestone 2: Core Authentication & RBAC (100% Complete)

### Checkpoint 2.1: User Schema, Migration & Seeding
- **Objective**: Create Prisma model mapping for user, execute DB migrations, and create seeds.
- **Files Involved**: `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`, `backend/prisma/migrations/`.
- **Dependencies**: Checkpoint 1.5.2.
- **Verification Requirements**: Run `npm run prisma:migrate` followed by `npm run prisma:seed`. Verify admin user account is present in database tables.
- **Status**: Done

### Checkpoint 2.2: Backend Authentication Service & Token Handlers
- **Objective**: Implement bcrypt checking, JWT generation, and token rotation inside Express routers.
- **Files Involved**: `backend/src/services/auth.service.ts`, `backend/src/controllers/auth.controller.ts`, `backend/src/routes/auth.routes.ts`, `backend/src/validators/auth.validators.ts`.
- **Dependencies**: Checkpoint 2.1.
- **Verification Requirements**: Use Curl to post login credentials to `/api/v1/auth/login`. Verify backend returns status 200, an access token, and sets the refresh token cookie.
- **Status**: Done

### Checkpoint 2.3: Access Control Middleware
- **Objective**: Secure routes using JWT check middleware and Role-based authorization middleware.
- **Files Involved**: `backend/src/middlewares/authenticate.middleware.ts`, `backend/src/middlewares/authorize.middleware.ts`, `backend/src/routes/`.
- **Dependencies**: Checkpoint 2.2.
- **Verification Requirements**: Send request to a protected endpoint without an Authorization header; verify 401 response. Send with a non-admin token to an admin-only endpoint; verify 403 response.
- **Status**: Done

### Checkpoint 2.4: Frontend AuthContext & Axios Token Refresh Interceptors
- **Objective**: Implement global React context storing token memory, and Axios hook refreshing tokens on 401s.
- **Files Involved**: `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/axios.ts`.
- **Dependencies**: Checkpoint 1.2, Checkpoint 2.2.
- **Verification Requirements**: Check that Axios automatically makes silent refresh token request when access token expires.
- **Status**: Done

### Checkpoint 2.5: Route Guards & Login View
- **Objective**: Build routes access limits (Protected vs. Guest vs. Role) and a Login screen.
- **Files Involved**: `frontend/src/routes/guards.tsx`, `frontend/src/features/auth/components/LoginForm.tsx`, `frontend/vite.config.ts`.
- **Dependencies**: Checkpoint 2.4.
- **Verification Requirements**: Open web application on `/login`. Type credentials `admin` / `Admin@123456`, click submit, confirm router moves page to secure dashboard area. Ensure Vite config proxy resolves to active backend port `8000`.
- **Status**: Done

---

## Milestone 3.1: Academic Structure (In Progress)

### Checkpoint 3.1.1: Academic Sessions
- **Objective**: Create CRUD for Academic Sessions (Years) and Terms.
- **Files Involved**: `backend/prisma/schema.prisma`, `backend/src/controllers/academic-session.*`, `frontend/src/features/admin/academic-sessions/*`.
- **Dependencies**: Checkpoint 2.5.
- **Verification Requirements**: Run migrations and verify schema constraints. Test CRUD API and Admin frontend page.
- **Status**: Done

### Checkpoint 3.1.2: Classes
- **Objective**: Create CRUD for Classes.
- **Files Involved**: `backend/src/controllers/class.*`, `frontend/src/features/admin/classes/*`.
- **Dependencies**: Checkpoint 3.1.1.
- **Verification Requirements**: Test CRUD API and Admin frontend page.
- **Status**: Done

### Checkpoint 3.1.3: Sections
- **Objective**: Create CRUD for Sections.
- **Files Involved**: `backend/src/controllers/section.*`, `frontend/src/features/admin/sections/*`.
- **Dependencies**: Checkpoint 3.1.2.
- **Verification Requirements**: Test CRUD API and Admin frontend page.
- **Status**: Done

### Checkpoint 3.1.4: Subjects
- **Objective**: Create CRUD for Subjects.
- **Files Involved**: `backend/src/controllers/subject.*`, `frontend/src/features/admin/subjects/*`.
- **Dependencies**: Checkpoint 3.1.3.
- **Verification Requirements**: Test CRUD API and Admin frontend page.
- **Status**: Done
