import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { testConnection } from './config/database.js'
import Project from './models/Project.js'
import projectsRoutes from './routes/projectsRoutes.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
})
app.use(limiter)

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/projects', projectsRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Projects API',
    version: process.env.API_VERSION || '1.0.0',
    description: 'API REST for Projects Management',
    endpoints: {
      health: 'GET /health',
      projects: 'GET /projects',
    },
    documentation: {
      projects: {
        list: 'GET    /projects',
        create: 'POST   /projects',
        get: 'GET    /projects/{id}',
        update: 'PUT    /projects/{id}',
        delete: 'DELETE /projects/{id}',
        approve: 'PATCH  /projects/{id}/approve',
        reject: 'PATCH  /projects/{id}/reject',
        stats: 'GET    /projects/stats',
        byOrg: 'GET    /organizations/{id_org}/projects',
      },
    },
    database_schema: {
      table: 'projects',
      fields: [
        'id_project (integer, PK, auto-increment)',
        'name (varchar(100), NOT NULL)',
        'description (varchar(500))',
        'location (varchar(255))',
        'status (varchar(10))',
        'modified_by (varchar(100))',
        'created_by (varchar(100))',
        'id_org (integer)',
        'owner_id (integer(10))',
        'created_at (timestamp)',
        'updated_at (timestamp)'
      ]
    }
  })
})

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const isDbHealthy = await testConnection()
    
    // Also verify table structure
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
      table_columns: tableInfo ? tableInfo.length : 0,
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

// Organization projects endpoint (for compatibility)
app.get('/organizations/:id_org/projects', async (req, res) => {
  try {
    const { id_org } = req.params
    const { status } = req.query

    let projects
    if (status) {
      projects = await Project.findByStatus(status, null, parseInt(id_org))
    } else {
      projects = await Project.findAll(null, parseInt(id_org))
    }

    res.status(200).json({
      success: true,
      data: projects.map(p => p.toJSON()),
      count: projects.length,
      message: 'Organization projects retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching organization projects:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization projects',
      error: error.message
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  })
})

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error)
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...')
    const dbConnected = await testConnection()
    
    if (!dbConnected) {
      console.error('❌ Could not connect to database. Exiting...')
      process.exit(1)
    }

    // Verify existing table structure
    console.log('🔨 Verifying existing database table...')
    try {
      const tableStructure = await Project.verifyTable()
      console.log('✅ Found projects table with', tableStructure.length, 'columns')
      
      // Log table structure for verification
      tableStructure.forEach(col => {
        console.log(`   📋 ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
      })
    } catch (error) {
      console.error('❌ Error verifying table structure:', error.message)
      console.log('⚠️  Please ensure the projects table exists in your database')
    }

    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Projects API Server started successfully!')
      console.log(`📍 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 API URL: http://localhost:${PORT}`)
      console.log(`💚 Health check: http://localhost:${PORT}/health`)
      console.log(`📚 API Documentation: http://localhost:${PORT}`)
      console.log('📋 Database Schema: Using existing projects table')
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

// Start the server
startServer()

export default app