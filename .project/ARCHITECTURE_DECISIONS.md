# Architectural Decisions

This document tracks major structural decisions made in the codebase.

## Decoupled Storage Interface
- **Decision**: Define a generic storage provider interface (`StorageProvider`) in `src/core/storage.ts` instead of writing filesystem-specific operations directly in controllers.
- **Rationale**: Enables swapping local filesystem storage (under `backend/storage/local`) for cloud-based storage engines (S3, GCS, Azure, MinIO) without touching business logic or controllers.

## Unified Client Instance for Prisma
- **Decision**: Initialize Prisma Client only once in `backend/src/database/prisma.ts`.
- **Rationale**: Minimizes database connection pool exhaustion and provides centralized control over Prisma options. 

## Prisma 7 Configuration Requirement
- **Decision**: Configure Prisma Client constructor with `accelerateUrl` property pointing to the database URL.
- **Rationale**: Prisma 7 Client instantiation requires explicitly setting the options object when a local templates environment setup is resolved.

## API Envelope Standard
- **Decision**: Standardize responses using specific helpers (`ApiResponse`) exporting structured envelopes for both success and error paths.
- **Rationale**: Consistency across all API interfaces. Ensures client wrappers (Axios) have uniform parsed inputs.
