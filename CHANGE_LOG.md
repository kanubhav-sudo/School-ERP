# Changelog

All notable changes to the School ERP project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
