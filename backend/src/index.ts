import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { env } from './config'
import { logger, API_PREFIX, NotFoundError } from './core'
import { requestIdMiddleware } from './middlewares/requestId.middleware'
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware'
import { errorHandler } from './middlewares/error.middleware'
import apiRoutes from './routes'

const app = express()

// 1. Request Tracing & Logging
app.use(requestIdMiddleware)
app.use(requestLoggerMiddleware)

// 2. Security & Parsing Middlewares
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
)
app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '10kb' })) // Mitigate DoS attacks via payload sizing
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// 3. Mount Routes
app.use(API_PREFIX, apiRoutes)

// Unmatched routes (404)
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`))
})

// 4. Global Error Handling
app.use(errorHandler)

// Start Server
app.listen(env.PORT, () => {
  logger.info(`🚀 [${env.NODE_ENV}] Server running on port ${env.PORT}`)
})
