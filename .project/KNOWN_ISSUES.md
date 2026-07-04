# Known Issues

No active system bugs or build failures have been detected.

## Architectural Discoveries & Warnings
- **Prisma 7 Client Client Constructor Rules**:
  - The Prisma Client constructor strictly requires passing `{ accelerateUrl: process.env.DATABASE_URL }` in certain local environments to properly handle datasource routing when using template credentials.
  - Resolved in `backend/src/database/prisma.ts`.
