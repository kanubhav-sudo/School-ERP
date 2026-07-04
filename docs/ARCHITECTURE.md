# School ERP System — Software Architecture & Design Guidelines

This document details the software architecture, design principles, and tech-stack choices for the School ERP.

## 1. High-Level Architecture

The system is configured as a monolithic backend serving a Single Page Application (SPA) frontend.

```
+-------------------------------------------------------------+
|                        SPA Frontend                         |
|                 (React + Vite + TypeScript)                 |
+------------------------------+------------------------------+
                               |
                        HTTPS (JSON / REST API)
                               |
+------------------------------v------------------------------+
|                        Express Backend                      |
|                       (Node.js + TS)                        |
+------------------------------+------------------------------+
                               |
                           Prisma Client
                               |
+------------------------------v------------------------------+
|                     PostgreSQL Database                     |
+-------------------------------------------------------------+
```

### Core Architecture Laws

1. **One Web Application**: A single React frontend and a single Express backend serve all three user portals (`Admin`, `Teacher`, `Student`).
2. **Role-Driven UI**: Routing guards, navigation setups, and permissions are determined in real-time by the authenticated user's role.
3. **Decoupled Business Logic**: Backend controllers remain extremely thin. Database and logic flows reside strictly inside dedicated services.
4. **Mobile-Ready REST APIs**: Backend API endpoints must not contain frontend-specific or presentation logic.

---

## 2. Technical Stack Configuration

### Frontend
- **Framework**: React 19 + Vite (for high-speed builds).
- **Styling**: Tailwind CSS v4 + `shadcn/ui` components.
- **State & Data Fetching**: TanStack Query (managing server sync) + Axios.
- **Forms & Validation**: React Hook Form + Zod validation.

### Backend
- **Framework**: Express (v5) + TypeScript.
- **ORM**: Prisma Client.
- **Database Engine**: PostgreSQL.
- **Authentication**: JWT tokens.

---

## 3. Communication Patterns

### API Response Contract
All responses comply with a standard wrapper structure:
- **Success**: `{ success: true, data: ..., message: ... }`
- **Error**: `{ success: false, error: ..., details: ... }`

### Client Authentication
- **Access Tokens**: Short-lived (15 minutes), stored in-memory (no local/session storage usage).
- **Refresh Tokens**: Long-lived (7 days), stored securely inside `httpOnly` secure cookies.
- **Auto-Rotation**: Interceptor in Axios catches `401 Unauthorized` responses and fires token rotation requests automatically.
