# Session Memory

## Recent Work
- **Engineering Target**: Milestone 4, Checkpoint 4.1 (Timetable Management) is fully complete. Moving to Checkpoint 4.2 (Attendance Management).
- **Critical Knowledge**: Prisma 7 compatibility requires `@prisma/adapter-pg`. Do not use `engineType="library"`. Express 5 compatibility requires careful handling of wildcard routes (`path-to-regexp` v8), omit paths for global error/404 handlers.
- **Frontend TS/Vite**: Using React Compiler or Vite Fast Refresh with Shadcn UI requires careful exports. Do not export components and non-components without using `eslint-disable-next-line react-refresh/only-export-components` or `react-hooks/incompatible-library`. TypeScript `verbatimModuleSyntax` is on, so types must be imported using `type`. APIs returning simple arrays must be mapped directly (e.g., `data.map` rather than `data.sessions.map`).
