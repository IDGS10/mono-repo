// HTTP response model
// Uses services for logic

const AuthService = require("../services/auth.service");
const UserService = require("../services/user.service");
const DashboardService = require("../services/dashboard.service");
const { pool } = require("../config/database");

module.exports = {
  /**
   * Verifies server and database health status
   */
  async checkHealth(req, res) {
    try {
      let dbStatus = 'disconnected';
      let dbError = null;

      // Verify database connection
      try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbError = error.message;
        console.error("Error connecting to database:", error);
      }

      const healthData = {
        success: true,
        message: "Server working correctly",
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

      // If DB is disconnected, change general status
      if (dbStatus === 'disconnected') {
        healthData.status = 'degraded';
        healthData.message = 'Server running with limited services';
      }

      res.status(200).json(healthData);
    } catch (error) {
      console.error("Error in checkHealth:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Returns a simple greeting from the security service
   */
  async sayHello(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: "Hello from Security Service",
        timestamp: new Date().toISOString(),
        service: "security-service",
        version: "1.0.0"
      });
    } catch (error) {
      console.error("Error in sayHello:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Registers a new user
   */
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, phone, status, rol, accepted, orgId } = req.body;

      // Basic validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: "Los campos email, password, firstName y lastName son requeridos",
          required: ["email", "password", "firstName", "lastName"]
        });
      }

      // Phone validation - make it required for new registrations
      if (!phone || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "El número de teléfono es requerido",
          required: ["phone"]
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido"
        });
      }

      // Validate password length and complexity
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres"
        });
      }

      // Validate phone format
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return res.status(400).json({
          success: false,
          message: `El teléfono debe tener entre 10 y 15 dígitos (actualmente tiene ${cleanPhone.length})`
        });
      }

      console.log('🚀 Registrando nuevo usuario:', {
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        rol: rol || 'Manager',
        status: status || 'active'
      });

      // Call authentication service
      const result = await AuthService.registerUser({
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        status: status || 'active',
        rol: rol || 'Manager',
        accepted: accepted !== undefined ? accepted : 1, // Auto-accept for direct registration
        orgId: orgId || null
      }, req.ip, req.get('User-Agent'));

      console.log('✅ Usuario registrado exitosamente:', result.user.email);

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          phone: result.user.phone,
          status: result.user.status,
          rol: result.user.rol,
          accepted: result.user.accepted,
          orgId: result.user.org_id,
          createdAt: result.user.created_at
        },
        token: result.token,
        expiresIn: result.expiresIn
      });
    } catch (error) {
      console.error("❌ Error en register:", error);

      // Handle specific errors
      if (error.message.includes('ya existe')) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario registrado con este email"
        });
      }

      if (error.message.includes('Rol inválido')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Formato de email inválido') ||
        error.message.includes('Campos requeridos faltantes') ||
        error.message.includes('debe tener entre') ||
        error.message.includes('contraseña debe tener')) {
        return res.status(400).json({
          success: false,
          message: error.message
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
   * Authenticates a user (login) - Enhanced with IP and User Agent tracking
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Add CORS headers explicitly for this endpoint
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email y contraseña son requeridos"
        });
      }

      // Get IP address and user agent for security logging
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.get('User-Agent');

      // Call authentication service with additional information
      const result = await AuthService.loginUser(
        email.toLowerCase().trim(),
        password,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
        expiresIn: result.expiresIn || '24h',
        session: {
          sessionId: result.session.sessionId,
          expiresAt: result.session.expiresAt
        }
      });
    } catch (error) {
      console.error("Error in login:", error);

      // Add CORS headers for error responses too
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      // Handle specific errors
      if (error.message.includes('Credenciales inválidas')) {
        return res.status(401).json({
          success: false,
          message: "Email o contraseña incorrectos"
        });
      }

      if (error.message.includes('Usuario desactivado')) {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated. Contact the administrator."
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error while logging in",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Logs out the user
   */
  async logout(req, res) {
    try {
      // Token comes from authentication middleware
      const token = req.headers["authorization"]?.split(" ")[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token not provided"
        });
      }

      // Call authentication service
      await AuthService.logoutUser(token);

      res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente"
      });
    } catch (error) {
      console.error("Error in logout:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while logging out",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Gets the authenticated user's profile
   */
  async getUserProfile(req, res) {
    try {
      // userId comes from authentication middleware
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User not identified"
        });
      }

      // Call user service
      const result = await UserService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        user: result.user
      });
    } catch (error) {
      console.error("Error in getUserProfile:", error);

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error while getting profile",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Gets dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      // Call dashboard service
      const result = await DashboardService.getDashboardStats();

      res.status(200).json({
        success: true,
        stats: result.stats
      });
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while getting statistics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Updates the authenticated user's profile
   */
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;

      // Validate that there's data to update
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No data provided to update"
        });
      }

      // Call user service
      const result = await UserService.updateUserProfile(userId, updateData);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: result.user
      });
    } catch (error) {
      console.error("Error in updateUserProfile:", error);

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      if (error.message.includes('Rol inválido')) {
        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error while updating profile",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Gets the user's session history
   */
  async getUserSessions(req, res) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 10;

      // Call user service
      const result = await UserService.getUserSessions(userId, limit);

      res.status(200).json({
        success: true,
        sessions: result.sessions
      });
    } catch (error) {
      console.error("Error in getUserSessions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while getting sessions",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Gets specific statistics for the authenticated user
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.userId;

      // Call dashboard service
      const result = await DashboardService.getUserStats(userId);

      res.status(200).json({
        success: true,
        userStats: result.userStats
      });
    } catch (error) {
      console.error("Error in getUserStats:", error);

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error while getting user statistics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Registers a user from organization invitation
   */
  async registerFromInvitation(req, res) {
    try {
      const { 
        first_name, 
        last_name, 
        email, 
        password_hash, 
        phone, 
        rol, 
        org_id 
      } = req.body;

      console.log('🔄 Registrando usuario desde invitación:', { email, rol, org_id });

      // Validate required fields
      if (!first_name || !last_name || !email || !password_hash || !rol) {
        return res.status(400).json({
          success: false,
          message: "Datos requeridos: first_name, last_name, email, password_hash, rol"
        });
      }

      // Call authentication service with pre-hashed password
      const result = await AuthService.registerUser({
        email: email.toLowerCase().trim(),
        password: password_hash, // Ya viene hasheada desde organizations
        firstName: first_name.trim(),
        lastName: last_name.trim(),
        phone: phone ? phone.trim() : null,
        status: 'active',
        rol: rol,
        accepted: 1, // Usuario aceptado automáticamente por invitación
        orgId: org_id || null,
        isPreHashed: true // Indicar que la contraseña ya está hasheada
      }, req.ip, req.get('User-Agent'));

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente desde invitación",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          phone: result.user.phone,
          status: result.user.status,
          rol: result.user.rol,
          accepted: result.user.accepted,
          orgId: result.user.org_id,
          createdAt: result.user.created_at
        }
      });
    } catch (error) {
      console.error("Error in registerFromInvitation:", error);

      if (error.message.includes('ya existe')) {
        return res.status(409).json({
          success: false,
          message: "El usuario ya existe con ese email"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al registrar usuario desde invitación",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Checks if a user exists by email
   */
  async checkUserExists(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email es requerido"
        });
      }

      const user = await AuthService.getUserByEmail(email.toLowerCase().trim());
      
      res.status(200).json({
        success: true,
        exists: !!user,
        email: email.toLowerCase().trim()
      });
    } catch (error) {
      console.error("Error in checkUserExists:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Gets user by email
   */
  async getUserByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email es requerido"
        });
      }

      const user = await AuthService.getUserByEmail(email.toLowerCase().trim());
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          status: user.status,
          rol: user.rol,
          accepted: user.accepted,
          orgId: user.org_id,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};