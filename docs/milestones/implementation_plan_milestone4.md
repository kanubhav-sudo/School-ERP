# Milestone 4: Operations & Daily School Management
## (Revised — Architectural Review Applied)

---

## Checkpoint Order (Revised)

| # | Checkpoint | Rationale |
|---|---|---|
| 4.1 | Timetable Management | Foundation — attendance depends on class/section/teacher/period context |
| 4.2 | Attendance Management | Builds on timetable; references Teacher, Student, Section |
| 4.3 | Homework & Assignments | Depends on Class/Section/Subject already defined |
| 4.4 | Noticeboard & Announcements | Standalone — no feature dependencies |
| 4.5 | Events & School Calendar | Extends noticeboard concept with scheduling |
| 4.6 | Dashboard Statistics & Widgets | Requires data from all above features |

---

## Architectural Standards Applied to ALL New Models

### Audit Fields (every new table)
```prisma
createdById String?   @map("created_by_id") @db.Uuid   // req.user.sub
updatedById String?   @map("updated_by_id") @db.Uuid   // req.user.sub
```

### Soft Delete (every new table)
```prisma
isDeleted   Boolean   @default(false) @map("is_deleted")
deletedAt   DateTime? @map("deleted_at")
deletedById String?   @map("deleted_by_id") @db.Uuid
```

> All service queries default to `where: { isDeleted: false }`.
> Audit IDs are plain UUID fields — no Prisma relation — populated from `req.user.sub`.

---

## Checkpoint 4.1 — Timetable Management

### Schema

```prisma
enum DayOfWeek {
  MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY
}

model Timetable {
  id           String    @id @default(uuid()) @db.Uuid
  sessionId    String    @map("session_id") @db.Uuid
  classId      String    @map("class_id") @db.Uuid
  sectionId    String    @map("section_id") @db.Uuid
  teacherId    String    @map("teacher_id") @db.Uuid
  subjectId    String    @map("subject_id") @db.Uuid
  dayOfWeek    DayOfWeek @map("day_of_week")
  periodNumber Int       @map("period_number")  // 1–10
  startTime    String    @map("start_time")     // "HH:MM"
  endTime      String    @map("end_time")       // "HH:MM"
  room         String?
  // Audit
  createdById  String?   @map("created_by_id") @db.Uuid
  updatedById  String?   @map("updated_by_id") @db.Uuid
  // Soft delete
  isDeleted    Boolean   @default(false) @map("is_deleted")
  deletedAt    DateTime? @map("deleted_at")
  deletedById  String?   @map("deleted_by_id") @db.Uuid
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  session  AcademicSession @relation(fields: [sessionId], references: [id])
  class    Class           @relation(fields: [classId], references: [id])
  section  Section         @relation(fields: [sectionId], references: [id])
  teacher  Teacher         @relation(fields: [teacherId], references: [id])
  subject  Subject         @relation(fields: [subjectId], references: [id])

  // Prevents double-booking:
  @@unique([sectionId, dayOfWeek, periodNumber])   // section slot uniqueness
  @@unique([teacherId, dayOfWeek, periodNumber])   // teacher can't be in 2 places
  @@unique([room, dayOfWeek, periodNumber])        // room clash prevention (nullable)
  @@index([sessionId])
  @@index([sectionId])
  @@index([teacherId])
  @@index([isDeleted])
  @@map("timetables")
}
```

### Backend Files
- `validators/timetable.validator.ts`
- `services/timetable.service.ts` (validation: double-booking, overlaps, active session)
- `controllers/timetable.controller.ts`
- `routes/timetable.routes.ts`
- modify `routes/index.ts`

### Frontend Files
- `features/admin/timetable/api.ts`
- `features/admin/timetable/TimetablePage.tsx`
- `features/admin/timetable/components/TimetableGrid.tsx`
- modify `AdminLayout.tsx`, `App.tsx`

---

## Checkpoint 4.2 — Attendance Management

### Schema (future-proof for period-wise attendance)

```prisma
enum AttendanceStatus {
  PRESENT ABSENT LATE HALF_DAY MEDICAL_LEAVE APPROVED_LEAVE
}

model AttendanceRecord {
  id         String           @id @default(uuid()) @db.Uuid
  studentId  String           @map("student_id") @db.Uuid
  teacherId  String           @map("teacher_id") @db.Uuid  // who marked it
  sessionId  String           @map("session_id") @db.Uuid
  classId    String           @map("class_id") @db.Uuid
  sectionId  String           @map("section_id") @db.Uuid
  // Future-proof: timetableId can link to a specific period without redesign
  timetableId String?         @map("timetable_id") @db.Uuid
  date       DateTime         @db.Date
  status     AttendanceStatus
  remarks    String?
  // Audit
  createdById String?         @map("created_by_id") @db.Uuid
  updatedById String?         @map("updated_by_id") @db.Uuid
  // Soft delete
  isDeleted  Boolean          @default(false) @map("is_deleted")
  deletedAt  DateTime?        @map("deleted_at")
  deletedById String?         @map("deleted_by_id") @db.Uuid
  createdAt  DateTime         @default(now()) @map("created_at")
  updatedAt  DateTime         @updatedAt @map("updated_at")

  student   Student         @relation(fields: [studentId], references: [id])
  teacher   Teacher         @relation(fields: [teacherId], references: [id])
  session   AcademicSession @relation(fields: [sessionId], references: [id])
  class     Class           @relation(fields: [classId], references: [id])
  section   Section         @relation(fields: [sectionId], references: [id])
  timetable Timetable?      @relation(fields: [timetableId], references: [id])

  @@unique([studentId, date])   // one daily record per student
  @@index([date])
  @@index([sectionId])
  @@index([sessionId])
  @@index([isDeleted])
  @@map("attendance_records")
}
```

---

## Checkpoint 4.3 — Homework & Assignments

```prisma
model Homework {
  id            String   @id @default(uuid()) @db.Uuid
  title         String
  description   String?
  dueDate       DateTime @map("due_date") @db.Date
  sessionId     String   @map("session_id") @db.Uuid
  classId       String   @map("class_id") @db.Uuid
  sectionId     String?  @map("section_id") @db.Uuid  // null = entire class
  subjectId     String   @map("subject_id") @db.Uuid
  teacherId     String   @map("teacher_id") @db.Uuid
  attachmentUrl String?  @map("attachment_url")  // storage-agnostic placeholder
  isPublished   Boolean  @default(true) @map("is_published")
  // Audit + soft delete (standard pattern)
  ...
}
```

---

## Checkpoint 4.4 — Noticeboard & Announcements

```prisma
model Notice {
  id          String    @id @default(uuid()) @db.Uuid
  title       String
  body        String
  authorId    String    @map("author_id") @db.Uuid  // User.id
  isPinned    Boolean   @default(false) @map("is_pinned")
  publishedAt DateTime? @map("published_at")
  expiresAt   DateTime? @map("expires_at")
  // Audit + soft delete (standard)
  ...
  targets     NoticeTarget[]
}

// Proper relational join table (no comma-separated strings)
model NoticeTarget {
  noticeId String @map("notice_id") @db.Uuid
  role     Role

  notice Notice @relation(fields: [noticeId], references: [id], onDelete: Cascade)

  @@id([noticeId, role])
  @@map("notice_targets")
}
```

---

## Checkpoint 4.5 — Events & School Calendar

```prisma
enum EventType {
  HOLIDAY EXAM FUNCTION MEETING OTHER
}

model SchoolEvent {
  id               String    @id @default(uuid()) @db.Uuid
  title            String
  description      String?
  eventType        EventType @map("event_type")
  startDate        DateTime  @map("start_date") @db.Date
  endDate          DateTime  @map("end_date") @db.Date
  isAllDay         Boolean   @default(true) @map("is_all_day")
  // Future recurring events: these nullable fields allow adding
  // RecurrenceRule without redesigning this table
  recurrenceRule   String?   @map("recurrence_rule")   // RRULE string (RFC 5545)
  recurrenceEnd    DateTime? @map("recurrence_end")
  createdByUserId  String    @map("created_by_user_id") @db.Uuid
  // Audit + soft delete (standard)
  ...
  targets          EventTarget[]
}

model EventTarget {
  eventId String @map("event_id") @db.Uuid
  role    Role
  event   SchoolEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  @@id([eventId, role])
  @@map("event_targets")
}
```

---

## Checkpoint 4.6 — Dashboard Statistics & Widgets

### Backend Architecture
```
GET /api/v1/stats/overview
  → StatsController.getOverview()
    → StatsService.getOverviewStats()   ← ALL aggregation here, never in controller
```

`stats.service.ts` returns:
```ts
{
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSections: number
  todayAttendanceRate: number     // percentage 0–100
  recentNotices: Notice[]         // last 5
  upcomingEvents: SchoolEvent[]   // next 5
}
```

---

## Engineering Workflow (Per Checkpoint)

```
Schema → Migration → Validator → Service → Controller → Routes → Wire Router
→ Frontend API → Page → Components → AdminLayout → App.tsx
→ npm run build (backend) → npm run lint (backend)
→ npm run build (frontend) → npm run lint (frontend)
→ Manual curl/browser test
→ Update task.md + walkthrough.md + CHECKPOINTS.md + MILESTONES.md + CHANGELOG.md + .project/*
→ git add → git commit → git push → verify push
→ Next checkpoint
```
