# Session Memory

## Recent Work
- **Engineering Target**: Milestone 3.1 (Academic Structure) is fully complete.
- **Critical Knowledge**: Prisma 7 compatibility requires `@prisma/adapter-pg`. Do not use `engineType="library"`. Express 5 compatibility requires careful handling of wildcard routes (`path-to-regexp` v8), omit paths for global error/404 handlers.
- **Frontend TS/Vite**: Using React Compiler or Vite Fast Refresh with Shadcn UI requires careful exports. Do not export components and non-components (like `buttonVariants` or `watch` from react-hook-form) without using `eslint-disable-next-line react-refresh/only-export-components` or `react-hooks/incompatible-library`. TypeScript `verbatimModuleSyntax` is on, so types must be imported using `type`.
