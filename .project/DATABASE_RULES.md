# Database Rules

These rules govern database design, modeling, and Prisma schema layouts.

## Schema Modeling Principles

1. **Strict Auth Boundary**:
   - `User` table holds authentication and credentials data only: `username`, `passwordHash`, `role`, `status`.
2. **Profile Isolation**:
   - Administrative, student, and teacher metadata live in separate child models: `AdminProfile`, `TeacherProfile`, `StudentProfile` connected via 1-to-1 relationships to `User`.
3. **No General Enrollment Tables**:
   - Student academic assignments are represented strictly by direct hierarchies: `Session` -> `Class` -> `Section` -> `StudentSectionAssignment`.
4. **Promotion Logs**:
   - Academic path histories are logged in `StudentAcademicHistory` for history and tracking.
5. **Soft Delete**:
   - Tables support status mapping. Account status includes: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`.

## Key Strategy
- All primary keys are UUIDs (specifically UUID v4).
- Soft delete policies and timestamp naming standards are defined in detail in `docs/DATABASE_CONVENTIONS.md`.
