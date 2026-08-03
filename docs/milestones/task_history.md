# School ERP — Task Management

_Last updated: 2026-07-22_

---

## Completed

### PHASE 1 — Bug Fix: Backend TypeScript Errors
- `fee-record.service.ts`: fixed TS error (`status` enum casting)
- `homework.controller.ts`: fixed TS errors (unused imports, nullability)
- `notice.controller.ts`: fixed TS error (`noticeQuerySchema` parsing)
- `upload.middleware.ts`: fixed TS warnings (prefixed unused params)
- `file.util.ts`: fixed TS error (type error signature)
- `student-portal.controller.ts`: fixed TS error (`req.params.id` string cast)

### PHASE 1 — Bug Fixes (Features & Portals)
- **Bug 6**: Admin Notice Board fixed (`editingNotice` state leak, `keepPreviousData`, query parsing)
- **Bug 7**: Timetable entries fixed (overrideDate ISO format, active session constraint removed)
- **Bug 8**: Teacher Announcements fixed (`sessionId: 'dummy'` resolved to active session)
- **Bug 9**: Teacher Homework fixed (`req.user?.sub` User ID properly resolved to Teacher profile ID)
- **Bug 10**: Teacher Dashboard fixed (`fetchAnnouncements` object properly parsed as array)
- **Bug 11**: Teacher Exams page freeze fixed (`examId: 'none'` filtered out before API / Prisma query)

### PHASE 2 — Performance & Optimization
- **Task 2.1**: Global QueryClient configuration (staleTime 5m, retry 1, refetchOnWindowFocus false) ✅
- **Task 2.2**: Replace `include()` with `select()` across backend services for lean payloads ✅
- **Task 2.3**: `Promise.all()` for independent database & dashboard queries ✅
- **Task 2.4**: Prisma query logging in development mode ✅

---

### PHASE 3 — Exams & Results Module Complete Architecture Redesign
- **Task 3.1 — Common Entry**: Session → Class navigation across Admin, Teacher, and Student portals. Automatically includes ALL students from every section of the selected class (no section selection required) ✅
- **Task 3.2 — Admin Portal**: Timetable creation with auto-calculated Day from Date string, student status list with default `Hold`/`Release` based on fee clearance, Admin override, and custom remarks ✅
- **Task 3.3 — Teacher Portal**: Read-only timetable (Date/Time locked), subject filtering, admit card recommendation (Admin override retained), and Marks management in **Subjects** view (Max Marks at top) & **Students** view (per-subject % and overall %) ✅
- **Task 3.4 — Student Portal**: Gated access for Admit Cards & Results based on Admin release, teacher recommendation, and fee clearance. Displays exact Hold reasons when withheld, and provides dynamic PDF preview/printing when released ✅
- **Task 3.5 — Editable Templates**: Created `AdmitCardModal`, `ResultCardModal`, and `ExamTemplateModal` supporting configurable School Name, Logo, Signature, Stamp, and dynamic PDF generation ✅

---

### PHASE 4 — Complete Homework Management
- **Task 4.1**: Fix Teacher Homework Creation (Teacher profile ID resolution & upload) ✅
- **Task 4.2**: Add Edit, Delete, Publish, and Draft controls for Teacher Homework ✅
- **Task 4.3**: PDF upload / replace / download functionality for attachments ✅
- **Task 4.4**: Student Homework View & Submission Flow ✅

---

### PHASE 5 & 6 — Fee Module Architecture Redesign
- **Task 6.1 — Class Filter & Auto Monthly Fee**: Class-only filter (no section filter) listing all students, calculating current total fee strictly up to the current month in the academic year ✅
- **Task 6.2 — Timeline & May Vacation**: 12-month academic timeline (Apr–Mar) displaying May as `Vacation (No Fee)`, paid months with `✓`, and pending months as blank ✅
- **Task 6.3 — Mandatory Unique Receipt Number & Balance**: Enforced mandatory and unique `receiptNumber` validation with duplicate conflict error. Allocated payments to earliest pending month and saved remaining overpayment to `advanceBalance` ✅
- **Task 6.4 — Fee Profile**: Detailed modal with fee structure, current total fee, paid, pending, advance balance, timeline, payment history, and receipt history ✅

---

## In Progress

- All requested workflow redesigns completed & verified. Continuous stability & regression testing.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| All monetary values stored in paise | Avoids floating-point precision issues |
| Soft delete pattern (isDeleted + deletedAt) | Preserves audit trail; allows recovery |
| Class selection includes all sections | Matches school administrative workflow for exams and fees |
| Admin retains final release authority | Teachers manage marks & recommendations; Admin controls official release |
| Dynamic PDF generation from DB templates | Avoids static file storage overhead; allows dynamic template updates |
| Mandatory unique receipt numbers | Ensures audit compliance and prevents double-entry of payments |
