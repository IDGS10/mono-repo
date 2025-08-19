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
  corsOrigin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',  // Vite dev server
        'http://127.0.0.1:5173',  // Alternative localhost
        'http://127.0.0.1:3000',
        'https://mono-repo-fawn.vercel.app',
        'https://server-uteq.nrsoftware.online',
        'https://*.vercel.app',
        'https://*.nrsoftware.online'
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

// ===== ADDITIONAL CORS CONFIGURATION =====
// Debug middleware for CORS
configuredApp.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 Projects - Request from origin: ${req.headers.origin || 'No origin'}`);
    console.log(`🔄 Method: ${req.method}`);
    console.log(`📍 Path: ${req.path}`);
  }
  next();
});

// Handle preflight requests for all routes
configuredApp.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'https://mono-repo-fawn.vercel.app',
        'https://server-uteq.nrsoftware.online'
      ];
  
  console.log(`🔍 Projects OPTIONS request from origin: ${origin}`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
  
  // Allow origin if it's in the allowed list or matches wildcards
  if (allowedOrigins.includes(origin) || 
      (origin && (origin.includes('.vercel.app') || origin.includes('.nrsoftware.online')))) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log(`✅ Origin allowed: ${origin}`);
  } else {
    console.log(`❌ Origin rejected: ${origin}`);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).send();
});

// ===== ADDITIONAL CORS MIDDLEWARE FOR ALL REQUESTS =====
configuredApp.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173', 
        'http://127.0.0.1:3000',
        'https://mono-repo-fawn.vercel.app',
        'https://server-uteq.nrsoftware.online'
      ];
  
  // Allow origin if it's in the allowed list or matches wildcards
  if (allowedOrigins.includes(origin) || 
      (origin && (origin.includes('.vercel.app') || origin.includes('.nrsoftware.online')))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

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
  publicRoutes.get('/test-token', async (req, res) => {
    try {
      // CORRECCIÓN: Usar import dinámico en lugar de require
      const jwt = await import('jsonwebtoken')
      
      const { 
        userId = 1, 
        username = 'testuser', 
        role = 'Owner',
        email = 'test@example.com'
      } = req.query
      
      const payload = {
        userId: parseInt(userId),
        username,
        email,
        rol: role, // Nota: usar 'rol' como en tu BD
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
      }
      
      // Usar el JWT secret del middleware compartido
      const testToken = jwt.default.sign(payload, middleware.config.auth.jwtSecret)
      
      middleware.ResponseUtils.success(res, 200, 'Test JWT generated successfully', {
        token: testToken,
        user: payload,
        usage: {
          header: `Authorization: Bearer ${testToken}`,
          localStorage: `localStorage.setItem('userToken', '${testToken}')`,
          curl: `curl -H "Authorization: Bearer ${testToken}" http://localhost:${PORT}/projects`
        },
        expires_in: '24 hours',
        warning: 'This endpoint is only available in development mode'
      })
      
    } catch (error) {
      console.error('Error generating test token:', error)
      middleware.ResponseUtils.error(res, 500, 'Failed to generate test token', error.message)
    }
  })
  
  console.log('⚠️  Development mode: /test-token endpoint available')
  console.log(`🔧 Test token URL: http://localhost:${PORT}/test-token`)
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