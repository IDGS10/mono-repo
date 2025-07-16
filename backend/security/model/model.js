// model/model.js
// Modelo refactorizado que actúa como controlador de respuestas HTTP
// Usa los servicios para la lógica de negocio

const AuthService = require("../services/auth.service");
const UserService = require("../services/user.service");
const DashboardService = require("../services/dashboard.service");
const { pool } = require("../config/database");

module.exports = {
  /**
   * Verifica el estado de salud del servidor y base de datos
   */
  async checkHealth(req, res) {
    try {
      let dbStatus = 'disconnected';
      let dbError = null;

      // Verificar conexión a la base de datos
      try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbError = error.message;
        console.error("Error conectando a la base de datos:", error);
      }

      const healthData = {
        success: true,
        message: "Servidor funcionando correctamente",
        timestamp: new Date().toISOString(),
        status: "healthy",
        services: {
          database: {
            status: dbStatus,
            error: dbError
          },
          server: {
            status: "running",
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
          }
        }
      };

      // Si la DB está desconectada, cambiar el status general
      if (dbStatus === 'disconnected') {
        healthData.status = 'degraded';
        healthData.message = 'Servidor funcionando con servicios limitados';
      }

      res.status(200).json(healthData);
    } catch (error) {
      console.error("Error en checkHealth:", error);
      res.status(500).json({
        success: false,
        message: "Error del servidor",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Registra un nuevo usuario
   */
  async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Validación básica
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos",
          required: ["email", "password", "firstName", "lastName"]
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido"
        });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres"
        });
      }

      // Llamar al servicio de autenticación
      const result = await AuthService.registerUser({
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          createdAt: result.user.created_at
        }
      });
    } catch (error) {
      console.error("Error en register:", error);
      
      // Manejar errores específicos
      if (error.message.includes('ya existe')) {
        return res.status(409).json({
          success: false,
          message: "El usuario ya existe con ese email"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al registrar usuario",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Autentica un usuario (login)
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validación básica
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email y contraseña son requeridos"
        });
      }

      // Llamar al servicio de autenticación
      const result = await AuthService.loginUser(email.toLowerCase().trim(), password);

      // Actualizar último login
      // await UserService.updateLastLogin(result.user.id);

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        token: result.token,
        user: result.user,
        expiresIn: '24h'
      });
    } catch (error) {
      console.error("Error en login:", error);
      
      // Manejar errores específicos
      if (error.message.includes('Credenciales inválidas')) {
        return res.status(401).json({
          success: false,
          message: "Email o contraseña incorrectos"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al iniciar sesión",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Cierra sesión del usuario
   */
  async logout(req, res) {
    try {
      // El token viene del middleware de autenticación
      const token = req.headers["authorization"]?.split(" ")[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token no proporcionado"
        });
      }

      // Llamar al servicio de autenticación
      await AuthService.logoutUser(token);

      res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente"
      });
    } catch (error) {
      console.error("Error en logout:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al cerrar sesión",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getUserProfile(req, res) {
    try {
      // El userId viene del middleware de autenticación
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Usuario no identificado"
        });
      }

      // Llamar al servicio de usuario
      const result = await UserService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        user: result.user
      });
    } catch (error) {
      console.error("Error en getUserProfile:", error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener perfil",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obtiene estadísticas del dashboard
   */
  async getDashboardStats(req, res) {
    try {
      // Llamar al servicio de dashboard
      const result = await DashboardService.getDashboardStats();

      res.status(200).json({
        success: true,
        stats: result.stats
      });
    } catch (error) {
      console.error("Error en getDashboardStats:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Actualiza el perfil del usuario autenticado
   */
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;

      // Validar que hay datos para actualizar
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se proporcionaron datos para actualizar"
        });
      }

      // Llamar al servicio de usuario
      const result = await UserService.updateUserProfile(userId, updateData);

      res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        user: result.user
      });
    } catch (error) {
      console.error("Error en updateUserProfile:", error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar perfil",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obtiene el historial de sesiones del usuario
   */
  async getUserSessions(req, res) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 10;

      // Llamar al servicio de usuario
      const result = await UserService.getUserSessions(userId, limit);

      res.status(200).json({
        success: true,
        sessions: result.sessions
      });
    } catch (error) {
      console.error("Error en getUserSessions:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener sesiones",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obtiene estadísticas específicas del usuario autenticado
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.userId;

      // Llamar al servicio de dashboard
      const result = await DashboardService.getUserStats(userId);

      res.status(200).json({
        success: true,
        userStats: result.userStats
      });
    } catch (error) {
      console.error("Error en getUserStats:", error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas de usuario",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};