import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { testConnection } from './config/database.js'
import Project from './models/Project.js'
import projectsRoutes from './routes/projectsRoutes.js'
import { generateTestJWT } from './middleware/auth.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// POLÍTICA DE SEGURIDAD: Validar variables críticas
if (!process.env.JWT_SECRET) {
  console.error('❌ SECURITY ERROR: JWT_SECRET must be set to a secure value in production!')
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
}

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
})
app.use(limiter)

// POLÍTICA DE SEGURIDAD: CORS configuration - VALIDADA ✅
const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`)
      return callback(new Error('Not allowed by CORS policy'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

console.log('✅ CORS Policy: Restricted origins -', allowedOrigins)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (req.headers.authorization) {
    console.log('🔐 Authorization header present')
  }
  next()
})

// POLÍTICA DE SEGURIDAD: Todas las rutas de projects requieren JWT
app.use('/projects', projectsRoutes)

// Public endpoints (no requieren JWT)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Projects API - Secure Version',
    version: process.env.API_VERSION || '1.0.0',
    description: 'API REST for Projects Management - ALL ENDPOINTS REQUIRE JWT',
    security: {
      jwt_required: 'All /projects endpoints require valid JWT token',
      cors_policy: 'Restricted to allowed origins only',
      rate_limiting: 'Active'
    },
    note: 'This API handles only Projects. Swarms are managed by external API.',
    external_apis: {
      swarms: process.env.SWARMS_API_URL,
      organizations: process.env.ORGANIZATIONS_API_URL
    },
    endpoints: {
      health: 'GET /health (public)',
      'test-token': 'GET /test-token (public - development only)',
      projects: 'ALL /projects/* (JWT required)',
    },
    documentation: {
      projects: {
        list: 'GET    /projects (JWT required)',
        create: 'POST   /projects (JWT required)',
        get: 'GET    /projects/{id} (JWT required)',
        update: 'PUT    /projects/{id} (JWT required)',
        delete: 'DELETE /projects/{id} (JWT required)',
        approve: 'PATCH  /projects/{id}/approve (JWT required)',
        reject: 'PATCH  /projects/{id}/reject (JWT required)',
        stats: 'GET    /projects/stats (JWT required)',
      },
    }
  })
})

// Health check endpoint (público)
app.get('/health', async (req, res) => {
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
    
    res.status(isDbHealthy ? 200 : 503).json({
      status: isDbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: isDbHealthy ? 'connected' : 'disconnected',
      table_structure: tableInfo ? 'verified' : 'unknown',
      module: 'projects',
      security: {
        jwt_authentication: 'enabled',
        cors_policy: 'restricted',
        rate_limiting: 'active'
      },
      external_apis: {
        swarms: process.env.SWARMS_API_URL,
        organizations: process.env.ORGANIZATIONS_API_URL
      },
      version: process.env.API_VERSION || '1.0.0',
      uptime: process.uptime()
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    })
  }
})

// DESARROLLO SOLAMENTE: Endpoint para generar JWT de prueba
if (process.env.NODE_ENV === 'development') {
  app.get('/test-token', (req, res) => {
    const { userId = 1, username = 'testuser', role = 'user' } = req.query
    
    const testToken = generateTestJWT({ userId, username, role })
    
    res.json({
      message: 'Test JWT generated (DEVELOPMENT ONLY)',
      token: testToken,
      user: { userId, username, role },
      usage: 'Authorization: Bearer ' + testToken,
      warning: 'This endpoint is only available in development mode'
    })
  })
  
  console.log('⚠️  Development mode: /test-token endpoint available')
} else {
  console.log('✅ Production mode: /test-token endpoint disabled')
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    security_note: 'All /projects endpoints require JWT authentication',
    note: 'This API only handles Projects. For Swarms, use the external Swarms API.'
  })
})

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error)
  
  // CORS errors
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'Origin not allowed'
    })
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔍 Testing database connection...')
    const dbConnected = await testConnection()
    
    if (!dbConnected) {
      console.error('❌ Could not connect to database. Exiting...')
      process.exit(1)
    }

    // Verify existing table structure
    console.log('🔨 Verificando estructura de tabla existente...')
    try {
      const tableStructure = await Project.verifyTable()
      console.log('✅ Tabla projects verificada:', tableStructure.length, 'columnas')
    } catch (error) {
      console.warn('⚠️ Error verificando tabla:', error.message)
      console.log('💡 Ejecuta: node scripts/fix-projects-table.js')
    }

    app.listen(PORT, () => {
      console.log('🚀 Projects API Server started successfully! (SECURE VERSION)')
      console.log(`📍 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 API URL: http://localhost:${PORT}`)
      console.log(`💚 Health check: http://localhost:${PORT}/health`)
      console.log('📋 Module: Projects Only')
      console.log(`🐝 External Swarms API: ${process.env.SWARMS_API_URL}`)
      console.log('🔐 SECURITY STATUS:')
      console.log('  ✅ JWT Authentication: ENABLED on all /projects routes')
      console.log('  ✅ CORS Policy: RESTRICTED to allowed origins')
      console.log('  ✅ Rate Limiting: ACTIVE')
      console.log('  ✅ SELECT * Queries: ELIMINATED with pagination')
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Test JWT: GET http://localhost:${PORT}/test-token`)
      }
    })
  } catch (error) {
    console.error('💥 Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...')
  process.exit(0)
})

startServer()

export default app