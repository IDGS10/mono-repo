const express = require("express");
require("dotenv").config();

// ===== MIDDLEWARE COMPARTIDO =====
const { createMiddleware } = require('@mono-repo/shared-middleware');

const { PORT } = require("./config/constats");
const { specs, swaggerUi } = require("./config/swagger");
const routes = require("./router/routes");
const { connectDatabase } = require("./services/database.service");

// ===== SHARED MIDDLEWARE CONFIGURATION =====
const middleware = createMiddleware({
  serviceName: 'security-service',
  jwtSecret: process.env.JWT_SECRET,
  sessionTimeout: process.env.SESSION_TIMEOUT || "24h",
  databasePool: null, // Will be configured after DB connection
  
  // Security configuration
  corsOrigin: [
    'http://localhost:5173',  // Vite dev server
    'http://127.0.0.1:5173',  // Alternative localhost
    'http://127.0.0.1:3000'   // Alternative localhost
  ],
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  maxFileSize: process.env.MAX_FILE_SIZE || "10mb",
  
  // Logging configuration
  loggingFormat: 'combined',
  enableMetrics: true,
  skipHealthChecks: true
});

// ===== AUTOMATIC EXPRESS CONFIGURATION =====
const expressHelper = middleware.setupExpressApp({
  enableCompression: true,
  enableJsonParsing: true,
  jsonLimit: process.env.MAX_FILE_SIZE || "10mb",
  enableUrlEncoded: true,
  enableSecurity: true,
  enableLogging: process.env.NODE_ENV !== 'test',
  enableErrorHandling: false, // Lo configuraremos manualmente al final
  
  // Middlewares personalizados adicionales
  customMiddlewares: [
    // Middleware personalizado de logging si lo necesitas
    process.env.NODE_ENV !== 'test' ? middleware.requestLogger() : null
  ].filter(Boolean)
});

const { app, addPublicRoutes, setupErrorHandling, listen } = expressHelper;

// ===== SWAGGER CONFIGURATION (same as before) =====
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Sistema de Registro - Documentación",
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: false,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  })
);

// ===== ADDITIONAL CORS CONFIGURATION =====
// Handle preflight requests for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// ===== ROUTES CONFIGURATION =====
addPublicRoutes("/api", routes);

// ===== ERROR HANDLING (at the end) =====
setupErrorHandling();

// ===== SERVER START FUNCTION ===== 
async function startServer() {
  try {
    console.log("🚀 Iniciando Security Service...");

    // Connect to database
    const dbConnected = await connectDatabase();
    
    if (dbConnected) {
      // Configure DB pool in middleware after connection
      const { pool } = require("./config/database");
      middleware.config.auth.databasePool = pool;
      console.log("✅ Middleware configurado con conexión a BD");
    } else {
      console.log("⚠️  Middleware iniciándose sin conexión a BD");
    }

    // Start server with helper - Graceful shutdown is included automatically
    const server = listen(PORT, (server) => {
      console.log(`\n🚀 Security Service iniciado exitosamente`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
      console.log(`🗄️  Base de datos: ${dbConnected ? '✅ PostgreSQL (Conectado)' : '❌ Sin conexión'}`);
      console.log(`⏰ Hora: ${new Date().toLocaleString("es-ES")}`);
      console.log(`\n📋 Endpoints disponibles:`);
      console.log(`   GET  /api/health - Estado del servidor`);
      console.log(`   POST /api/auth/register - Registro de usuario`);
      console.log(`   POST /api/auth/login - Login con credenciales`);
      console.log(`   POST /api/auth/logout - Logout`);
      console.log(`   GET  /api/user/profile - Perfil de usuario`);
      console.log(`   PUT  /api/user/profile - Actualizar perfil`);
      console.log(`   GET  /api/user/sessions - Historial de sesiones`);
      console.log(`   GET  /api/user/stats - Estadísticas del usuario`);
      console.log(`   GET  /api/dashboard/stats - Estadísticas del dashboard\n`);
    });

    return server;
  } catch (error) {
    console.error("❌ Error iniciando Security Service:", error);
    console.log("🔄 Intentando iniciar en modo degradado...");

    try {
      const server = listen(PORT, () => {
        console.log(`\n🚀 Security Service iniciado en modo degradado`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
        console.log(`⚠️  ADVERTENCIA: Sin conexión a base de datos`);
      });
      
      return server;
    } catch (serverError) {
      console.error("❌ Error crítico iniciando servidor:", serverError);
      process.exit(1);
    }
  }
}

// ===== EXPORTAR PARA TESTING =====
module.exports = { 
  app, 
  startServer,
  middleware // Exportar middleware para uso en tests
};

// ===== INICIAR SI ES EJECUTADO DIRECTAMENTE =====
if (require.main === module) {
  startServer();
}