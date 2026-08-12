/**
 * Tenant-Scoped Database Client Factory
 *
 * Employs Prisma Client Extensions ($extends) to auto-inject tenant scoping (`schoolId`)
 * into all Prisma query, mutation, and aggregation operations.
 *
 * Developers call `req.db` without needing to manually specify `schoolId` in every query.
 *
 * @module database/tenant-client
 */

import { PrismaClient } from '../generated/prisma'
import logger from '../core/logger'

// Global models exempt from tenant isolation filtering
const GLOBAL_MODELS = new Set(['School', 'Plan', 'SubscriptionInvoice'])

export type TenantPrismaClient = ReturnType<typeof createTenantClient>

/**
 * Creates a tenant-isolated Prisma client extension for a specific school ID.
 *
 * @param prisma Base PrismaClient instance
 * @param schoolId Valid UUID of the target tenant school
 */
export function createTenantClient(prisma: PrismaClient, schoolId: string) {
  if (!schoolId) {
    logger.error('⚠️ Attempted to instantiate TenantClient without a valid schoolId')
    throw new Error('Tenant context requirement violated: schoolId is missing')
  }

  const client = prisma.$extends({
    name: 'tenantScopeExtension',
    client: {
      schoolId,
    },
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Bypass tenant scoping for global models
          if (GLOBAL_MODELS.has(model)) {
            return query(args)
          }

          const modelArgs = (args || {}) as Record<string, any>

          // Helper: skip schoolId injection when the where clause already uses a unique selector.
          // Covers:
          //   1. Plain primary key `id`
          //   2. schoolId_* compound selectors (e.g. schoolId_prefix, schoolId_sectionId_date)
          //   3. Any compound object key whose value is a plain object (e.g. attendanceId_studentId: {...})
          // Ownership is guaranteed by the preceding getById/findFirst (tenant-filtered) call.
          const hasPrimaryOrCompoundSelector = (whereObj?: Record<string, any>): boolean => {
            if (!whereObj) return false
            // Plain primary key
            if (whereObj.id !== undefined) return true
            // Compound unique selector (schoolId_* or any other multi-field unique key)
            return Object.entries(whereObj).some(([k, v]) => {
              // schoolId_* pattern
              if (k.startsWith('schoolId_')) return true
              // Any compound key: key contains underscore AND value is a plain object (not array/null)
              if (k.includes('_') && v !== null && typeof v === 'object' && !Array.isArray(v))
                return true
              return false
            })
          }

          // Special mapping for UsernameSequence if prefix is passed directly
          if (model === 'UsernameSequence') {
            if (['upsert', 'findUnique', 'update', 'delete'].includes(operation)) {
              if (modelArgs.where && modelArgs.where.prefix && !modelArgs.where.schoolId_prefix) {
                const prefixVal = modelArgs.where.prefix
                delete modelArgs.where.prefix
                modelArgs.where.schoolId_prefix = { schoolId, prefix: prefixVal }
              }
            }
          }

          // 1. Read Operations: findMany, findFirst, count, aggregate, groupBy
          if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
            modelArgs.where = {
              ...(modelArgs.where || {}),
              schoolId,
            }

            // Auto-filter soft deletes where applicable
            const softDeleteModels = [
              'Teacher',
              'Student',
              'Attendance',
              'Notice',
              'Timetable',
              'FeePlan',
            ]
            if (softDeleteModels.includes(model)) {
              if (
                modelArgs.where.deletedAt === undefined &&
                modelArgs.where.isDeleted === undefined
              ) {
                if (['Teacher', 'Student'].includes(model)) {
                  modelArgs.where.deletedAt = null
                } else if (['Attendance', 'Notice', 'Timetable', 'FeePlan'].includes(model)) {
                  modelArgs.where.isDeleted = false
                }
              }
            }
          }

          // 2. Single Mutations with filters: update, delete
          if (['update', 'delete'].includes(operation)) {
            if (!hasPrimaryOrCompoundSelector(modelArgs.where)) {
              modelArgs.where = {
                ...(modelArgs.where || {}),
                schoolId,
              }
            }
          }

          // 3. Batch Mutations: updateMany, deleteMany
          if (['updateMany', 'deleteMany'].includes(operation)) {
            modelArgs.where = {
              ...(modelArgs.where || {}),
              schoolId,
            }
          }

          // 4. Create Operations: create
          if (operation === 'create') {
            modelArgs.data = {
              ...(modelArgs.data || {}),
              schoolId,
            }
          }

          // 5. Batch Create Operations: createMany
          if (operation === 'createMany') {
            if (Array.isArray(modelArgs.data)) {
              modelArgs.data = modelArgs.data.map((item: any) => ({
                ...item,
                schoolId,
              }))
            } else if (modelArgs.data) {
              modelArgs.data = {
                ...modelArgs.data,
                schoolId,
              }
            }
          }

          // 6. Upsert Operation
          if (operation === 'upsert') {
            if (!hasPrimaryOrCompoundSelector(modelArgs.where)) {
              modelArgs.where = {
                ...(modelArgs.where || {}),
                schoolId,
              }
            }
            modelArgs.create = {
              ...(modelArgs.create || {}),
              schoolId,
            }
            modelArgs.update = {
              ...(modelArgs.update || {}),
              schoolId,
            }
          }

          return query(modelArgs)
        },
      },
    },
  })

  return client
}
