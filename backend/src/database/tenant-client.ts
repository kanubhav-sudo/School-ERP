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

  return prisma.$extends({
    name: 'tenantScopeExtension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Bypass tenant scoping for global models
          if (GLOBAL_MODELS.has(model)) {
            return query(args)
          }

          const modelArgs = (args || {}) as Record<string, any>

          // 1. Read Operations: findMany, findFirst, findUnique, count, aggregate, groupBy
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
            modelArgs.where = {
              ...(modelArgs.where || {}),
              schoolId,
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
            modelArgs.where = {
              ...(modelArgs.where || {}),
              schoolId,
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
}
