const express = require("express");
const router = express.Router();
const Controller = require("../controller/controller");
const { authenticateToken } = require("../middleware/middleware");

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado del servidor
 *     description: Endpoint para verificar que el servidor esté funcionando y conectado a la base de datos
 *     tags: [Estado del Sistema]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *       500:
 *         description: Error del servidor
 */
router.get("/health", Controller.checkHealth);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     description: Crea una nueva cuenta de usuario con credenciales básicas
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: Usuario ya existe
 *       500:
 *         description: Error interno del servidor
 */
router.post("/auth/register", Controller.registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login con credenciales
 *     description: Autenticación de usuario con email y contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Credenciales faltantes
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
router.post("/auth/login", Controller.loginSession);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Desactiva la sesión activa del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 *       401:
 *         description: Token requerido o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.post("/auth/logout", authenticateToken(), Controller.logoutSession);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Obtener perfil de usuario
 *     description: Obtiene la información del perfil del usuario autenticado
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       401:
 *         description: Token requerido o inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/user/profile", authenticateToken(), Controller.getUserProfile);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     description: Obtiene estadísticas generales del sistema para el usuario autenticado
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: Token requerido o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get("/dashboard/stats", authenticateToken(), Controller.getDashboardStats);

module.exports = router;