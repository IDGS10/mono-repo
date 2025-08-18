import { Router } from 'express'
import DatabaseService from '../services/databaseService.js'
import swarmsRoutes from './swarmsRoutes.js'

const router = Router()

// API documentation
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Enjambre IoT API',
    version: '1.0.0',
    description: 'API REST for Enjambre IoT',
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'Get token from security service at http://localhost:8000',
    },
    endpoints: {
      public: {
        root: 'GET /',
        health: 'GET /health',
      },
      protected: {
        swarms: 'GET /swarms (requires auth)',
        note: 'All /swarms endpoints require authentication',
      },
    },
    documentation: {
      swarms: {
        // Public endpoints (none currently)

        // Protected endpoints (require Bearer token)
        list: 'GET    /swarms                       🔒 Auth required',
        create: 'POST   /swarms                       🔒 Auth required',
        get: 'GET    /swarms/{id}                  🔒 Auth required',
        update: 'PUT    /swarms/{id}                  🔒 Auth required',
        delete: 'DELETE /swarms/{id}                  🔒 Auth required',
        assign: 'POST   /swarms/{id}/assign           🔒 Auth required',
        activate: 'POST   /swarms/{id}/activate         🔒 Auth required',
        pause: 'POST   /swarms/{id}/pause            🔒 Auth required',
        complete: 'POST   /swarms/{id}/complete         🔒 Auth required',
        reject: 'POST   /swarms/{id}/reject           🔒 Auth required',
        devices: 'GET    /swarms/{id}/devices          🔒 Auth required',
        addDevice: 'POST   /swarms/{id}/devices          🔒 Auth required',
        removeDevice: 'DELETE /swarms/{id}/devices/{deviceId} 🔒 Auth required',
        stats: 'GET    /swarms/{id}/stats            🔒 Auth required',
      },
    },
    roles: {
      Organization: 'Full access to all swarms and operations',
      Manager: 'Can manage swarms, assign, activate, reject',
      'Project manager': 'Can create swarms and manage own swarms only',
      'Cluster manager': 'Can manage cluster operations',
    },
    examples: {
      authentication: {
        header: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Include this header in all protected requests',
      },
      createSwarm: {
        method: 'POST',
        url: '/swarms',
        headers: { Authorization: 'Bearer <token>' },
        body: {
          name: 'IoT Sensor Network',
          description: 'Temperature and humidity sensors',
          maxDevices: 50,
          projectId: 123,
        },
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

// Authentication middleware setup
let authMiddleware = null

export const setAuthMiddleware = (middleware) => {
  authMiddleware = middleware
}

// Protected routes with authentication
router.use(
  '/swarms',
  (req, res, next) => {
    if (authMiddleware) {
      // CORREGIDO: Usando los roles correctos del sistema
      authMiddleware.authenticateToken(['Manager', 'Project manager', 'Organization', 'Cluster manager'])(
        req,
        res,
        next
      )
    } else {
      next()
    }
  },
  swarmsRoutes
)

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  })
})

export default router