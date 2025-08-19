const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Authentication System - API",
      version: "1.0.0",
      description: `
        Complete API for facial recognition system with biometric authentication.
        
        **Main Features:**
        - 🔐 Facial recognition authentication
        - 🛡️ JWT tokens for security
        - 📊 Complete access auditing
        - 🗄️ PostgreSQL database
        - 🚀 Production optimized
        
        **Authentication Flow:**
        1. User registration with credentials
        2. Facial embeddings enrollment
        3. Facial login with liveness detection
        4. Access to protected resources with JWT
      `,
      contact: {
        name: "Development Team",
        email: "support@faceauth.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://server-uteq.nrsoftware.online/security/api",
        description: "Development server",
      },
      {
        url: "https://api.faceauth.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from login",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            phone: { type: "string", example: "3001234567" },
            idNumber: { type: "string", example: "12345678" },
            createdAt: { type: "string", format: "date-time" },
            biometricEnabled: { type: "boolean", example: true },
            activeSessions: { type: "integer", example: 1 },
          },
        },
        LoginCredentials: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        RegisterUser: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
            phone: { type: "string", example: "3001234567" },
            idNumber: { type: "string", example: "12345678" },
          },
        },
        FaceEmbedding: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "array",
              items: { type: "number" },
              example: [0.1, 0.2, 0.3, -0.1, 0.5],
              description:
                "Array of numbers representing the facial embedding (typically 128 or 512 dimensions)",
            },
            type: {
              type: "string",
              enum: ["normal", "smile", "eyes_closed"],
              example: "normal",
              description: "Type of facial capture",
            },
            quality: {
              type: "number",
              minimum: 0,
              maximum: 1,
              example: 0.95,
              description: "Embedding quality score (0-1)",
            },
          },
        },
        FaceLogin: {
          type: "object",
          required: ["embedding"],
          properties: {
            embedding: {
              type: "array",
              items: { type: "number" },
              example: [0.1, 0.2, 0.3, -0.1, 0.5],
              description: "Facial embedding for comparison",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Error description" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        FaceLoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Facial login successful" },
            userToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: { $ref: "#/components/schemas/User" },
            similarity: {
              type: "string",
              example: "0.876",
              description: "Facial similarity score",
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            status: { type: "string", example: "online" },
            timestamp: { type: "string", format: "date-time" },
            database: { type: "string", example: "connected" },
            database_type: { type: "string", example: "PostgreSQL" },
            stats: {
              type: "object",
              properties: {
                total_users: { type: "integer", example: 5 },
                active_sessions: { type: "integer", example: 2 },
              },
            },
          },
        },
        DashboardStats: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            stats: {
              type: "object",
              properties: {
                totalLogins: { type: "integer", example: 25 },
                activeSessions: { type: "integer", example: 1 },
                biometricEnabled: { type: "boolean", example: true },
                averageQuality: { type: "number", example: 0.85 },
                recentActivity: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      email: { type: "string", example: "john@example.com" },
                      ip_address: { type: "string", example: "192.168.1.1" },
                      success: { type: "boolean", example: true },
                      failure_reason: { type: "string", nullable: true },
                      user_agent: { type: "string", example: "Mozilla/5.0..." },
                      created_at: { type: "string", format: "date-time" },
                    },
                  },
                },
                biometricData: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      capture_type: { type: "string", example: "normal" },
                      quality_score: { type: "number", example: 0.95 },
                      created_at: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "System Status",
        description:
          "Endpoints to check server and database status",
      },
      {
        name: "Authentication",
        description: "Endpoints for user registration, login and logout",
      },
      {
        name: "Facial Biometry",
        description: "Endpoints for enrollment and facial authentication",
      },
      {
        name: "User",
        description: "Endpoints for user profile management",
      },
      {
        name: "Dashboard",
        description: "Endpoints for statistics and dashboard data",
      },
    ],
  },
  apis: ["./routes.js"],
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
};
