import { Router } from 'express'
import DatabaseService from '../services/databaseService.js'
import swarmsRoutes from './swarmsRoutes.js'

const router = Router()

// Define routes
router.use('/swarms', swarmsRoutes)

// Health check
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Enjambre IoT API',
    version: '1.0.0',
    description: 'API REST for Enjambre IoT',
    endpoints: {
      health: 'GET /health',
      swarms: 'GET /swarms',
    },
    documentation: {
      swarms: {
        list:         'GET    /swarms',
        create:       'POST   /swarms',
        get:          'GET    /swarms/{id}',
        update:       'PUT    /swarms/{id}',
        delete:       'DELETE /swarms/{id}',
        assign:       'POST   /swarms/{id}/assign',
        activate:     'POST   /swarms/{id}/activate',
        devices:      'GET    /swarms/{id}/devices',
        addDevice:    'POST   /swarms/{id}/devices',
        removeDevice: 'DELETE /swarms/{id}/devices/{deviceId}',
      },
    },
  })
})

// Health check endpoint
router.get('/health', async (req, res) => {
  const isDbHealthy = await DatabaseService.isHealthy()

  res.status(isDbHealthy ? 200 : 503).json({
    status: isDbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: isDbHealthy ? 'connected' : 'disconnected',
  })
})

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  })
})

export default router