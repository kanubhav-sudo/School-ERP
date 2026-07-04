# Database Conventions

This document defines the strict conventions for database design, Prisma schema layout, and migration management.

## 1. Naming Conventions
- **Models**: PascalCase, singular (e.g., `User`, `StudentProfile`, `AcademicSession`).
- **Fields**: camelCase (e.g., `firstName`, `createdAt`).
- **Enums**: PascalCase for name, UPPER_CASE for values (e.g., `enum Role { ADMIN, TEACHER, STUDENT }`).
- **Table mapping**: We map Prisma models to snake_case tables in the database using `@@map("users")`.
- **Column mapping**: We map Prisma fields to snake_case columns using `@map("first_name")`.

## 2. Primary Keys & UUID Policy
- **Type**: UUID v4.
- **Field Name**: `id`.
- **Definition**: `id String @id @default(uuid()) @db.Uuid`.
- **Rationale**: UUIDs prevent enumeration attacks and allow distributed ID generation.

## 3. Foreign Keys
- **Naming**: `[modelName]Id` (e.g., `userId`, `classId`).
- **Relations**: Define relation names explicitly when there are multiple relations between the same models.
- **Action**: Always specify `onDelete: Cascade` or `onDelete: Restrict` depending on the domain logic. Prefer `Restrict` to prevent accidental deletion of critical records.

## 4. Timestamps
- Every table MUST have:
  - `createdAt DateTime @default(now()) @map("created_at")`
  - `updatedAt DateTime @updatedAt @map("updated_at")`
- **Timezone**: All dates and timestamps must be stored in **UTC**.

## 5. Indexes
- Add indexes (`@@index`) for fields frequently used in `WHERE`, `ORDER BY`, or `JOIN` clauses.
- Common index candidates: `email`, `role`, `status`, foreign keys.

## 6. Soft Delete Strategy
- **No hard deletes** for operational data.
- Use a `status` Enum field (e.g., `ACTIVE`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`).
- Queries must filter by `status` to exclude logically deleted records.

## 7. Migration Policy
- Never modify existing migrations in `prisma/migrations`.
- Use `npm run prisma:migrate` for applying schema changes and creating new migrations in development.
- Name migrations descriptively (e.g., `add_student_profile_table`).
