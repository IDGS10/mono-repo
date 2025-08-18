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
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:5173',
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