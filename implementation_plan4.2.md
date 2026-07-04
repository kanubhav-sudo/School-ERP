# Checkpoint 4.2: Attendance Management Implementation Plan

This document outlines the implementation plan for Checkpoint 4.2: Attendance Management. As per the architectural decisions, attendance will be recorded on a **per-day, per-student** basis for a specific section (period-wise expansion is reserved for Milestone 5).

## User Review Required
Please review the proposed `AttendanceStatus` enum and the database schema to ensure they meet your daily tracking requirements.

## Proposed Changes

---

### Database Schema

#### [MODIFY] schema.prisma
Add new Enum and Models for Attendance:

```prisma
enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
}

model Attendance {
  id           String             @id @default(uuid())
  date         DateTime           @db.Date
  sectionId    String
  section      Section            @relation(fields: [sectionId], references: [id])
  recordedById String
  recordedBy   User               @relation(fields: [recordedById], references: [id])
  records      AttendanceRecord[]
  
  isDeleted    Boolean            @default(false)
  deletedAt    DateTime?
  deletedById  String?

  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  // Ensure only one attendance log exists per section per day
  @@unique([sectionId, date])
}

model AttendanceRecord {
  id           String           @id @default(uuid())
  attendanceId String
  attendance   Attendance       @relation(fields: [attendanceId], references: [id], onDelete: Cascade)
  studentId    String
  student      Student          @relation(fields: [studentId], references: [id])
  status       AttendanceStatus
  remarks      String?

  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([attendanceId, studentId])
}
```

---

### Backend API

#### [NEW] backend/src/validators/attendance.validator.ts
- `markAttendanceSchema`: Validates `date`, `sectionId`, and an array of `records` `{ studentId, status, remarks }`.
- `getAttendanceSchema`: Query validator for `date` and `sectionId`.

#### [NEW] backend/src/services/attendance.service.ts
- `markAttendance`: Upserts attendance for a section on a given date.
- `getAttendance`: Fetches attendance details for a section on a given date, including all students in that section.

#### [NEW] backend/src/controllers/attendance.controller.ts
- Route handlers for marking and fetching attendance.

#### [NEW] backend/src/routes/attendance.routes.ts
- `GET /api/v1/attendance`
- `POST /api/v1/attendance` (Upsert logic)
- Routes protected by `authenticate` and `authorize('ADMIN', 'TEACHER')`.

#### [MODIFY] backend/src/routes/index.ts
- Mount `/api/v1/attendance` to `attendanceRoutes`.

---

### Frontend UI

#### [NEW] frontend/src/features/admin/attendance/api.ts
- API client for fetching and marking attendance.
- Interfaces for `Attendance`, `AttendanceRecord`, `AttendanceStatus`.

#### [NEW] frontend/src/features/admin/attendance/AttendancePage.tsx
- Page layout containing class/section/date selectors.
- Fetches students for the selected section and their attendance records for the selected date.

#### [NEW] frontend/src/features/admin/attendance/components/AttendanceGrid.tsx
- Datatable displaying the list of students in the section.
- Inline radio buttons/dropdowns to mark `PRESENT`, `ABSENT`, `LATE`, or `HALF_DAY`.
- Save button to submit the batch attendance list.

#### [MODIFY] frontend/src/layouts/AdminLayout.tsx
- Add `Attendance` link to the sidebar under the `Operations` section.

#### [MODIFY] frontend/src/App.tsx
- Add `/admin/attendance` route.

---

## Verification Plan

### Automated Tests
- Backend `npm run build` and `npm run lint`.
- Frontend `npm run build` and `npm run lint`.

### Manual Verification
- Run `npm run prisma:migrate` to generate DB tables.
- Open the Admin Dashboard -> Attendance.
- Select a Class and Section with enrolled students, and pick today's date.
- Mark attendance for students and save.
- Reload the page and select the same date to verify the previously saved attendance data loads correctly.
- Attempt to fetch attendance for a future date (if restricted) or check edge cases.
