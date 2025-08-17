const express = require("express");
const router = express.Router();
const Controller = require("../controller/controller");

// ===== IMPORT SHARED MIDDLEWARE =====
const { createMiddleware } = require('@mono-repo/shared-middleware');

// Configure middleware (reuse the same configuration from server)
const middleware = createMiddleware({
  serviceName: 'security-service',
  jwtSecret: process.env.JWT_SECRET,
  databasePool: null // Will be configured automatically from server.js
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server status
 *     description: Endpoint to verify that the server is running and connected to the database
 *     tags: [System Status]
 *     responses:
 *       200:
 *         description: Server running correctly
 *       500:
 *         description: Server error
 */
router.get("/health", Controller.checkHealth);

/**
 * @swagger
 * /hello:
 *   get:
 *     summary: Get service greeting
 *     description: Returns a simple greeting from the security service
 *     tags: [System Status]
 *     responses:
 *       200:
 *         description: Greeting message
 */
router.get("/hello", Controller.sayHello);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     description: Creates a new user account with basic credentials
 *     tags: [Authentication]
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
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post("/auth/register", 
  Controller.registerUser
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with credentials
 *     description: User authentication with email and password
 *     tags: [Authentication]
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
 *         description: Successful login
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/auth/login", 
  Controller.loginSession
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: Deactivates the active session of the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful logout
 *       401:
 *         description: Token required or invalid
 *       500:
 *         description: Internal server error
 */
router.post("/auth/logout", 
  middleware.authenticateToken(), // No specific types = any authenticated user
  Controller.logoutSession
);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Gets the profile information of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Token required or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/user/profile", 
  middleware.authenticateToken(), 
  Controller.getUserProfile
);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Gets general system statistics for the authenticated user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Token required or invalid
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard/stats", 
  middleware.authenticateToken(['Propietario', 'Lider']), // Solo estos roles
  Controller.getDashboardStats
);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the profile information of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [Owner, Leader, Manager]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized token
 *       500:
 *         description: Internal server error
 */
router.put("/user/profile", 
  middleware.authenticateToken(),
  Controller.updateUserProfile
);

/**
 * @swagger
 * /user/sessions:
 *   get:
 *     summary: Get user active sessions
 *     description: Returns all active sessions of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *       401:
 *         description: Unauthorized token
 *       500:
 *         description: Internal server error
 */
router.get("/user/sessions", 
  middleware.authenticateToken(),
  middleware.validatePagination(), // Automatic pagination validation
  Controller.getUserSessions
);

/**
 * @swagger
 * /user/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Returns activity statistics of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized token
 *       500:
 *         description: Internal server error
 */
router.get("/user/stats", 
  middleware.authenticateToken(), 
  Controller.getUserStats
);
module.exports = router;