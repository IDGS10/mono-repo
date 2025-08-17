import express from 'express'
import compression from 'compression'
import morgan from 'morgan'
import process from 'process'
import { createMiddleware } from '@mono-repo/shared-middleware'

import routes, { setAuthMiddleware } from './routes/index.js'
import errorHandler from './middlewares/errorHandler.js'
import DatabaseService from './services/databaseService.js'
import logger from './utils/logger.js'
import { NODE_ENV, JWT_SECRET } from './config/environment.js'
import { getCorsConfig, getFallbackCorsHandler } from './config/cors.js'

// Configure shared middleware
const middleware = createMiddleware({
  serviceName: 'swarms-service',
  jwtSecret: JWT_SECRET,
  ...getCorsConfig(),
  rateLimitWindow: 15,
  rateLimitMax: 100,
  loggingFormat: 'combined'
})

const app = express()

// Basic middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging
if (NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  )
}

// CORS handling
app.use(middleware.corsHandler ? middleware.corsHandler() : getFallbackCorsHandler())

// Security middleware
app.use(middleware.securityHeaders())
app.use(middleware.rateLimiter())

// Application routes
setAuthMiddleware(middleware)
app.use('', routes)

// Error handling
app.use(middleware.errorHandler())
app.use(errorHandler)

// Database initialization
DatabaseService.connect()
  .then(() => {
    logger.info('Database connected successfully')
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error)
    if (NODE_ENV === 'production') {
      process.exit(1)
    }
  })

export default app
export { middleware }