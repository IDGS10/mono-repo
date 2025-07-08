const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

//Configs
const { PORT } = require("./config/constats");
const { specs, swaggerUi } = require("./config/swagger");

//Routes
const routes = require("./router/routes");

//Services
const { connectDatabase } = require("./services/database.service");

const app = express();

//UI Swagger configuration
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Facial Auth - Documentación",
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: false,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  })
);

//Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());

// Configuración CORS mejorada para desarrollo
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:5173", // Vite default
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Logging mejorado para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

//Rate limiting
const limiter = rateLimit({
  windowMs: (Number.parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: "Demasiadas peticiones, intente más tarde",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api/", limiter);

//Body parsing middlewares
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || "10mb",
  strict: true
}));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_FILE_SIZE || "10mb",
  })
);

// Middleware para logging de requests en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path} - ${req.ip}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log("📦 Body:", JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

//Api's routes
app.use("/api", routes);

//Error handling for undefined routes
app.use("*", (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Endpoint no encontrado",
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: [
      "GET /api/health",
      "POST /api/auth/register", 
      "POST /api/auth/login",
      "POST /api/auth/logout",
      "GET /api/user/profile",
      "GET /api/dashboard/stats",
      "GET /api/docs"
    ]
  });
});

//Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message 
    })
  });
});

//Start server and connect to database
async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor iniciado exitosamente`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(
        `📚 Documentación Swagger: http://localhost:${PORT}/api/docs`
      );
      console.log(`🗄️  Base de datos: PostgreSQL (Neon)`);
      console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Hora: ${new Date().toLocaleString("es-ES")}`);
      console.log(`\n📋 Endpoints disponibles:`);
      console.log(`   GET  /api/health - Estado del servidor`);
      console.log(`   POST /api/auth/register - Registro de usuario`);
      console.log(`   POST /api/auth/login - Login con credenciales`);
      console.log(`   POST /api/auth/logout - Logout`);
      console.log(`   GET  /api/user/profile - Perfil de usuario`);
      console.log(`   GET  /api/dashboard/stats - Estadísticas del dashboard`);
      console.log(`\n🔄 CORS habilitado para:`);
      corsOptions.origin.forEach(origin => console.log(`   - ${origin}`));
      console.log("");
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Recibida señal ${signal}, cerrando servidor...`);
      server.close(async () => {
        try {
          const { pool } = require("./config/database");
          await pool.end();
          console.log("✅ Conexiones de base de datos cerradas");
          console.log("✅ Servidor cerrado exitosamente");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error cerrando conexiones:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
}

startServer();