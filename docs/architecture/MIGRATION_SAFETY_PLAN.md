# CloudEMS Platform — Migration & Data Safety Protocol

**Document Version**: 1.0.0  
**Date**: 2026-08-03  
**Status**: APPROVED PROTOCOL  
**Phase**: Phase 3 Schema Migration Safety  

---

## 1. Database Backup Strategy

Before running any Prisma schema migrations on existing database environments (development, staging, or production):

### 1.1 Local PostgreSQL Dump (Development / Staging)
```bash
# Dump full database schema + data before migration
pg_dump -U postgres -h localhost -d school_erp_dev -F c -b -v -f ./backend/prisma/backups/pre_phase3_backup_$(date +%Y%m%d_%H%M%S).dump
```

### 1.2 Automated Pre-Migration Check
Verify that PostgreSQL database service is accessible, connection pool is healthy, and free disk space is > 1GB before triggering migration commands.

---

## 2. Rollback Strategy

In the event of a migration execution failure or data integrity failure:

### 2.1 Standard Prisma Rollback
```bash
# Mark migration as rolled back in _prisma_migrations table if failed
npx prisma migrate resolve --rolled-back <migration_name>
```

### 2.2 Database Restoration Procedure
```bash
# Drop current corrupted database
dropdb -U postgres -h localhost school_erp_dev

# Recreate clean database
createdb -U postgres -h localhost school_erp_dev

# Restore from backup
pg_restore -U postgres -h localhost -d school_erp_dev -v ./backend/prisma/backups/<backup_file_name>.dump
```

---

## 3. Migration Validation Protocol

Every schema change in Phase 3 must pass the following validation steps:
1. **Schema Syntax Validation**: `npx prisma validate`
2. **Client Generation**: `npx prisma generate`
3. **Migration Dry Run**: Execute `npx prisma migrate dev --name phase3_tenant_isolation`
4. **Seed Validation**: Run `npx prisma db seed` to confirm default school, users, and core entities seed cleanly into the updated tenant schema without constraint violations.
