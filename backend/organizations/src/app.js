const express = require('express');
const { createMiddleware } = require('@mono-repo/shared-middleware');

const organizationRoutes = require('./routes/organizations');
const invitationRoutes = require('./routes/invitations');
const projectRoutes = require('./routes/projects');
const projectApprovalRoutes = require('./routes/projectApprovalRoutes');

// Crear middleware compartido
const middleware = createMiddleware({
  serviceName: 'organizations-service',
  jwtSecret: process.env.JWT_SECRET,
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
  databasePool: null // Se configurará después de la conexión a BD
});

// Configurar el pool de base de datos después de crear el middleware
const configureDatabase = () => {
  try {
    // Usar la configuración de base de datos de seguridad para la validación de usuarios
    const { Pool } = require('pg');
    
    const securityDbPool = new Pool({
      host: process.env.SECURITY_DB_HOST || process.env.DB_HOST,
      port: process.env.SECURITY_DB_PORT || process.env.DB_PORT,
      database: process.env.SECURITY_DB_NAME || 'segDatabase', // Nombre correcto de la BD de seguridad
      user: process.env.SECURITY_DB_USER || process.env.DB_USER,
      password: process.env.SECURITY_DB_PASSWORD || process.env.DB_PASSWORD,
      ssl: (process.env.SECURITY_DB_SSL || process.env.DB_SSL) === 'true' ? { rejectUnauthorized: false } : false,
      max: 5, // Menos conexiones para validación
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    middleware.config.auth.databasePool = securityDbPool;
    console.log('✅ Security Database pool configured for middleware (segDatabase)');
  } catch (error) {
    console.warn('⚠️ Database pool not configured - authentication will work without DB validation:', error.message);
    // No configurar el pool, usar solo validación JWT
    middleware.config.auth.databasePool = null;
  }
};

// Configurar BD inmediatamente
configureDatabase();

const app = express();

// Configurar middlewares de seguridad
middleware.setupSecurity().forEach(mw => app.use(mw));
app.use(middleware.securityHeaders());

// ===== ADDITIONAL CORS CONFIGURATION =====
// Debug middleware for CORS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 Organizations - Request from origin: ${req.headers.origin || 'No origin'}`);
    console.log(`🔄 Method: ${req.method}`);
    console.log(`📍 Path: ${req.path}`);
  }
  next();
});

// Handle preflight requests for all routes
app.options('*', (req, res) => {
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
  
  console.log(`🔍 Organizations OPTIONS request from origin: ${origin}`);
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
app.use((req, res, next) => {
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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(middleware.requestLogger());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'organizations-module'
  });
});

app.use('/api/organizations', organizationRoutes(middleware));
app.use('/api/invitations', invitationRoutes(middleware));
app.use('/api/projects', projectRoutes);
app.use('/api/project-approvals', projectApprovalRoutes);

// 404 handler
app.use(middleware.notFoundHandler());

// Global error handler
app.use(middleware.errorHandler());

module.exports = app;