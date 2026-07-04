# System Overview

The School ERP is an enterprise-grade school management platform designed for student, teacher, and administrator operations.

## Architecture Blueprint

- **Unified Application**: A single Express monolithic backend serving a single React Single Page Application (SPA).
- **Client**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui.
- **Server**: Node.js + Express (v5) + TypeScript + Prisma ORM.
- **Database**: PostgreSQL.
- **Role-Based Access**: Adaptive layouts and router guards defined dynamically by the authenticated user's role (ADMIN, TEACHER, STUDENT).

## Communication Protocol

- **API Versioning**: All API paths are grouped under `/api/v1`.
- **API Envelope**: All responses comply with a standard wrapper structure:
  - **Success**: `{ success: true, data: ..., message: ... }`
  - **Error**: `{ success: false, error: ..., details: ... }`
- **Session Auth**: In-memory short-lived access tokens combined with secure `httpOnly` refresh token cookies.
