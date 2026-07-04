# Session Memory

## Recent Work
- **Engineering Target**: Milestone 4, Checkpoint 4.2 (Attendance Management) is fully complete. Moving to Checkpoint 4.3 (or Milestone 5 as per plan).
- **Critical Knowledge**: Prisma 7 compatibility requires `@prisma/adapter-pg`. Do not use `engineType="library"`. Express 5 compatibility requires careful handling of wildcard routes (`path-to-regexp` v8), omit paths for global error/404 handlers. When using `npx shadcn@latest add`, verify the file paths actually resolve correctly to `frontend/src/components/ui/`, as path aliases might cause the CLI to drop components in `frontend/@/components/ui/`.
- **Frontend TS/Vite**: Using React Compiler or Vite Fast Refresh with Shadcn UI requires careful exports. Do not export components and non-components without using `eslint-disable-next-line react-refresh/only-export-components` or `react-hooks/incompatible-library`. TypeScript `verbatimModuleSyntax` is on, so types must be imported using `type`. APIs returning simple arrays must be mapped directly (e.g., `data.map` rather than `data.sessions.map`).
