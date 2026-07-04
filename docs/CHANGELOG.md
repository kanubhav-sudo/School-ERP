# Changelog

All notable changes to the School ERP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0-milestone3.2] - 2026-07-04

### Added
- Prisma schemas for `Teacher`, `TeacherAssignment`, and `Student`.
- Backend CRUD APIs for people management (Teachers & Students).
- Frontend UI components `TeachersPage`, `TeacherForm`, `StudentsPage`, `StudentForm`.
- Sidebar navigation for People management in the Admin portal.

## [1.5.0-milestone4.2] - 2026-07-04

### Added
- Prisma schema for `Attendance` and `AttendanceRecord` models with `AttendanceStatus` enum.
- Backend CRUD APIs for Attendance tracking with atomic upsert logic per section and date.
- Frontend UI components `AttendancePage` and `AttendanceGrid`.
- Sidebar navigation for Attendance in the Admin portal Operations section.

## [1.4.0-milestone4.1] - 2026-07-04

### Added
- Prisma schema for `Timetable` model with `DayOfWeek` enum and double-booking compound unique constraints.
- Backend CRUD APIs for Timetable management with robust time overlap validation.
- Frontend UI components `TimetablePage`, `TimetableGrid`, and `TimetableForm`.
- Sidebar navigation for Timetable operations in the Admin portal.

## [1.3.0-milestone3.2] - 2026-07-04

### Added
- Prisma schemas for `AcademicSession`, `Term`, `Class`, `Section`, `Subject`, `ClassSubject`.
- Backend CRUD APIs for all academic entities.
- Frontend UI components and forms for managing academic structure.
- Admin layout sidebar navigation additions for academic entities.

## [1.2.0-milestone2] - 2026-07-02

### Added
- Database schema for `User` model, role enums, and initial seeding script.
- Authentication service utilizing `bcrypt` hashing and JWTs.
- HttpOnly cookie management for refresh token rotation.
- Express middlewares for authentication checking and role-based authorization.
- React `AuthContext` to manage global login state.
- Axios interceptors for automatic silent token refreshing.
- Route guards (`ProtectedRoute`, `GuestRoute`, `RoleRoute`).
- Login UI built with `shadcn/ui` and `react-hook-form`.

## [1.1.0-milestone1.5] - 2026-07-01

### Added
- Central Zod validated environment config (`env.ts`).
- Environment variable templates (`.env.development`, `.env.production`, `.env.test`).
- Singleton Prisma client pattern.
- Pino structured logger integration with request IDs.
- Shared constants for roles, fees, attendance both on backend and frontend.
- Standardized `AppError` and `ApiResponse` utilities.
- Express security middleware (Helmet, CORS, Compression).
- Rate limiters and payload limits.
- Husky and lint-staged git hooks for pre-commit verification.

## [1.0.0-milestone1] - 2026-06-30

### Added
- Root configuration files: `README.md`, `.gitignore`, `.editorconfig`, `docker-compose.yml`, `.env.example`, `LICENSE`, `.prettierrc`.
- Vite React TS frontend project setup under `frontend/` folder.
- Express TS backend project setup under `backend/` folder.
- Tailwind CSS v4 and `shadcn/ui` UI framework configurations in the frontend.
- Standard ESLint flat configs (`eslint.config.js` and `eslint.config.mjs`) alongside Prettier configurations across both frontend and backend.
- Path aliases mapping `@/*` to `src/*` for clean imports.
- Prisma ORM initialization with basic schema and PostgreSQL connection settings.
- Minimal Express entry point (`src/index.ts`) and React entry point (`src/App.tsx`).
- Approved directory structures under `frontend/src/` and `backend/src/`.
- Documentation structure (`docs/` directory housing `ROADMAP.md`, `API.md`, `DATABASE.md`, `ARCHITECTURE.md`, `FEATURES.md`, `CHANGELOG.md`).
