# CURRENT TASK — Live Engineering Handoff

---

## Current Milestone
Milestone 4: Operations & Portals

## Current Checkpoint
Checkpoint 4.4: Noticeboard & Announcements (completing), then 4.5, 4.6

## Current Micro-Checkpoint
MC-1: Create notice.routes.ts — IN PROGRESS

## Current File
`backend/src/routes/notice.routes.ts`

---

## Completed Work

### Backend
- ✅ Prisma schema: Notice model, AccountAuditLog model, UsernameSequence, AccountAuditAction enum
- ✅ Migration: 20260704184634_add_noticeboard (Notice), 20260705172455_account_lifecycle (Account)
- ✅ `backend/src/validators/notice.validator.ts` — CreateNoticeInput, UpdateNoticeInput, NoticeQueryInput
- ✅ `backend/src/services/notice.service.ts` — Full CRUD (create, getNotices, getNoticeById, updateNotice, deleteNotice)
- ✅ `backend/src/controllers/notice.controller.ts` — Full CRUD controller methods using `req.user!.sub`
- ✅ `backend/src/validators/account.validator.ts` — Account action schema
- ✅ `backend/src/services/account.service.ts` — Full lifecycle (createUser, resetPassword, reissueCredentials, activate, suspend, disable, unlock, forcePasswordChange, changePassword, getAccountDetails)
- ✅ `backend/src/controllers/account.controller.ts` — All account action handlers
- ✅ `backend/src/routes/account.routes.ts` — All account routes mounted, authenticated, ADMIN-only
- ✅ Routes/index.ts — account routes wired
- ✅ auth.service.ts — updated for mustChangePassword, failedLoginAttempts, lockedUntil
- ✅ auth.controller.ts — updated for mustChangePassword
- ✅ teacher.service.ts — createUserForTeacher called on create
- ✅ student.service.ts — createUserForStudent called on create
- ✅ Backend build: ✅ PASSING
- ✅ Backend lint: ✅ PASSING

### Frontend
- ✅ `frontend/src/features/admin/accounts/api.ts` — All account API calls
- ✅ `frontend/src/features/admin/accounts/ChangePasswordPage.tsx` — Self-service change password
- ✅ `frontend/src/features/admin/accounts/components/AccountManagementCard.tsx` — Admin account management
- ✅ `frontend/src/features/admin/accounts/components/CredentialDisplayDialog.tsx` — One-time credential display
- ✅ `frontend/src/features/admin/teachers/TeacherDetailPage.tsx` — Teacher detail with AccountManagementCard
- ✅ `frontend/src/features/admin/students/StudentDetailPage.tsx` — Student detail with AccountManagementCard
- ✅ App.tsx — teacher/:id and student/:id routes + /change-password route
- ✅ `frontend/src/features/admin/notices/api.ts` — Notice API frontend service
- ✅ `frontend/src/features/admin/notices/NoticesPage.tsx` — NoticePage component
- ✅ `frontend/src/features/admin/notices/components/NoticeForm.tsx` — NoticeForm component
- ✅ App.tsx & AdminLayout.tsx — Wired Notice routes and sidebar link
- ✅ Frontend build: ✅ PASSING

---

## Current Work
Checkpoint 4.5: Events & School Calendar (Schema & Backend setup)

---

## Remaining Work

### Backend (immediate)
- [ ] MC-1: Prisma Schema for Event & School Calendar
- [ ] MC-2: Prisma Migration
- [ ] MC-3: Event Validators (`event.validator.ts`)
- [ ] MC-4: Event Service (`event.service.ts`)
- [ ] MC-5: Event Controller (`event.controller.ts`)
- [ ] MC-6: Event Routes (`event.routes.ts`) and wire into index
- [ ] MC-7: Backend build + lint → commit

### Frontend (upcoming)
- [ ] MC-8: Event API frontend service
- [ ] MC-9: EventsPage & EventForm components
- [ ] MC-10: Wire Event into App.tsx & AdminLayout
- [ ] MC-11: Frontend build + lint → commit

### After Events
- [ ] Checkpoint 4.6: Dashboard Statistics & Widgets (StatsService → API → updated AdminDashboard)

---

## Next File
`backend/src/routes/notice.routes.ts`

---

## Known Issues
- None currently. Backend + frontend builds passing.

## Build Status
- Backend: ✅ PASSING (tsc, no errors)
- Frontend: ✅ PASSING (tsc + vite build)

## Lint Status
- Needs verification post notice routes addition

## Git Status
- All account management work uncommitted (many modified/untracked files)
- Last commit: ddda388 docs: complete milestone 4.2 attendance management

---

*Updated: 2026-07-05 — Session resumption after checkpoint 4.2 completion*
