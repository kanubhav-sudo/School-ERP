# School ERP System — Database Design & Schema Layout

The database layout is managed via Prisma ORM targeting a PostgreSQL database engine.

## Core Schema Principles

1. **Strict Authentication Boundary**: The `User` model holds only authentication and access credential data (`username`, `passwordHash`, `role`, `status`). 
2. **Sub-Profiles separation**: Profile data lives in explicit child models (`StudentProfile`, `TeacherProfile`, `AdminProfile`) bound to `User` by a strict 1-to-1 relationship.
3. **No General Enrollment models**: Student classes are resolved cleanly via direct hierarchies: `Session` -> `Class` -> `Section` -> `StudentSectionAssignment`.
4. **Promotion logs**: Promoted student paths are recorded in `StudentAcademicHistory` for history and auditing.
5. **No Hard Deletes**: Status field supports `ACTIVE`, `INACTIVE`, `SUSPENDED`, and `ARCHIVED`.

---

## Entity-Relationship Map

### 1. User & Profiles
- **User**: System authentication table. Defines `role` (ADMIN, TEACHER, STUDENT).
- **AdminProfile**: Meta details for Admin accounts.
- **TeacherProfile**: Standard records including `employeeCode`, certificates, and fields.
- **StudentProfile**: Personal data fields including parents details, date of birth, etc.

### 2. Academic Core
- **AcademicSession**: Global time tracker (e.g., "2025-2026").
- **Class**: Grade definitions mapped to academic sessions.
- **Section**: Section instances.
- **StudentSectionAssignment**: Mappings for active students.
- **StudentAcademicHistory**: Promotions log.
- **Subject**: Course definitions.
- **TeacherAssignment**: Mapping teacher -> subject -> section.

### 3. Functional Operations
- **Attendance**: Records daily marks. Status options: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `MEDICAL_LEAVE`, `APPROVED_LEAVE`.
- **Homework & HomeworkEditLogs**: Tracks coursework and edits (for audit purposes).
- **Classwork**: Routine logs of classes.
- **Result & ResultEntry**: Standard reports. Entry states are `DRAFT` or `PUBLISHED`.
- **FeeCategory, FeeAssignment, & FeePayment**: Manage structures, tracking dues (`PENDING`, `PARTIAL`, `PAID`, `OVERDUE`).
- **AdmitCard**: Printable tokens showing exam clearance.
- **Notice**: Bulletins with role targets.
- **AcademicCalendar**: Event schedules.
- **Notification**: User notifications.
- **AuditLog**: Complete Admin-facing logging table tracking database changes.
