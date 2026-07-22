/**
 * Central Database Module
 *
 * The PrismaClient MUST only be instantiated here.
 * Every service in the application imports from this module.
 * Never create a new PrismaClient anywhere else.
 *
 * @module database/prisma
 */

import { PrismaClient } from '../generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { env } from '../config'

const pool = new Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ 
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

/**
 * Verifies database connectivity.
 * Used by health checks and startup validation.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

/**
 * Gracefully disconnects from the database.
 * Call this during application shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

export { prisma }
export default prisma
