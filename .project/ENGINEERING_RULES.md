# Engineering Rules

These rules apply to all files and modules across the codebase.

1. **Dry (Do Not Repeat Yourself)**:
   - Reuse existing middleware, utilities, constants, services, and schemas.
   - Central infrastructure must reside in `backend/src/core/`.
2. **Strict Typings**:
   - Zero `any` types unless absolutely verified. Use strong TypeScript typings.
3. **Database Constraints**:
   - The Prisma Client must be initialized ONLY inside `backend/src/database/prisma.ts`.
4. **Environment Variables**:
   - Validate variables at startup using Zod schema. Refuse startup on validation failure.
5. **Logging**:
   - No direct `console.log` in production-bound server files. Always use the Pino-based structured logger `logger`.
6. **Error Handling**:
   - Use custom `AppError` subclasses. Catch all errors via the global error handler middleware.
7. **Timestamps**:
   - All dates and times must be generated, stored, and compared in UTC.
