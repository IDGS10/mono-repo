// src/app.js
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'

import routes from './routes/index.js'
import errorHandler from './middlewares/errorHandler.js'
import DatabaseService from './services/databaseService.js'
import logger from './utils/logger.js'
import { NODE_ENV } from './config/environment.js'

const app = express()

// Basic middleware
app.use(cors())
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
console.log("HOLA")
console.log("PUERTO", NODE_ENV)
// Logging
if (NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  )
}

// Routes
app.use('', routes)

// Error handling
app.use(errorHandler)

// Initialize database connection
DatabaseService.connect().catch((error) => {
  logger.error('Failed to connect to database:', error)
  if (NODE_ENV === 'production') {
    process.exit(1)
  }
})

export default app
