import express from 'express'
import dotenv from 'dotenv'
import { testConnection } from './config/database.js'
import Project from './models/Project.js'
import projectsRoutes from './routes/projectsRoutes.js'
import { createMiddleware } from '@mono-repo/shared-middleware'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// PASO 1: Configurar el middleware compartido
const middleware = createMiddleware({
  serviceName: 'projects-service',
  jwtSecret: process.env.JWT_SECRET,
  databasePool: null, // Se asignará después de conectar la BD
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  maxFileSize: 10 * 1024 * 1024,
  sessionTimeout: '24h',
  loggingFormat: 'combined',
  enableMetrics: true,
  skipHealthChecks: true
})

// PASO 2: Configuración automática de Express usando el helper
const expressHelper = middleware.setupExpressApp({
  enableCompression: true,
  enableSecurity: true,
  enableLogging: process.env.NODE_ENV !== 'test'
})

const { 
  app: configuredApp, 
  addAuthenticatedRoutes, 
  addPublicRoutes, 
  setupErrorHandling, 
  listen 
} = expressHelper

// PASO 3: Rutas públicas (sin JWT)
const publicRoutes = express.Router()

// Health check mejorado con información del middleware
publicRoutes.get('/health', async (req, res) => {
  try {
    const isDbHealthy = await testConnection()
    
    let tableInfo = null
    if (isDbHealthy) {
      try {
        tableInfo = await Project.verifyTable()
      } catch (err) {
        console.warn('Could not verify table structure:', err.message)
      }
    }
    
    middleware.ResponseUtils.success(res, 200, 'Health check completed', {
      status: isDbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: isDbHealthy ? 'connected' : 'disconnected',
      table_structure: tableInfo ? 'verified' : 'unknown',
      service: middleware.config.serviceName,
      security: {
        jwt_authentication: 'enabled',
        cors_policy: 'restricted',
        rate_limiting: 'active',
        security_headers: 'enabled'
      },
      external_apis: {
        swarms: process.env.SWARMS_API_URL,
        organizations: process.env.ORGANIZATIONS_API_URL
      },
      version: process.env.API_VERSION || '1.0.0',
      uptime: process.uptime()
    })
  } catch (error) {
    middleware.ResponseUtils.error(res, 503, 'Service unhealthy', {
      database: 'error',
      error: error.message
    })
  }
})

// Root endpoint
publicRoutes.get('/', (req, res) => {
  middleware.ResponseUtils.success(res, 200, 'Projects API - Secure Version', {
    service: middleware.config.serviceName,
    version: process.env.API_VERSION || '1.0.0',
    description: 'API REST for Projects Management with Shared Middleware',
    security: {
      jwt_required: 'All /projects endpoints require valid JWT token',
      cors_policy: 'Restricted to allowed origins only',
      rate_limiting: 'Active',
      security_headers: 'Enabled'
    },
    middleware_features: {
      authentication: 'JWT with database validation',
      validation: 'Input validation and sanitization',
      logging: 'Centralized logging with metrics',
      error_handling: 'Standardized error responses'
    },
    external_apis: {
      swarms: process.env.SWARMS_API_URL,
      organizations: process.env.ORGANIZATIONS_API_URL
    },
    endpoints: {
      health: 'GET /health (public)',
      'test-token': 'GET /test-token (development only)',
      projects: 'ALL /projects/* (JWT required)'
    }
  })
})

// Test token para desarrollo
if (process.env.NODE_ENV === 'development') {
  publicRoutes.get('/test-token', (req, res) => {
    const { userId = 1, username = 'testuser', role = 'Owner' } = req.query
    
    // Usar el JWT secret del middleware compartido
    const jwt = require('jsonwebtoken')
    const testToken = jwt.sign({
      userId,
      username,
      rol: role, // Nota: usar 'rol' como en tu BD
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, middleware.config.auth.jwtSecret)
    
    middleware.ResponseUtils.success(res, 200, 'Test JWT generated', {
      token: testToken,
      user: { userId, username, rol: role },
      usage: `Authorization: Bearer ${testToken}`,
      warning: 'This endpoint is only available in development mode'
    })
  })
  
  console.log('⚠️  Development mode: /test-token endpoint available')
}

// PASO 4: Agregar rutas públicas
addPublicRoutes('/', publicRoutes)

// PASO 5: Rutas autenticadas (requieren JWT)
// Los roles permitidos se definen aquí
const allowedRoles = ['Owner', 'Leader', 'User'] // Ajusta según tus necesidades
addAuthenticatedRoutes('/projects', projectsRoutes, allowedRoles)

// PASO 6: Configurar manejo de errores
setupErrorHandling()

// PASO 7: Inicializar base de datos y servidor
const startServer = async () => {
  try {
    console.log('🔍 Testing database connection...')
    const dbConnected = await testConnection()
    
    if (!dbConnected) {
      console.error('❌ Could not connect to database. Exiting...')
      process.exit(1)
    }

    // IMPORTANTE: Asignar el pool de BD al middleware después de la conexión
    const { pool } = await import('./config/database.js')
    middleware.config.auth.databasePool = pool
    console.log('✅ Database pool assigned to shared middleware')

    // Verificar estructura de tabla
    console.log('🔨 Verificando estructura de tabla existente...')
    try {
      const tableStructure = await Project.verifyTable()
      console.log('✅ Tabla projects verificada:', tableStructure.length, 'columnas')
    } catch (error) {
      console.warn('⚠️ Error verificando tabla:', error.message)
    }

    // Iniciar servidor usando el helper del middleware
    const server = listen(PORT, () => {
      console.log('🚀 Projects API Server started successfully! (SHARED MIDDLEWARE)')
      console.log(`📍 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 API URL: http://localhost:${PORT}`)
      console.log(`💚 Health check: http://localhost:${PORT}/health`)
      console.log('📋 Module: Projects Only')
      console.log(`🐝 External Swarms API: ${process.env.SWARMS_API_URL}`)
      console.log('🔐 SHARED MIDDLEWARE FEATURES:')
      console.log('  ✅ JWT Authentication: Database validation enabled')
      console.log('  ✅ CORS Policy: Restricted origins')
      console.log('  ✅ Rate Limiting: Active')
      console.log('  ✅ Security Headers: Helmet enabled')
      console.log('  ✅ Input Validation: Sanitization enabled')
      console.log('  ✅ Centralized Logging: With metrics')
      console.log('  ✅ Error Handling: Standardized responses')
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Test JWT: GET http://localhost:${PORT}/test-token`)
      }
    })

    return server
  } catch (error) {
    console.error('💥 Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown mejorado
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received. Shutting down gracefully...`)
  
  // Cerrar pool de base de datos si existe
  if (middleware.config.auth.databasePool) {
    middleware.config.auth.databasePool.end(() => {
      console.log('🔌 Database pool closed')
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

startServer()

export default configuredApp