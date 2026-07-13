# Milestone 6 — Teacher Management System
## Permanent Engineering Reference Document

**Version**: 2.0.0 — APPROVED WITH REVISIONS
**Created**: 2026-07-13
**Status**: APPROVED — IMPLEMENTATION IN PROGRESS

---

## REVISION LOG (v1 → v2)

| # | Revision | Impact |
|---|----------|--------|
| R1 | Photo URL stays URL-only; document as future-proof for Storage Module | Schema unchanged |
| R2 | Assignment tables must show Subject Name + Subject Code always | Frontend select shape |
| R3 | Teachers page filters: Session, Class, Subject, Employment Status (remove Blood Group from filters) | Frontend + backend query |
| R4 | TeachersPage: summary cards (Total, Active, Inactive, Class Teachers) | New backend stat endpoint |
| R5 | Teacher row shows compact workload summary (Subjects, Sections, Classes, Class Teacher) | Frontend computed display |
| R6 | TeacherDetailPage: Today's Timetable as primary card, Weekly underneath | Frontend logic |
| R7 | New `designation` field (enum) on Teacher model | Schema + migration change |
| R8 | Attendance remains Admin-only; architecture only for future Teacher Portal | No attendance route changes |
| R9 | Homework validation rule: TeacherAssignment AND Timetable entry must both exist | Architecture doc only |
| R10 | Teacher Detail Page: Workload Summary card (Total Subjects, Classes, Sections, Weekly Periods, Class Teacher Of) | Frontend computation |

---

## 1. Objectives

| Part | Feature | Status |
|------|---------|--------|
| Part 1 | Teacher Profile — full field set (photo, blood group, emergency contact, designation) | In Scope |
| Part 2 | Academic Assignment — session + class + section + subject, class teacher flag | In Scope |
| Part 3 | Timetable Integration — teacher schedule (today + weekly) | In Scope |
| Part 4 | Homework Integration — architecture only (no CRUD) | Architecture Only |
| Part 5 | Attendance Integration — architecture only (admin-only routes unchanged) | Architecture Only |
| Part 6 | Noticeboard Integration — existing notice service reused | Architecture Only |
| Part 7 | Teacher Dashboard Architecture | Design Only |
| Part 8 | Admin UI — full-featured Teacher Management screens | In Scope |

**Out of Scope:**
- Teacher self-service portal login
- Leave management / payroll
- Homework CRUD
- Teacher Dashboard implementation
- Teacher-role attendance routes (future milestone)
- File upload for photos (future Storage Module)

---

## 2. Existing Architecture (Verified via Code Inspection)

### 2.1 What Already Exists

**Backend Teacher (verified fields):**
```
Teacher: id, userId, employeeId, firstName, lastName, gender, dateOfBirth, phone, email,
         qualification, experienceYears, department, joiningDate, employmentStatus,
         address, notes, isActive, deletedAt, createdAt, updatedAt
TeacherAssignment: id, teacherId, classId, sectionId, subjectId
  @@unique([teacherId, classId, sectionId, subjectId])  ← NO sessionId yet
```

**Missing (to be added in MC-1):**
- Teacher: `bloodGroup`, `emergencyContact`, `emergencyPhone`, `photoUrl`, `designation`
- TeacherAssignment: `sessionId`, `isClassTeacher`

**Existing services reused:**
- `getTimetableByTeacher(teacherId, sessionId?)` — timetable.service.ts ✓
- `NoticeService.getNotices({ role, classId })` — notice.service.ts ✓
- `listAttendance` / `getAttendanceSheet` — attendance.service.ts ✓

### 2.2 Mandatory Patterns

| Pattern | Source |
|---------|--------|
| Validator → Service → Controller → Router | All existing modules |
| `prisma.$transaction()` for multi-step writes | teacher.service.ts |
| Soft delete via `deletedAt` + `isActive: false` | teacher.service.ts |
| `ApiResponse.success/created/badRequest` | All controllers |
| `ConflictError`, `NotFoundError`, `ValidationError` | core/errors.ts |
| `authenticate + authorize('ADMIN')` on all admin routes | All routes |
| TanStack Query + React Hook Form + Zod + shadcn/ui | All frontend pages |

---

## 3. Database Changes

### 3.1 New Enum: `TeacherDesignation`

```prisma
enum TeacherDesignation {
  PRINCIPAL
  VICE_PRINCIPAL
  COORDINATOR
  SENIOR_TEACHER
  TEACHER
  ASSISTANT_TEACHER
}
```

**Rationale (R7):** Future-proofing. This field will be consumed by Leave Module, Payroll,
Dashboard permissions, and reporting. Introducing now avoids a separate migration later.

### 3.2 Teacher Model Additions

```prisma
// ADD to Teacher model:
bloodGroup       BloodGroup?        @map("blood_group")        // Reuses existing enum
emergencyContact String?            @map("emergency_contact")
emergencyPhone   String?            @map("emergency_phone")
photoUrl         String?            @map("photo_url")
// NOTE (R1): photoUrl is intentionally URL-only in this milestone.
// Future Storage Module will add file upload capability while reusing this same column.
// No schema change will be required when uploads are implemented.
designation      TeacherDesignation? @default(TEACHER) @map("designation")
// NOTE (R7): designation defaults to TEACHER for all existing records.
// Will be consumed by: Leave Module, Payroll, Dashboard, Permissions.
```

### 3.3 TeacherAssignment Model Changes

```prisma
// ADD to TeacherAssignment:
sessionId      String  @map("session_id") @db.Uuid
isClassTeacher Boolean @default(false) @map("is_class_teacher")

// ADD relation:
session AcademicSession @relation(fields: [sessionId], references: [id])

// UPDATE @@unique (drop old, create new):
// OLD: @@unique([teacherId, classId, sectionId, subjectId])
// NEW: @@unique([teacherId, sessionId, classId, sectionId, subjectId])

// ADD indexes:
@@index([sessionId])
@@index([isClassTeacher])
```

### 3.4 AcademicSession Inverse Relation

```prisma
// ADD to AcademicSession model:
teacherAssignments TeacherAssignment[]
```

### 3.5 Homework Architecture (Documentation Only — R9)

```prisma
// DESIGN for future milestone (NOT implemented now):
model Homework {
  id        String @id @default(uuid()) @db.Uuid
  teacherId String @map("teacher_id") @db.Uuid
  sessionId String @map("session_id") @db.Uuid
  classId   String @map("class_id") @db.Uuid
  sectionId String @map("section_id") @db.Uuid
  subjectId String @map("subject_id") @db.Uuid
  ...
}
```

**Validation rule when Homework is implemented (R9):**
A teacher may create homework ONLY if:
1. `TeacherAssignment` exists for `(teacherId, sessionId, classId, sectionId, subjectId)`
2. `Timetable` entry exists for `(teacherId, sectionId, subjectId, sessionId)`

This dual validation prevents teachers from assigning homework for subjects they are
nominally assigned to but which are not actually scheduled in the timetable.

### 3.6 Migration Plan

```
Migration name: add_teacher_management_enhancements

SQL summary:
  ALTER TABLE teachers ADD COLUMN blood_group text;
  ALTER TABLE teachers ADD COLUMN emergency_contact text;
  ALTER TABLE teachers ADD COLUMN emergency_phone text;
  ALTER TABLE teachers ADD COLUMN photo_url text;
  ALTER TABLE teachers ADD COLUMN designation text;

  ALTER TABLE teacher_assignments ADD COLUMN session_id uuid NOT NULL;
  ALTER TABLE teacher_assignments ADD COLUMN is_class_teacher boolean NOT NULL DEFAULT false;
  DROP CONSTRAINT teacher_assignments_teacher_id_class_id_section_id_subject_id_key;
  CREATE UNIQUE INDEX ... ON teacher_assignments(teacher_id, session_id, class_id, section_id, subject_id);
```

> **ASSUMPTION**: DB has no existing `TeacherAssignment` rows (clean dev DB). If rows exist,
> `session_id NOT NULL` will fail — user confirmed Option A (assume clean DB).

---

## 4. Backend Changes

### 4.1 Validators — `teacher.validator.ts`

Add to `createTeacherSchema`:
```typescript
bloodGroup: z.enum(['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE',
  'O_POSITIVE','O_NEGATIVE','AB_POSITIVE','AB_NEGATIVE']).optional(),
emergencyContact: z.string().max(100).trim().optional(),
emergencyPhone: z.string().max(20).trim().optional(),
photoUrl: z.string().url().optional(),
designation: z.enum(['PRINCIPAL','VICE_PRINCIPAL','COORDINATOR',
  'SENIOR_TEACHER','TEACHER','ASSISTANT_TEACHER']).optional().default('TEACHER'),
```

Update `createTeacherAssignmentSchema`:
```typescript
sessionId: z.string().uuid('sessionId must be a valid UUID'),
isClassTeacher: z.boolean().optional().default(false),
```

Update `listTeachersSchema`:
```typescript
// ADD (R3):
sessionId: z.string().uuid().optional(),   // filter by assigned session
classId:   z.string().uuid().optional(),   // filter by assigned class
subjectId: z.string().uuid().optional(),   // filter by assigned subject (R3)
// NOTE: bloodGroup removed from filters per R3 revision
```

### 4.2 Services — `teacher.service.ts`

`teacherSelect` additions:
```typescript
bloodGroup: true,
emergencyContact: true,
emergencyPhone: true,
photoUrl: true,
designation: true,
// Updated assignment select (R2 — Subject Name + Code always visible):
assignments: {
  select: {
    id: true,
    sessionId: true,
    isClassTeacher: true,
    session: { select: { id: true, name: true } },
    class: { select: { id: true, name: true } },
    section: { select: { id: true, name: true } },
    subject: { select: { id: true, name: true, code: true } },  // code always included
  }
}
```

New `listTeachers()` filters:
```typescript
...(sessionId || classId || subjectId ? {
  assignments: { some: {
    ...(sessionId ? { sessionId } : {}),
    ...(classId ? { classId } : {}),
    ...(subjectId ? { subjectId } : {}),
  }}
} : {}),
```

`addTeacherAssignment()` changes:
```typescript
// 1. Validate session exists
// 2. Validate section belongs to class
// 3. If isClassTeacher=true: check no existing class teacher for (sessionId, classId, sectionId)
// 4. Create with sessionId + isClassTeacher
```

### 4.3 New: Teacher Stats Endpoint (R4)

New service function `getTeacherStats()`:
```typescript
// Returns: { total, active, inactive, classTeachers }
// - total: count where deletedAt=null
// - active: count where isActive=true AND deletedAt=null
// - inactive: count where isActive=false AND deletedAt=null
// - classTeachers: count of distinct teacherIds where isClassTeacher=true
```

New route: `GET /api/v1/teachers/stats`
Must be registered BEFORE `/:id` to avoid route conflict.

### 4.4 New: Integration Endpoints (MC-3)

```typescript
// GET /api/v1/teachers/:id/timetable  — delegates to getTimetableByTeacher()
// GET /api/v1/teachers/:id/sections   — returns assigned sections list
```

---

## 5. API Endpoints

### Existing (unchanged)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/teachers` | List teachers (filters: search, sessionId, classId, subjectId, employmentStatus) |
| GET | `/api/v1/teachers/:id` | Get teacher with assignments |
| POST | `/api/v1/teachers` | Create teacher (now includes new fields) |
| PATCH | `/api/v1/teachers/:id` | Update teacher |
| DELETE | `/api/v1/teachers/:id` | Soft delete |
| POST | `/api/v1/teachers/:id/assignments` | Add assignment (now requires sessionId) |
| DELETE | `/api/v1/teachers/:id/assignments/:asgId` | Remove assignment |

### New in Milestone 6
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/teachers/stats` | Teacher summary stats (R4) |
| GET | `/api/v1/teachers/:id/timetable` | Teacher's weekly timetable |
| GET | `/api/v1/teachers/:id/sections` | Teacher's assigned sections |

---

## 6. Frontend Changes (Revised)

### TeachersPage (R3, R4, R5)

**Summary Cards (R4):**
- Total Teachers
- Active Teachers
- Inactive Teachers
- Class Teachers
- All from live `GET /teachers/stats`

**Filters (R3):**
- Search (unchanged)
- Academic Session dropdown
- Class dropdown
- Subject dropdown
- Employment Status dropdown

**Teacher Row (R5) — Workload Summary column:**
```
Assignments
Subjects: 4 | Sections: 5 | Classes: 3
Class Teacher: IX-A
```
Computed client-side from `teacher.assignments[]` already in the list response.

### TeacherForm (Personal Fields)
Adds: Blood Group, Emergency Contact, Emergency Phone, Photo URL, Designation

### TeacherDetailPage (R6, R10)

**Layout:**
```
← Back | Name + EmployeeID + Status

Grid (2/3 + 1/3):
  Left:
    [Card] Today's Timetable (PRIMARY — R6)
      Filtered to current day of week from timetable response
    [Card] Weekly Timetable (secondary, collapsible or below)
    [Card] Academic Assignments
      Table: Session | Class | Section | Subject (Name + Code) | Class Teacher | Actions
      [+ Add Assignment] form inline
    [Card] Workload Summary (R10)
      Total Subjects | Total Classes | Total Sections | Weekly Periods | Class Teacher Of
  Right:
    [Card] Personal Information (all fields)
    [Card] Emergency Contact
    [Card] Account Management (existing)
```

**Workload computed from:**
- `teacher.assignments[]` for subjects/classes/sections
- `timetable[]` for weekly period count
- `assignments.filter(a => a.isClassTeacher)` for class teacher designation

---

## 7. Integration Architecture

### 7.1 Timetable — no new code needed
`getTimetableByTeacher()` already exists and is reused.

### 7.2 Homework (Architecture — R9)
See Section 3.5 for validation rule documentation.

### 7.3 Attendance (R8)
Attendance routes remain ADMIN-only. No teacher-role routes added.
`GET /teachers/:id/sections` provides the data needed for future teacher portal attendance UI.

### 7.4 Noticeboard — no new code needed
Existing `getNotices({ role: 'TEACHER', classId })` covers filtering.

### 7.5 Teacher Dashboard (Future — Design Only)
```
/teacher/dashboard (future implementation):
  TodayTimetable     → GET /teachers/:id/timetable + day filter
  MyClasses          → GET /teachers/:id/sections
  PendingHomework    → GET /homework?teacherId=X (future)
  AttendanceSummary  → GET /attendance?sectionId=X (future, teacher role)
  MyNotices          → GET /notices?role=TEACHER&classId=X
  ProfileCard        → GET /teachers/:id
  LeaveStatus        → future leave module
```

---

## 8. Micro-Checkpoints (Revised)

| MC | Objective | Key Files |
|----|-----------|-----------|
| **MC-1** | Prisma schema + migration | `schema.prisma`, migration |
| **MC-2** | Backend: Validators + Service | `teacher.validator.ts`, `teacher.service.ts` |
| **MC-3** | Backend: Stats + Integration endpoints | `teacher.controller.ts`, `teacher.routes.ts` |
| **MC-4** | Frontend: TeacherForm (new personal fields) | `TeacherForm.tsx`, `api.ts` |
| **MC-5** | Frontend: TeacherDetailPage full upgrade | `TeacherDetailPage.tsx` |
| **MC-6** | Frontend: TeachersPage (cards, filters, workload) | `TeachersPage.tsx`, `api.ts` |
| **MC-7** | Docs: Update all project documentation | `task.md`, `walkthrough.md`, `CURRENT_PROGRESS.md`, `CURRENT_TASK.md` |

### Verification gate (every MC):
```bash
cd backend && npm run build   # must pass
cd backend && npm run lint    # must pass
cd frontend && npm run build  # must pass
cd frontend && npm run lint   # must pass
git commit + git push
```

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| `session_id NOT NULL` fails if existing TeacherAssignment rows | High | Assume clean DB (user confirmed); 2-step migration if not |
| Stats endpoint `/teachers/stats` conflicts with `/:id` route | Medium | Register `/stats` BEFORE `/:id` in router |
| Workload summary computed wrong (cross-session contamination) | Low | Filter by active session in computation |
| `designation` enum not recognized | Low | Enum defined before model in schema |
| Unique constraint change loses existing assignment data | High | Migration drops old, creates new in same transaction |

---

## 10. Completion Criteria

### Backend
- [ ] Migration `add_teacher_management_enhancements` applied cleanly
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `GET /teachers/stats` returns total/active/inactive/classTeachers
- [ ] `GET /teachers` supports sessionId, classId, subjectId, employmentStatus filters
- [ ] `POST /teachers` accepts bloodGroup, emergencyContact, emergencyPhone, photoUrl, designation
- [ ] `POST /teachers/:id/assignments` requires sessionId, supports isClassTeacher
- [ ] Class teacher uniqueness enforced (409)
- [ ] `GET /teachers/:id/timetable` delegates to existing service
- [ ] `GET /teachers/:id/sections` returns assigned sections

### Frontend
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] TeachersPage: 4 summary cards (live data)
- [ ] TeachersPage: Session / Class / Subject / Employment Status filters
- [ ] TeachersPage: Workload summary column on each teacher row
- [ ] TeacherForm: Blood Group, Emergency Contact, Emergency Phone, Photo URL, Designation
- [ ] TeacherDetailPage: Today's Timetable as primary card
- [ ] TeacherDetailPage: Weekly Timetable as secondary
- [ ] TeacherDetailPage: Assignments table shows Subject Name + Subject Code
- [ ] TeacherDetailPage: Workload Summary card
- [ ] No regressions in existing teacher CRUD

### Documentation
- [ ] task.md updated
- [ ] walkthrough.md updated
- [ ] CURRENT_PROGRESS.md updated
- [ ] CURRENT_TASK.md updated
- [ ] CHECKPOINTS.md updated

---

*Last updated: 2026-07-13 (v2.0 — Approved with revisions)*
*Every future AI session MUST read this document before writing Milestone 6 code.*
