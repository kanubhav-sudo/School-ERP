# Coding Standards

We enforce strict formatting and styling rules to ensure consistent readability.

## Linting & Formatting
- **Linter**: ESLint with flat config (`eslint.config.js` on frontend, `eslint.config.mjs` on backend).
- **Formatter**: Prettier configured with 2-space indents, single quotes, and trailing commas.
- **Rule Enforcement**: Code must be validated before commits (Git hook validation).

## Naming Conventions
- **Files**: Source code files must use camelCase naming (`env.ts`, `prisma.ts`, `error.middleware.ts`). React component files use PascalCase.
- **Folders**: Folders use kebab-case or camelCase naming (e.g. `student-photos`, `core`, `routes`).
- **Variables & Functions**: camelCase.
- **Constants**: UPPER_CASE snake_case (`ROLES`, `FEE_STATUS`).

## Project Folder Blueprints

### Backend Directories
- `src/config`: App configuration.
- `src/core`: Shared system infrastructure.
- `src/controllers`: Request handlers.
- `src/services`: Database transactions & business logic.
- `src/middlewares`: Request middleware hooks.
- `src/routes`: Router mapping.
- `src/validators`: Zod validation schemas.
- `src/utils`: Reusable helper code.
- `src/types`: TypeScript typings.

### Frontend Directories
- `src/features`: Feature modules.
- `src/components`: Generic UI component blocks.
- `src/hooks`: Global custom hooks.
- `src/lib`: Integrations (e.g. Axios client, React query).
- `src/routes`: Client router mappings.
- `src/types`: UI types.
- `src/assets`: Resource files.
