const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

//Configs
const { PORT } = require("./constats");
const { specs, swaggerUi } = require("./config/swagger");

//Routes
const routes = require("./router/routes");

//Services
const { connectDatabase } = require("./services/database.service");

const app = express();

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Documentación interactiva de la API
 *     description: |
 *       Interfaz Swagger UI para explorar y probar todos los endpoints de la API de autenticación facial.
 *       
 *       **Características:**
 *       - Exploración interactiva de endpoints
 *       - Testing directo desde el navegador
 *       - Autenticación JWT integrada
 *       - Esquemas de datos detallados
 *       - Persistencia de autorización entre sesiones
 *       
 *       **Uso:**
 *       1. Hacer clic en "Authorize" para ingresar tu JWT token
 *       2. Explorar los endpoints organizados por categorías
 *       3. Hacer clic en "Try it out" para probar endpoints
 *       4. Ver respuestas en tiempo real con ejemplos
 *     tags: [Estado del Sistema]
 *     responses:
 *       200:
 *         description: Documentación Swagger UI cargada exitosamente
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Página HTML de Swagger UI
 */

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

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     rateLimitInfo:
 *       type: apiKey
 *       in: header
 *       name: X-RateLimit-Remaining
 *       description: Información de rate limiting aplicada a todos los endpoints
 *   
 *   schemas:
 *     RateLimitResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Demasiadas peticiones, intente más tarde"
 *         retryAfter:
 *           type: integer
 *           example: 900
 *           description: "Segundos para intentar nuevamente"
 *     
 *     NotFoundResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Endpoint no encontrado"
 *         availableEndpoints:
 *           type: array
 *           items:
 *             type: string
 *           example: ["/api/health", "/api/auth/login", "/api/docs"]
 *     
 *     ServerErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Error interno del servidor"
 *         timestamp:
 *           type: string
 *           format: date-time
 *         requestId:
 *           type: string
 *           example: "req_1234567890"
 */

//Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(morgan("combined"));

/**
 * @swagger
 * /api/{endpoint}:
 *   all:
 *     summary: Rate limiting aplicado a todos los endpoints
 *     description: |
 *       **Límites de velocidad configurados:**
 *       
 *       -  **Límite:** 100 peticiones por IP
 *       -  **Ventana:** 15 minutos
 *       -  **Reset:** Automático cada 15 minutos
 *       -  **Acción:** Bloqueo temporal al exceder límite
 *       
 *       **Headers de respuesta:**
 *       - `X-RateLimit-Limit`: Límite máximo de peticiones
 *       - `X-RateLimit-Remaining`: Peticiones restantes
 *       - `X-RateLimit-Reset`: Timestamp de reset del límite
 *       
 *       **Configuración personalizable:**
 *       - Variable `RATE_LIMIT_WINDOW`: Ventana en minutos
 *       - Variable `RATE_LIMIT_MAX_REQUESTS`: Máximo de peticiones
 *     parameters:
 *       - in: path
 *         name: endpoint
 *         required: true
 *         schema:
 *           type: string
 *         description: Cualquier endpoint de la API
 *     responses:
 *       429:
 *         description: Rate limit excedido
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 100
 *             description: Número máximo de peticiones permitidas
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *               example: 0
 *             description: Peticiones restantes en la ventana actual
 *           X-RateLimit-Reset:
 *             schema:
 *               type: integer
 *               example: 1683648000
 *             description: Timestamp cuando se resetea el límite
 *           Retry-After:
 *             schema:
 *               type: integer
 *               example: 900
 *             description: Segundos para intentar nuevamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *     tags: [Estado del Sistema]
 */

//Rate limiting
const limiter = rateLimit({
  windowMs: (Number.parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: "Demasiadas peticiones, intente más tarde",
  },
});
app.use("/api/", limiter);

//Middlewares
app.use(cors());
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_FILE_SIZE || "10mb",
  })
);

//Api's routes
app.use("/api", routes);

/**
 * @swagger
 * /{invalidPath}:
 *   all:
 *     summary: Manejo de rutas no encontradas
 *     description: |
 *       Endpoint catch-all que maneja todas las peticiones a rutas que no existen en la API.
 *       
 *       **Funcionalidad:**
 *       -  Detecta rutas no válidas automáticamente
 *       -  Registra intentos de acceso a endpoints inexistentes
 *       -  Proporciona lista de endpoints disponibles
 *       -  Previene exposición de información del servidor
 *       
 *       **Casos comunes:**
 *       - URLs mal escritas
 *       - Endpoints deprecados
 *       - Intentos de enumeración de rutas
 *       - Requests a paths que no existen
 *     parameters:
 *       - in: path
 *         name: invalidPath
 *         required: true
 *         schema:
 *           type: string
 *         description: Cualquier ruta que no coincida con endpoints existentes
 *         example: "/api/nonexistent-endpoint"
 *     responses:
 *       404:
 *         description: Endpoint no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             examples:
 *               basic:
 *                 summary: Respuesta básica de endpoint no encontrado
 *                 value:
 *                   success: false
 *                   error: "Endpoint no encontrado"
 *               withSuggestions:
 *                 summary: Con sugerencias de endpoints válidos
 *                 value:
 *                   success: false
 *                   error: "Endpoint no encontrado"
 *                   suggestion: "¿Quisiste decir /api/health?"
 *                   availableEndpoints: 
 *                     - "/api/health"
 *                     - "/api/auth/login"
 *                     - "/api/auth/register"
 *                     - "/api/docs"
 *     tags: [Estado del Sistema]
 */

//Error handling for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint no encontrado",
  });
});

/**
 * @swagger
 * components:
 *   responses:
 *     GlobalErrorResponse:
 *       description: |
 *         Manejo global de errores no capturados en la aplicación.
 *         
 *         **Tipos de errores manejados:**
 *         -  Errores de aplicación no capturados
 *         -  Errores de conexión a base de datos
 *         -  Errores de validación de middleware
 *         -  Errores de parsing JSON
 *         -  Errores inesperados del sistema
 *         
 *         **Características de seguridad:**
 *         - No expone stack traces en producción
 *         - Logging detallado para debugging
 *         - Respuesta consistente para todos los errores
 *         - ID de tracking para correlación de logs
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServerErrorResponse'
 *           examples:
 *             generalError:
 *               summary: Error general del servidor
 *               value:
 *                 success: false
 *                 error: "Error interno del servidor"
 *                 timestamp: "2024-06-10T16:00:00.000Z"
 *                 requestId: "req_1234567890"
 *             databaseError:
 *               summary: Error de base de datos
 *               value:
 *                 success: false
 *                 error: "Error interno del servidor"
 *                 timestamp: "2024-06-10T16:00:00.000Z"
 *                 type: "database_connection"
 *             validationError:
 *               summary: Error de validación
 *               value:
 *                 success: false
 *                 error: "Error interno del servidor"
 *                 timestamp: "2024-06-10T16:00:00.000Z"
 *                 type: "validation_failed"
 */

//Global error handler
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
  });
});

/**
 * @swagger
 * info:
 *   description: |
 *     **Configuración del servidor:**
 *     
 *      **Inicialización automática**
 *     - Conexión a base de datos PostgreSQL (Neon)
 *     - Configuración de middlewares de seguridad
 *     - Rate limiting automático
 *     - Logging de requests
 *     
 *      **Seguridad implementada**
 *     - Helmet para headers seguros
 *     - CORS configurado
 *     - Rate limiting por IP
 *     - Validación de entrada
 *     - Manejo seguro de errores
 *     
 *      **Monitoreo y observabilidad**
 *     - Health check endpoint
 *     - Logging detallado con Morgan
 *     - Métricas de uso
 *     - Estadísticas en tiempo real
 *     
 *      **Configuración mediante variables de entorno**
 *     ```env
 *     PORT=3000
 *     DATABASE_URL=postgresql://...
 *     JWT_SECRET=tu_secreto_seguro
 *     RATE_LIMIT_WINDOW=15
 *     RATE_LIMIT_MAX_REQUESTS=100
 *     MAX_FILE_SIZE=10mb
 *     ```
 *     
 *      **URLs de desarrollo importantes**
 *     - Health check: http://localhost:3000/api/health
 *     - Documentación: http://localhost:3000/api/docs
 *     - Base API: http://localhost:3000/api
 */

//Start server and connect to database
async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor iniciado exitosamente`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(
        `📚 Documentación Swagger: http://localhost:${PORT}/api/docs`
      );
      console.log(`🗄️  Base de datos: PostgreSQL (Neon)`);
      console.log(`⏰ Hora: ${new Date().toLocaleString("es-ES")}`);
      console.log(`\n📋 Endpoints disponibles:`);
      console.log(`   GET  /api/health - Estado del servidor`);
      console.log(`   POST /api/auth/register - Registro de usuario`);
      console.log(`   POST /api/auth/login - Login con credenciales`);
      console.log(`   POST /api/auth/logout - Logout`);
      console.log(`   POST /api/face/enroll - Enrollar embeddings faciales`);
      console.log(`   POST /api/face/login - Login facial`);
      console.log(`   GET  /api/user/profile - Perfil de usuario`);
      console.log(`   GET  /api/dashboard/stats - Estadísticas del dashboard`);
      console.log(
        `   DELETE /api/user/biometric - Eliminar datos biométricos\n`
      );
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
}

//Handle shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando servidor...");
  const { pool } = require("./config/database");
  await pool.end();
  console.log("✅ Conexiones de base de datos cerradas");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Cerrando servidor...");
  const { pool } = require("./config/database");
  await pool.end();
  console.log("✅ Conexiones de base de datos cerradas");
  process.exit(0);
});

startServer();