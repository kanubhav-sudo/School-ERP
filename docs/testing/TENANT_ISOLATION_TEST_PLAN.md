# CloudEMS Platform — Tenant Isolation Test Plan

**Document Version**: 1.0.0  
**Date**: 2026-08-03  
**Status**: ACTIVE TEST SPECIFICATION  
**Scope**: Phase 3 Multi-Tenant Isolation Verification  

---

## 1. Overview & Verification Strategy

This document defines the strict, repeatable manual and automated test protocols to guarantee **zero cross-tenant data leakage** across the entire CloudEMS SaaS platform.

### Core Testing Principle
For every business module in CloudEMS, test cases MUST demonstrate:
```
[School A Context] → Create / Update / Query Resource (ID: X)
                          ↓
[School B Context] → Attempt Read / Update / Delete / Export Resource (ID: X)
                          ↓
[Result Expectation] → 404 Not Found OR 403 Forbidden OR Empty Dataset (0 Records returned)
```

No data belonging to **School A** (`schoolId_A`) must EVER be visible, searchable, modifiable, or accessible by **School B** (`schoolId_B`), even if School B knows the explicit UUID or primary key of School A's resource.

---

## 2. Global Test Setup Prerequisites

### Test Environment Requirements
1. **School A**: `slug: "alpha-academy"`, `schoolId: "11111111-1111-1111-1111-111111111111"`
   - Admin Login ID: `admin_alpha`, Password: `Password@123`
2. **School B**: `slug: "beta-international"`, `schoolId: "22222222-2222-2222-2222-222222222222"`
   - Admin Login ID: `admin_beta`, Password: `Password@123`
3. **Super Admin**: Platform Operator (global access bypass for system maintenance only)
   - Login ID: `superadmin`, Password: `SuperSecretPassword@123`

---

## 3. Module-by-Module Verification Matrix

---

### 3.1 Students Module

#### Workflow Definition
1. **School A**: Create Student `John Doe` (Admission No: `STU-2026-001`). Note generated `studentId_A`.
2. **School B**: 
   - `GET /api/v1/students` with `X-School-Slug: beta-international`. Verify `John Doe` is NOT in the list.
   - `GET /api/v1/students/{studentId_A}` with `X-School-Slug: beta-international`. Verify `404 Not Found`.
   - `PATCH /api/v1/students/{studentId_A}` with payload `{ "firstName": "Hacked" }`. Verify `404 Not Found`.
   - `DELETE /api/v1/students/{studentId_A}`. Verify `404 Not Found`.
   - `POST /api/v1/students` with Admission No: `STU-2026-001`. Verify creation **SUCCEEDS** without duplicate error because admission numbers are tenant-scoped.

---

### 3.2 Teachers Module

#### Workflow Definition
1. **School A**: Create Teacher `Prof. Alan Turing` (Employee ID: `EMP-001`, Email: `alan@turing.edu`). Note `teacherId_A`.
2. **School B**:
   - `GET /api/v1/teachers` with `X-School-Slug: beta-international`. Verify empty list or School B teachers only.
   - `GET /api/v1/teachers/{teacherId_A}` with `X-School-Slug: beta-international`. Verify `404 Not Found`.
   - `PUT /api/v1/teachers/{teacherId_A}`. Verify `404 Not Found`.
   - `POST /api/v1/teachers` with Employee ID `EMP-001` and Email `alan@turing.edu`. Verify creation **SUCCEEDS** (tenant-scoped unique constraints on `[schoolId, employeeId]` and `[schoolId, email]`).

---

### 3.3 Academic Sessions Module

#### Workflow Definition
1. **School A**: Create Academic Session `2026-2027`. Note `sessionId_A`.
2. **School B**:
   - `GET /api/v1/academic-sessions`. Verify `2026-2027` of School A is not returned.
   - `POST /api/v1/academic-sessions` with name `2026-2027`. Verify creation **SUCCEEDS** (tenant-scoped `[schoolId, name]` unique constraint).
   - `PATCH /api/v1/academic-sessions/{sessionId_A}/activate`. Verify `404 Not Found`.

---

### 3.4 Classes & Sections Module

#### Workflow Definition
1. **School A**: Create Class `Grade 10` and Section `Section A`. Note `classId_A` and `sectionId_A`.
2. **School B**:
   - `GET /api/v1/classes` and `GET /api/v1/sections`. Verify School A's classes/sections are missing.
   - `POST /api/v1/classes` with name `Grade 10`. Verify creation **SUCCEEDS**.
   - `GET /api/v1/classes/{classId_A}` from School B context. Verify `404 Not Found`.

---

### 3.5 Subjects Module

#### Workflow Definition
1. **School A**: Create Subject `Mathematics` (Code: `MATH-101`). Note `subjectId_A`.
2. **School B**:
   - `GET /api/v1/subjects`. Verify `MATH-101` from School A is not listed.
   - `POST /api/v1/subjects` with code `MATH-101`. Verify creation **SUCCEEDS** (tenant-scoped `[schoolId, code]`).
   - `DELETE /api/v1/subjects/{subjectId_A}` from School B context. Verify `404 Not Found`.

---

### 3.6 Teacher Assignments Module

#### Workflow Definition
1. **School A**: Assign `Prof. Alan Turing` to `Grade 10 - Section A - MATH-101`. Note `assignmentId_A`.
2. **School B**:
   - `GET /api/v1/teacher-assignments`. Verify assignment is not listed.
   - `DELETE /api/v1/teacher-assignments/{assignmentId_A}` from School B context. Verify `404 Not Found`.

---

### 3.7 Attendance Module

#### Workflow Definition
1. **School A**: Record Attendance for `Grade 10 - Section A` on date `2026-08-03`. Note `attendanceId_A`.
2. **School B**:
   - `GET /api/v1/attendance?date=2026-08-03`. Verify empty array.
   - `GET /api/v1/attendance/{attendanceId_A}` from School B context. Verify `404 Not Found`.
   - `PUT /api/v1/attendance/{attendanceId_A}` from School B context. Verify `404 Not Found`.

---

### 3.8 Homework & Homework Submissions Module

#### Workflow Definition
1. **School A**: Create Homework `Algebra Worksheet 1`. Note `homeworkId_A`. Student A submits homework -> `submissionId_A`.
2. **School B**:
   - `GET /api/v1/homework`. Verify `Algebra Worksheet 1` is not present.
   - `GET /api/v1/homework/{homeworkId_A}` from School B. Verify `404 Not Found`.
   - `GET /api/v1/homework/submissions/{submissionId_A}` from School B. Verify `404 Not Found`.

---

### 3.9 Announcements & Notices Module

#### Workflow Definition
1. **School A**: Publish Notice `Annual Sports Day 2026` and Announcement `Class Test Tomorrow`. Note `noticeId_A`, `announcementId_A`.
2. **School B**:
   - `GET /api/v1/notices` & `GET /api/v1/announcements`. Verify zero items returned from School A.
   - `GET /api/v1/notices/{noticeId_A}` from School B context. Verify `404 Not Found`.

---

### 3.10 Fees Module (Fee Plans, Fee Records, Fee Payments)

#### Workflow Definition
1. **School A**: 
   - Create Fee Plan `Grade 10 Standard` (Rs 1500). Note `feePlanId_A`.
   - Generate Fee Record for `John Doe` for Month `8`, Year `2026`. Note `feeRecordId_A`.
   - Record Fee Payment (Receipt No: `REC-0001`). Note `paymentId_A`.
2. **School B**:
   - `GET /api/v1/fee-plans` & `GET /api/v1/fee-records`. Verify School A financial data is absent.
   - `GET /api/v1/fee-records/{feeRecordId_A}` from School B context. Verify `404 Not Found`.
   - `POST /api/v1/fee-payments` with Receipt No `REC-0001`. Verify **SUCCEEDS** for School B (tenant-scoped receipt numbers `[schoolId, receiptNumber]`).

---

### 3.11 Timetable & Period Master Module

#### Workflow Definition
1. **School A**: Setup Period Master (`Period 1`: `08:00 - 08:45`) and Timetable entry. Note `timetableId_A`.
2. **School B**:
   - `GET /api/v1/period-master` & `GET /api/v1/timetable`. Verify empty/School B schedules only.
   - `DELETE /api/v1/timetable/{timetableId_A}` from School B. Verify `404 Not Found`.

---

### 3.12 Exam, Exam Schedule, Exam Marks Module

#### Workflow Definition
1. **School A**: Create Exam `Mid-Term 2026`, Schedule for `MATH-101`, and enter Exam Marks for `John Doe`. Note `examId_A`, `markId_A`.
2. **School B**:
   - `GET /api/v1/exams` & `GET /api/v1/exams/{examId_A}/marks`. Verify `404 Not Found` or missing data.
   - `PUT /api/v1/exams/marks/{markId_A}` from School B context. Verify `404 Not Found`.

---

### 3.13 Admit Cards & Report Cards & Exam Templates Module

#### Workflow Definition
1. **School A**: 
   - Configure `ExamTemplate` for `ADMIT_CARD` with header `"Alpha Academy Standard Card"`.
   - Generate Admit Card for `John Doe`. Note `admitCardId_A`.
   - Generate Report Card for `John Doe`. Note `reportCardId_A`.
2. **School B**:
   - `GET /api/v1/exam-templates/ADMIT_CARD` from School B context. Verify default or School B template is returned, NOT Alpha Academy's custom template.
   - `GET /api/v1/admit-cards/{admitCardId_A}` & `GET /api/v1/report-cards/{reportCardId_A}` from School B. Verify `404 Not Found`.

---

### 3.14 Username Sequence Generation

#### Workflow Definition
1. **School A**: Create Teacher. Sequence generated: `TCH000001`.
2. **School B**: Create Teacher. Sequence generated: `TCH000001`.
3. **Verification**: Both schools maintain independent counters in `UsernameSequence` table (`@@id([schoolId, prefix])`). School B counter starts from `0` and generates `TCH000001` independently.

---

### 3.15 Storage Architecture Isolation

#### Workflow Definition
1. **School A**: Upload student photo / homework assignment. Target file path generated by `StorageService`:
   `11111111-1111-1111-1111-111111111111/students/1770000000_avatar.jpg`
2. **School B**: Upload student photo. Target file path generated by `StorageService`:
   `22222222-2222-2222-2222-222222222222/students/1770000000_avatar.jpg`
3. **Verification**: Object storage paths strictly begin with `schoolId/category/filename`. Attempting to access cross-tenant storage path from School B API endpoints is blocked.

---

## 4. Cross-Tenant Intrusion Logging & Audit Requirements

Whenever a cross-tenant data access attempt occurs (e.g. valid JWT for School B requesting a resource belonging to School A):
1. The request MUST fail immediately with `404 Not Found` (to avoid leaking resource existence) or `403 Forbidden`.
2. A security incident record MUST be emitted to the system audit logger:
```json
{
  "event": "CROSS_TENANT_ACCESS_ATTEMPT",
  "actorUserId": "usr_beta_admin",
  "actorRole": "ADMIN",
  "authenticatedSchoolId": "22222222-2222-2222-2222-222222222222",
  "targetResourceSchoolId": "11111111-1111-1111-1111-111111111111",
  "resourceType": "Student",
  "resourceId": "studentId_A",
  "ipAddress": "192.168.1.50",
  "userAgent": "Mozilla/5.0 ...",
  "timestamp": "2026-08-03T23:25:00.000Z"
}
```

---

## 5. Quality Gate Criteria

Before Phase 3 sign-off, all test cases in this plan must be verified and passing:
- [ ] Schema migration executed safely without data loss
- [ ] All composite unique constraints verified
- [ ] Auto-scoping Prisma Extension tested against all operations
- [ ] All 19 controllers and services verified against School A vs School B isolation
- [ ] 0 cross-tenant leaks detected
- [ ] `npm run build`, `npx tsc`, `npm run lint` 100% clean
