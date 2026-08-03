# Milestone 5 — Finance & Fee Management
## Permanent Engineering Reference Document

**Version**: 1.0.0
**Created**: 2026-07-13
**Status**: ACTIVE — Implementation in Progress

---

## 1. Overall Objective

Milestone 5 implements the **Finance & Fee Management** module.

| Part | Feature | Status |
|------|---------|--------|
| Part 1 | Fee Plan Management (Standard Monthly, Sibling Discount) | In Scope |
| Part 2 | Student Fee Plan Assignment | In Scope |
| Part 3 | Monthly Fee Records | In Scope |
| Part 4 | Admin Dashboard Finance Widget | In Scope |
| Part 5 | Future Architecture Design | Schema Only |

Out of Scope: online payment, auto fee generation, PDF receipts, partial payment UI, reports, notifications.

---

## 2. Architecture Overview

Backend: Validator → Service → Controller → Routes (unchanged pattern)
Frontend: TanStack Query + React Hook Form + Zod + shadcn/ui (unchanged pattern)

### New Backend Files
- validators/fee-plan.validator.ts
- validators/fee-record.validator.ts
- services/fee-plan.service.ts
- services/fee-record.service.ts
- services/dashboard.service.ts
- controllers/fee-plan.controller.ts
- controllers/fee-record.controller.ts
- controllers/dashboard.controller.ts
- routes/fee-plan.routes.ts
- routes/fee-record.routes.ts
- routes/dashboard.routes.ts
- routes/index.ts (MODIFY)

### Modified Backend Files
- validators/student.validator.ts (add feePlanId, siblingStudentId)
- services/student.service.ts (add feePlanId, siblingStudentId to select/CRUD)

### New Frontend Files
- features/admin/fee-plans/api.ts
- features/admin/fee-plans/FeePlansPage.tsx
- features/admin/fee-plans/components/FeePlanForm.tsx
- features/admin/fee-records/api.ts
- features/admin/fee-records/FeeRecordsPage.tsx
- features/admin/fee-records/components/FeeRecordDetail.tsx
- features/admin/fee-records/components/RecordPaymentDialog.tsx
- features/admin/dashboard/components/FinanceWidget.tsx

### Modified Frontend Files
- features/admin/dashboard/AdminDashboard.tsx
- features/admin/students/api.ts
- features/admin/students/StudentsPage.tsx
- features/admin/students/components/StudentForm.tsx
- App.tsx
- components/layout/AdminLayout.tsx

---

## 3. Database Design

### 3.1 Design Principles
- All monetary values stored as **integers in paise** (1 INR = 100 paise). Eliminates float rounding errors.
- Fee plans extensible via `type` enum — new types added without schema redesign.
- Fee records are immutable audit entries — only status transitions allowed.
- All tables: UUID PKs, snake_case DB columns, camelCase Prisma fields, soft-delete where applicable.

### 3.2 New Enums

```prisma
enum FeePlanType {
  STANDARD_MONTHLY
  SIBLING_DISCOUNT
}

enum FeeRecordStatus {
  PENDING
  PAID
  PARTIAL
  WAIVED
  OVERDUE
}

enum PaymentMode {
  CASH
  BANK_TRANSFER
  CHEQUE
  ONLINE
}
```

### 3.3 FeePlan Model

```prisma
model FeePlan {
  id              String      @id @default(uuid()) @db.Uuid
  name            String
  type            FeePlanType
  sessionId       String      @map("session_id") @db.Uuid
  classId         String      @map("class_id") @db.Uuid
  monthlyAmount   Int         @map("monthly_amount")       // paise
  discountAmount  Int         @default(0) @map("discount_amount") // paise
  discountPercent Int         @default(0) @map("discount_percent")
  description     String?
  isActive        Boolean     @default(true) @map("is_active")
  createdById     String?     @map("created_by_id") @db.Uuid
  updatedById     String?     @map("updated_by_id") @db.Uuid
  isDeleted       Boolean     @default(false) @map("is_deleted")
  deletedAt       DateTime?   @map("deleted_at")
  deletedById     String?     @map("deleted_by_id") @db.Uuid
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  session     AcademicSession @relation(fields: [sessionId], references: [id])
  class       Class           @relation(fields: [classId], references: [id])
  students    Student[]
  feeRecords  FeeRecord[]

  @@unique([name, sessionId, classId])
  @@index([sessionId])
  @@index([classId])
  @@index([type])
  @@index([isActive])
  @@index([isDeleted])
  @@map("fee_plans")
}
```

### 3.4 Student Model Additions

```prisma
// Add to Student model:
feePlanId         String?   @map("fee_plan_id") @db.Uuid
siblingStudentId  String?   @map("sibling_student_id") @db.Uuid

feePlan    FeePlan?  @relation(fields: [feePlanId], references: [id])
sibling    Student?  @relation("SiblingRelation", fields: [siblingStudentId], references: [id])
siblingOf  Student[] @relation("SiblingRelation")
feeRecords FeeRecord[]
```

### 3.5 FeeRecord Model

```prisma
model FeeRecord {
  id              String          @id @default(uuid()) @db.Uuid
  studentId       String          @map("student_id") @db.Uuid
  feePlanId       String          @map("fee_plan_id") @db.Uuid
  sessionId       String          @map("session_id") @db.Uuid
  classId         String          @map("class_id") @db.Uuid
  month           Int
  year            Int
  monthlyAmount   Int             @map("monthly_amount")     // paise
  discountAmount  Int             @default(0) @map("discount_amount")
  lateFine        Int             @default(0) @map("late_fine")
  netAmount       Int             @map("net_amount")          // monthlyAmount - discount + lateFine
  paidAmount      Int             @default(0) @map("paid_amount")
  balanceAmount   Int             @map("balance_amount")      // netAmount - paidAmount
  status          FeeRecordStatus @default(PENDING)
  dueDate         DateTime?       @map("due_date") @db.Date
  lastPaymentDate DateTime?       @map("last_payment_date") @db.Date
  lastPaymentMode PaymentMode?    @map("last_payment_mode")
  receiptNumber   String?         @map("receipt_number")
  remarks         String?
  createdById     String?         @map("created_by_id") @db.Uuid
  updatedById     String?         @map("updated_by_id") @db.Uuid
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  student  Student         @relation(fields: [studentId], references: [id])
  feePlan  FeePlan         @relation(fields: [feePlanId], references: [id])
  session  AcademicSession @relation(fields: [sessionId], references: [id])
  class    Class           @relation(fields: [classId], references: [id])
  payments FeePayment[]

  @@unique([studentId, month, year, sessionId])
  @@index([studentId])
  @@index([sessionId])
  @@index([classId])
  @@index([status])
  @@index([month, year])
  @@map("fee_records")
}
```

### 3.6 FeePayment Model (Schema Only — Future Implementation)

```prisma
model FeePayment {
  id             String      @id @default(uuid()) @db.Uuid
  feeRecordId    String      @map("fee_record_id") @db.Uuid
  amount         Int
  paymentDate    DateTime    @map("payment_date") @db.Date
  paymentMode    PaymentMode @map("payment_mode")
  receiptNumber  String?     @map("receipt_number")
  transactionRef String?     @map("transaction_ref")
  remarks        String?
  collectedById  String?     @map("collected_by_id") @db.Uuid
  createdAt      DateTime    @default(now()) @map("created_at")

  feeRecord FeeRecord @relation(fields: [feeRecordId], references: [id])

  @@index([feeRecordId])
  @@index([paymentDate])
  @@map("fee_payments")
}
```

### 3.7 FeeReminderRule Model (Schema Only — Future Implementation)

```prisma
model FeeReminderRule {
  id         String   @id @default(uuid()) @db.Uuid
  sessionId  String   @map("session_id") @db.Uuid
  name       String
  daysOffset Int      @map("days_offset")  // negative=before, 0=due date, positive=after
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("fee_reminder_rules")
}
```

### 3.8 Existing Models — New Relations

- AcademicSession: add `feePlans FeePlan[]`, `feeRecords FeeRecord[]`
- Class: add `feePlans FeePlan[]`, `feeRecords FeeRecord[]`

---

## 4. Backend Implementation Order

### [x] **MC-1**: Prisma Schema & Migrations
- [x] **MC-2**: Fee Plan Backend CRUD
- [x] **MC-3**: Student Model & Fee Assignment Workflow (Backend + UI)
- [ ] **MC-4**: Fee Record Backend Generation & Payments
- [ ] **MC-5**: Dashboard Stats Backend

1. Add enums: FeePlanType, FeeRecordStatus, PaymentMode
2. Add FeePlan model
3. Add FeeRecord model
4. Add FeePayment model (schema only)
5. Add FeeReminderRule model (schema only)
6. Modify Student model: add feePlanId, siblingStudentId, self-relation
7. Add inverse relations to AcademicSession, Class
8. Run: npx prisma migrate dev --name add_finance_module
9. Run: npx prisma generate
10. Verify: npm run build

### MC-2: Fee Plan Backend
Files: fee-plan.validator.ts, fee-plan.service.ts, fee-plan.controller.ts, fee-plan.routes.ts, routes/index.ts

Validator schemas:
- CreateFeePlanInput: name, type, sessionId, classId, monthlyAmount (rupees → paise in service), discountAmount?, discountPercent?, description?, isActive?
- UpdateFeePlanInput: all optional
- ListFeePlansInput: page, limit, sessionId?, classId?, type?, isActive?

Service functions:
- listFeePlans(filters) — paginated, filtered, excludes isDeleted
- getFeePlanById(id) — NotFoundError if not found
- createFeePlan(data, actorId) — ConflictError on duplicate name+session+class
- updateFeePlan(id, data, actorId) — validate not deleted
- deleteFeePlan(id, actorId) — soft delete; ConflictError if active students assigned

Routes: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id
Security: authenticate + authorize([Role.ADMIN]) on all routes

### MC-3: Student Model Modifications (Backend)
Files: student.validator.ts (MODIFY), student.service.ts (MODIFY)

Validator:
- Add feePlanId?: z.string().uuid().optional()
- Add siblingStudentId?: z.string().uuid().optional()

Service:
- Add feePlanId, siblingStudentId to studentSelect (include feePlan: {id, name, type, monthlyAmount})
- Add to createStudent data mapping
- Add to updateStudent data mapping
- Validate: if siblingStudentId provided, must not equal studentId

### MC-4: Fee Record Backend
Files: fee-record.validator.ts, fee-record.service.ts, fee-record.controller.ts, fee-record.routes.ts, routes/index.ts

Business logic (service):
  netAmount = monthlyAmount - discountAmount + lateFine
  balanceAmount = netAmount - paidAmount
  status = paidAmount === 0 ? PENDING : paidAmount >= netAmount ? PAID : PARTIAL

Dashboard stats logic:
  PAID: SUM(paidAmount) WHERE status=PAID AND month=M AND year=Y AND sessionId=S
  PENDING: SUM(balanceAmount) WHERE status IN (PENDING,PARTIAL,OVERDUE) AND (year < Y OR (year=Y AND month <= M)) AND sessionId=S

Routes:
- GET /fee-records
- GET /fee-records/:id
- POST /fee-records
- PATCH /fee-records/:id/payment
- GET /fee-records/dashboard/stats

### MC-5: Dashboard Stats Backend
Files: dashboard.service.ts, dashboard.controller.ts, dashboard.routes.ts, routes/index.ts

Endpoint: GET /dashboard/stats/finance?type=PAID|PENDING&month=7&year=2025&sessionId=<uuid>

---

## 5. Frontend Implementation Order

### MC-6: Fee Plans UI
Files: fee-plans/api.ts, FeePlansPage.tsx, components/FeePlanForm.tsx

Key features:
- DataTable: Name, Type, Class, Session, Monthly Amount (₹), Status, Actions
- FeePlanForm: all fields, Zod validation
- All amounts formatted: Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'})

### MC-7: Student Fee Assignment UI
Files: students/api.ts (MODIFY), StudentsPage.tsx (MODIFY), components/StudentForm.tsx (MODIFY)

- Add Fee Plan column to Students DataTable
- Add Fee & Finance section to StudentForm
- Fee Plan dropdown filtered by selected session/class
- When SIBLING_DISCOUNT selected: show Sibling Student combobox (searchable, existing students only)
- Frontend validation: cannot select self as sibling

### MC-8: Fee Records UI
Files: fee-records/api.ts, FeeRecordsPage.tsx, components/FeeRecordDetail.tsx, components/RecordPaymentDialog.tsx

- DataTable with status badges (PENDING=yellow, PAID=green, PARTIAL=blue, OVERDUE=red, WAIVED=gray)
- RecordPaymentDialog: amount, mode, date, remarks
- All monetary values in ₹

### MC-9: Admin Dashboard Finance Widget
Files: dashboard/components/FinanceWidget.tsx (NEW), dashboard/AdminDashboard.tsx (MODIFY)

Widget layout:
- Dropdown 1: Total Paid | Total Pending
- Dropdown 2: Month (default: current month)
- Dropdown 3: Session (default: active session)
- Large ₹ value display
- Loading skeleton, error state

### MC-10: Routing & Navigation
Files: App.tsx (MODIFY), AdminLayout.tsx (MODIFY)

Sidebar Finance section:
- Fee Plans → /admin/finance/fee-plans
- Fee Records → /admin/finance/fee-records

---

## 6. Engineering Decisions

### Paise Storage
Store all monetary values as integers (paise). 1 INR = 100 paise.
Input: admin types rupees → service multiplies by 100 → DB stores paise.
Output: API returns paise → frontend divides by 100 for display.
Rationale: Eliminates floating-point rounding errors.

### Extensible Fee Plan Types
FeePlanType enum — new types added without schema redesign.
Future types: SCHOLARSHIP_DISCOUNT, TRANSPORT_FEE, HOSTEL_FEE, LATE_ADMISSION_FEE.

### On-Demand Fee Record Creation
Fee records created by admin manually (no cron job in this milestone).
Schema supports auto-generation — cron job added in future milestone.

### Sibling Relationship
Single FK on Student (siblingStudentId) — not a join table.
Rationale: Current requirement is one-to-one discount reference. Join table added later if many-to-many needed.

### Cumulative Pending Calculation
Total Pending = SUM of balanceAmount for ALL unpaid records up to selected month.
Includes previous months. SQL: month <= M AND year <= Y.

### Soft Delete on FeePlan
Historical fee records reference fee plans. Soft delete preserves referential integrity.

---

## 7. Future Expansion Architecture

- Auto Monthly Fee Generation: node-cron job on 1st of month, creates FeeRecord per student
- Late Fine Rules: FeeReminderRule model + daily cron, uses lateFine field on FeeRecord
- Fee Receipts & PDF: puppeteer/pdfkit, receiptNumber field already on FeeRecord
- Partial Payments: FeePayment model already designed, POST /fee-records/:id/payments
- Reminder Notifications: FeeReminderRule daysOffset triggers, integrates with Notification system
- Parent/Student Portal: GET /students/:studentId/fee-records (RBAC already supports this)
- Finance Reports: aggregation queries on FeeRecord
- Online Payment: PaymentMode.ONLINE + Razorpay/Stripe + transactionRef on FeePayment

---

## 8. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Prisma migration fails (FK constraints) | Medium | Test on clean DB; use onDelete: Restrict |
| Student model changes break existing CRUD | High | Run full build after each modification |
| Dashboard stats slow on large datasets | Low | Compound indexes on (sessionId, month, year, status) |
| Sibling self-relation Prisma infinite loop | Medium | Named relation: @relation("SiblingRelation") |
| FeePlan deletion with assigned students | High | Check for assigned students; return 409 |
| Integer overflow in paise | Very Low | 2^31 paise = ~₹210M per record. Safe. |
| Missing inverse relations in schema | High | Declare both sides of every relation |

---

## 9. Verification Strategy

After each MC:
1. npm run build (backend) — zero errors
2. npm run build (frontend) — zero errors
3. npm run lint (backend) — zero errors
4. npm run lint (frontend) — zero errors
5. Manual verification as specified

---

## 10. Git Workflow

```
git add .
git commit -m "feat(finance): <MC description> (MC-N)"
git push origin main
git log --oneline -3
```

Commit messages:
- feat(finance): add fee plan prisma schema and migration (MC-1)
- feat(finance): implement fee plan CRUD backend (MC-2)
- feat(finance): add fee plan assignment to student model (MC-3)
- feat(finance): implement fee record backend with payment API (MC-4)
- feat(finance): add dashboard finance stats endpoint (MC-5)
- feat(finance): implement fee plans management UI (MC-6)
- feat(finance): add fee plan assignment to student management (MC-7)
- feat(finance): implement fee records management UI (MC-8)
- feat(finance): add interactive finance widget to admin dashboard (MC-9)
- feat(finance): wire fee management routing and navigation (MC-10)
- docs(finance): update milestone 5 documentation (final)

---

## 11. Micro-Checkpoints Summary

| MC | Objective | Files |
|----|-----------|-------|
| MC-1 | Prisma schema + migration | schema.prisma |
| MC-2 | Fee Plan CRUD backend | fee-plan.{validator,service,controller,routes}.ts |
| MC-3 | Student model modifications | student.{validator,service}.ts |
| MC-4 | Fee Record backend + payment | fee-record.{validator,service,controller,routes}.ts |
| MC-5 | Dashboard stats backend | dashboard.{service,controller,routes}.ts |
| MC-6 | Fee Plans UI | fee-plans/{api,FeePlansPage,FeePlanForm}.ts(x) |
| MC-7 | Student fee assignment UI | students/{api,StudentsPage,StudentForm} |
| MC-8 | Fee Records UI | fee-records/{api,FeeRecordsPage,FeeRecordDetail,RecordPaymentDialog} |
| MC-9 | Dashboard Finance Widget | FinanceWidget.tsx, AdminDashboard.tsx |
| MC-10 | Routing + Navigation + Docs | App.tsx, AdminLayout.tsx, all docs |

---

## 12. Completion Criteria

### Backend
- [ ] Migration add_finance_module applied
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] Fee Plan CRUD API /api/v1/fee-plans working
- [ ] Student API updated with fee plan fields
- [ ] Fee Record API /api/v1/fee-records working
- [ ] Payment recording PATCH /fee-records/:id/payment working
- [ ] Dashboard stats /api/v1/dashboard/stats/finance working

### Frontend
- [ ] npm run build passes
- [ ] Fee Plans page CRUD functional
- [ ] All monetary values in ₹ (Indian format)
- [ ] Students page: Fee Plan column visible
- [ ] Student form: Fee Plan dropdown + conditional Sibling field
- [ ] Self-reference validation working
- [ ] Fee Records page functional
- [ ] Payment dialog functional
- [ ] Dashboard Finance Widget with 3 dropdowns
- [ ] Finance sidebar section (Fee Plans + Fee Records)

### Documentation
- [ ] task.md updated
- [ ] walkthrough.md updated
- [ ] CHECKPOINTS.md updated
- [ ] MILESTONES.md updated
- [ ] CHANGE_LOG.md updated
- [ ] .project/CURRENT_PROGRESS.md updated
- [ ] .project/CURRENT_TASK.md updated

### Git
- [ ] All 10 MC commits on main
- [ ] No uncommitted changes

---

*Last updated: 2026-07-13*
*Every future AI session MUST read this document before writing Finance module code.*
