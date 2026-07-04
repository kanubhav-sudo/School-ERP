# School ERP — Task Checklist

## Milestone 1: Project Initialization & Foundation ✅

### Root Setup
- [x] Create root README.md
- [x] Create root .gitignore
- [x] Create root .editorconfig
- [x] Create root docker-compose.yml
- [x] Create root .env.example
- [x] Create root LICENSE

### Frontend Setup
- [x] Initialize Vite + React + TypeScript
- [x] Install dependencies (Tailwind, shadcn/ui, TanStack Query, React Hook Form, Zod, Axios, React Router)
- [x] Configure Tailwind CSS
- [x] Configure shadcn/ui
- [x] Configure path aliases (tsconfig)
- [x] Configure ESLint + Prettier
- [x] Create approved folder structure (features, components, hooks, lib, routes, types, assets)
- [x] Create minimal entry point (App.tsx, main.tsx)
- [x] Verify frontend builds and starts

### Backend Setup
- [x] Initialize Node.js + Express + TypeScript
- [x] Install dependencies (Express, Prisma, cors, dotenv, bcrypt, jsonwebtoken, zod, etc.)
- [x] Configure TypeScript
- [x] Configure ESLint + Prettier
- [x] Initialize Prisma (empty schema, PostgreSQL datasource)
- [x] Create approved folder structure (controllers, services, middlewares, routes, validators, utils, types, config, jobs)
- [x] Create minimal entry point (src/index.ts — Express server starts)
- [x] Verify backend builds and starts

### Docker
- [x] docker-compose.yml with PostgreSQL service
- [x] Verify Docker config is valid

### Documentation
- [x] docs/ROADMAP.md
- [x] docs/API.md
- [x] docs/DATABASE.md
- [x] docs/ARCHITECTURE.md
- [x] docs/FEATURES.md
- [x] docs/CHANGELOG.md

### Verification
- [x] Frontend builds (npm run build)
- [x] Frontend starts (npm run dev)
- [x] Backend compiles (tsc)
- [x] Backend starts (npm run dev)
- [x] ESLint passes on both
- [x] All dependencies resolve

---

## Milestone 1.5: Engineering Foundation Hardening

### Environment & Configuration
- [x] Create backend/src/config/env.ts (Zod validation)
- [x] Create backend/src/config/index.ts (centralized export)
- [x] Create .env.development, .env.production, .env.test templates
- [x] Update .env.example with all variables

### Central Database Module
- [x] Create backend/src/database/prisma.ts (singleton PrismaClient)
- [x] Remove PrismaClient instantiation from index.ts

### Core Infrastructure (backend/src/core/)
- [x] core/logger.ts (Pino-based structured logging)
- [x] core/errors.ts (AppError hierarchy)
- [x] core/response.ts (API response envelope helpers)
- [x] core/constants.ts (shared constants — Roles, Attendance, Fees, etc.)
- [x] core/time.ts (UTC timestamp utilities)

### Middleware
- [x] middlewares/requestId.middleware.ts
- [x] middlewares/requestLogger.middleware.ts
- [x] middlewares/rateLimiter.middleware.ts (route-specific limiters)
- [x] middlewares/error.middleware.ts (global error handler)

### API Routing
- [x] Create backend/src/routes/index.ts (router assembly under /api/v1)
- [x] Create backend/src/routes/health.routes.ts (upgraded health endpoint)
- [x] Mount routes in index.ts

### Security Hardening
- [x] Install and configure Helmet, CORS, Compression
- [x] Configure express-rate-limit with route-specific limits
- [x] Set JSON body size limits

### Storage Architecture
- [x] Create backend/storage/local/ with placeholder directories
- [x] Create backend/src/core/storage.ts (abstraction interface)

### Database Conventions
- [x] Create docs/DATABASE_CONVENTIONS.md

### Frontend Constants
- [x] Create frontend/src/types/constants.ts (matching backend constants)

### Seed Placeholder
- [x] Create backend/prisma/seed.ts (boilerplate)

### Final Verification
- [x] Backend builds (npm run build)
- [x] Backend starts (npm run dev)
- [x] Frontend builds (npm run build)
- [x] Frontend starts (npm run dev)
- [x] ESLint passes on backend
- [x] ESLint passes on frontend
- [x] Docker config remains valid
- [x] Health endpoint works
- [x] Auth flow works (Login, JWT, Roles)

---

## Milestone 2: Core Authentication & RBAC ✅

### Database Schema & Seed
- [x] Create User model in `schema.prisma` with `Role` enum (ADMIN, TEACHER, STUDENT)
- [x] Generate database migrations and client (`npx prisma migrate dev`)
- [x] Seed database with initial admin user (`admin` / `Admin@123456`)

### Backend Implementation
- [x] Implement `AuthService` handling password hashing (bcrypt) and JWT generation
- [x] Implement `AuthController` handling login, refresh token rotation, and logout
- [x] Implement Zod input schemas for validation
- [x] Implement `authenticate` middleware checking Bearer token
- [x] Implement `authorize` middleware performing role checks
- [x] Mount auth routes under `/api/v1/auth`

### Frontend Implementation
- [x] Setup `AuthContext` to manage authentication state
- [x] Setup Axios client interceptors for automatic silent token refresh on 401
- [x] Create login view using shadcn/ui and React Hook Form
- [x] Setup navigation route guards (`ProtectedRoute`, `GuestRoute`, `RoleRoute`)

### Verification
- [x] Resolve Prisma client setup adapter-pg for Prisma 7 compatibility
- [x] Resolve Express 5 wildcard path compilation issue
- [x] Verify successful linting & build on both backend and frontend
- [x] Verify login and refresh cycle end-to-end via curl and client proxy target (port 8000)
