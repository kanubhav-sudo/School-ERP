# Implementation Plan 4.3: Noticeboards & Announcements

## Objective
Implement a centralized noticeboard system where administrators and teachers can post announcements targeted by role or class, with support for priorities, scheduling, and expiration dates.

## Database Schema (`schema.prisma`)
- **Enums**: Add `NoticePriority` (`LOW`, `MEDIUM`, `HIGH`).
- **Models**: Add `Notice` model.
  - `id`: UUID.
  - `title`: String.
  - `content`: Text (string).
  - `priority`: `NoticePriority`.
  - `targetRoles`: `Role[]` (empty implies all roles).
  - `targetClassIds`: `String[]` (array of Class UUIDs).
  - `publishedAt`: DateTime.
  - `expiresAt`: DateTime (optional).
  - `authorId`: User relation.
  - `attachments`: `String[]`.
  - Standard audit and soft-delete fields.

## Backend APIs
- **Validator**: `notice.validator.ts`
  - `createNoticeSchema`, `updateNoticeSchema`, `noticeQuerySchema`.
- **Service**: `notice.service.ts`
  - `createNotice`, `getNotices`, `getNoticeById`, `updateNotice`, `deleteNotice`.
- **Controller**: `notice.controller.ts`
  - Standard wrapper for service methods.
- **Routes**: `notice.routes.ts`
  - Full CRUD operations. Mounted under `/api/v1/notices`.

## Frontend UI
- **API File**: `features/admin/notices/api.ts`.
- **UI Components**:
  - `NoticesPage.tsx`: DataTable/Grid for listing notices.
  - `NoticeForm.tsx`: Form for creating and editing notices (supports selecting targets and dates).
- **Routing & Navigation**: Add to Admin sidebar under Operations -> Noticeboard.
