# School ERP System — Project Roadmap

This document outlines the milestones and release plan for the School ERP System.

## Milestone Timeline

### Milestone 1: Project Initialization & Foundation (Current)
- [x] Initial Repository Scaffold (Vite + React frontend, Express + Node backend)
- [x] Docker integration for database development
- [x] Path aliases, TypeScript strict settings, and code style configurations (ESLint + Prettier)
- [x] Empty database schema setup via Prisma
- [x] Basic health check routing

### Milestone 1.5: Engineering Foundation Hardening (Next)
- [ ] Strict environment validation with Zod (Backend validation on start)
- [ ] Production-grade logging with Pino (Request ID tracking support)
- [ ] Reusable custom error system (e.g., AppError, ValidationError)
- [ ] Centralized constants (Roles, Attendance, Fees, Results)
- [ ] API routing namespaces (`/api/v1`)
- [ ] UTC timestamp policies and utilities
- [ ] Database seed boilerplate setup
- [ ] Git quality gates (Husky & lint-staged)
- [ ] Security hardening (Rate limiters, size limits, Helmet, CORS, Compression)
- [ ] Storage architecture directories reserving layout
- [ ] Centralized feature flags config
- [ ] Comprehensive Health endpoint upgrade

### Milestone 2: Core Authentication & RBAC (Future)
- [ ] User authentication flow (Access & Refresh tokens)
- [ ] JWT security layers (httpOnly cookie refreshes)
- [ ] Role-Based Access Control (RBAC) middleware for `ADMIN`, `TEACHER`, `STUDENT`

### Milestone 3: Academic & User Management
- [ ] Academic session creation & management
- [ ] Class & Section administration
- [ ] Student Profiles & Teacher Profiles management (Admin dashboard)
- [ ] Subject assignments to classes/sections and teacher assignments

### Milestone 4: Operations & Portals
- [ ] Attendance tracking for teachers, view panels for students and admins
- [ ] Noticeboard and global announcements
- [ ] Homework and classwork management with audit logs for edits

### Milestone 5: Fees & Results
- [ ] Fee categorization, custom structures, payment entry, and PDF receipt downloads
- [ ] Grading schemes, marks sheet entries, report card publication
- [ ] Admit cards generation with custom fee-clearance filters
- [ ] System audit logging configuration for Admin transparency
