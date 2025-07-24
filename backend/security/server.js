const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();


const { PORT } = require("./config/constats");
const { specs, swaggerUi } = require("./config/swagger");


const routes = require("./router/routes");


const { connectDatabase } = require("./services/database.service");


const ResponseUtils = require("./utils/responseUtils");
const { requestLogger } = require("./middleware/middleware");

const app = express();

//UI Swagger configuration (TU CONFIGURACIÓN ORIGINAL)
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


app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(morgan("combined"));


const limiter = rateLimit({
  windowMs: (Number.parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: "Demasiadas peticiones, intente más tarde",
  },
});
app.use("/api/", limiter);


app.use(cors());
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_FILE_SIZE || "10mb",
  })
);

// Logging personalizado NUEVO (opciona si no es test)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

//Api's routes 
app.use("/api", routes);

//Error handling for undefined routes
app.use("*", (req, res) => {
  ResponseUtils.notFound(res, `Endpoint ${req.originalUrl} no encontrado`);
});

//Global error handler 
app.use(ResponseUtils.globalErrorHandler);

//Start server and connect to database 
async function startServer() {
  try {
    console.log("🚀 Iniciando servidor...");

    // Intentar conectar a la base de datos con timeout
    const dbConnected = await connectDatabase();

    if (!dbConnected) {
      console.log("⚠️  Servidor iniciándose sin conexión a base de datos");
    }

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor iniciado exitosamente`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(
        `📚 Documentación Swagger: http://localhost:${PORT}/api/docs`
      );
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

    // Configurar shutdown graceful
    setupGracefulShutdown(server);

    return server;
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    console.log("🔄 Intentando iniciar servidor sin base de datos...");

    // Intentar iniciar el servidor sin BD
    try {
      const server = app.listen(PORT, () => {
        console.log(`\n🚀 Servidor iniciado en modo sin base de datos`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📚 Documentación Swagger: http://localhost:${PORT}/api/docs`);
        console.log(`⚠️  ADVERTENCIA: Sin conexión a base de datos`);
      });

      setupGracefulShutdown(server);
      return server;
    } catch (serverError) {
      console.error("❌ Error crítico iniciando servidor:", serverError);
      process.exit(1);
    }
  }
}

//Graceful shutdown
function setupGracefulShutdown(server) {
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Recibido ${signal}. Cerrando servidor...`);

    server.close(async () => {
      console.log("🔌 Servidor HTTP cerrado");

      try {
        const { pool } = require("./config/database");
        await pool.end();
        console.log("✅ Conexiones de base de datos cerradas");
      } catch (dbError) {
        console.error("⚠️  Error cerrando conexiones de BD:", dbError.message);
      }

      console.log("✅ Shutdown completado");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

// Exportar para testing
module.exports = { app, startServer };

if (require.main === module) {
  startServer();
}