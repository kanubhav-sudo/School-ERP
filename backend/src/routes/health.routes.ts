/**
 * Health Check Routes
 *
 * Exposes detailed health status of the application.
 *
 * @module routes/health
 */

import { Router, Request, Response } from 'express'
import { nowISO, uptimeSeconds, ApiResponse } from '../core'
import { env } from '../config'
import { checkDatabaseConnection } from '../database'

const router = Router()
const START_TIME = new Date()

router.get('/', async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection()

  const status = dbConnected ? 'healthy' : 'unhealthy'
  const statusCode = dbConnected ? 200 : 503

  const healthData = {
    status,
    database: dbConnected ? 'connected' : 'disconnected',
    environment: 'validated', // If we're running, env is validated by Zod
    uptime: uptimeSeconds(START_TIME),
    timestamp: nowISO(),
    version: env.APP_VERSION,
    // Placeholders for future metrics
    memoryUsage: process.memoryUsage().heapUsed,
    databaseLatency: null,
    gitCommitHash: null,
  }

  ApiResponse.success(res, healthData, 'Health check completed', statusCode)
})

export default router
