# Changelog

All notable changes to the School ERP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-milestone1] - 2026-06-30

### Added
- Root configuration files: `README.md`, `.gitignore`, `.editorconfig`, `docker-compose.yml`, `.env.example`, `LICENSE`, `.prettierrc`.
- Vite React TS frontend project setup under `frontend/` folder.
- Express TS backend project setup under `backend/` folder.
- Tailwind CSS v4 and `shadcn/ui` UI framework configurations in the frontend.
- Standard ESLint flat configs (`eslint.config.js` and `eslint.config.mjs`) alongside Prettier configurations across both frontend and backend.
- Path aliases mapping `@/*` to `src/*` for clean imports.
- Prisma ORM initialization with basic schema and PostgreSQL connection settings.
- Minimal Express entry point (`src/index.ts`) and React entry point (`src/App.tsx`).
- Approved directory structures under `frontend/src/` and `backend/src/`.
- Documentation structure (`docs/` directory housing `ROADMAP.md`, `API.md`, `DATABASE.md`, `ARCHITECTURE.md`, `FEATURES.md`, `CHANGELOG.md`).
