// Working AuthService implementation
require('dotenv').config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET, SESSION_TIMEOUT, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION } = require("../config/constats");
const ValidationUtils = require("../utils/validationUtils");

/**
 * Get database pool, loading it on demand
 */
function getPool() {
  try {
    const { pool } = require("../config/database");
    return pool;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw new Error("Database not available: " + error.message);
  }
}

class AuthService {
  /**
   * Register a new user
   */
  async registerUser(originalUserData, ipAddress = null, userAgent = null) {
    try {
      // Validate and sanitize input data
      const validation = ValidationUtils.validateUserRegistration(originalUserData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const { email, firstName, lastName, password } = validation.sanitizedData;
      const { phone, status = 'active', rol = 'Manager', accepted = 0, orgId = null, isPreHashed = false } = originalUserData;

      // Validate rol
      const validRoles = ['Manager', 'Project manager', 'Organization', 'Cluster manager'];
      if (!validRoles.includes(rol)) {
        throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Hash password only if not already hashed
      let hashedPassword;
      if (isPreHashed) {
        hashedPassword = password; // La contraseña ya viene hasheada
        console.log('🔐 Usando contraseña pre-hasheada para usuario:', email);
      } else {
        hashedPassword = await bcrypt.hash(password, 12);
        console.log('🔐 Hasheando contraseña para usuario:', email);
      }

      // Insert user into database
      const result = await getPool().query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, status, rol, accepted, org_id, created_at, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), true) 
         RETURNING id, email, first_name, last_name, phone, status, rol, accepted, org_id, created_at`,
        [email.toLowerCase(), hashedPassword, firstName, lastName, phone, status, rol, accepted, orgId]
      );

      const newUser = result.rows[0];

      // Generate JWT token for the new user (for testing purposes)
      const tokenPayload = {
        userId: newUser.id,
        email: newUser.email,
        sessionId: Date.now(),
        iat: Math.floor(Date.now() / 1000)
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: SESSION_TIMEOUT || '24h',
        issuer: 'security-system',
        audience: 'mono-repo-frontend'
      });

      // Create session in database
      const sessionResult = await this.createSession(newUser.id, token, ipAddress, userAgent);

      return {
        success: true,
        user: newUser,
        token,
        session: sessionResult,
        expiresIn: SESSION_TIMEOUT || '24h'
      };
    } catch (error) {
      throw new Error(`Error al registrar usuario: ${error.message}`);
    }
  }

  /**
   * Login user with enhanced security
   */
  async loginUser(email, password, ipAddress = null, userAgent = null) {
    try {
      // Find user by email
      const user = await this.findUserByEmail(email);
      if (!user) {
        await this.logLoginAttempt(email, false, 'Usuario no encontrado', ipAddress, userAgent);
        throw new Error('Credenciales inválidas');
      }

      // Check if user is active
      if (!user.is_active) {
        await this.logLoginAttempt(email, false, 'Usuario desactivado', ipAddress, userAgent);
        throw new Error('Usuario desactivado');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await this.logLoginAttempt(email, false, 'Contraseña incorrecta', ipAddress, userAgent);
        throw new Error('Credenciales inválidas');
      }

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        sessionId: Date.now(),
        iat: Math.floor(Date.now() / 1000)
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: SESSION_TIMEOUT || '24h',
        issuer: 'security-system',
        audience: 'mono-repo-frontend'
      });

      // Create session in database
      const sessionResult = await this.createSession(user.id, token, ipAddress, userAgent);

      // Log successful attempt
      await this.logLoginAttempt(email, true, null, ipAddress, userAgent);

      // Update last_login timestamp
      await getPool().query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      return {
        success: true,
        token,
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
          isActive: user.is_active
        },
        session: sessionResult,
        expiresIn: SESSION_TIMEOUT || '24h'
      };
    } catch (error) {
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }
  }

  /**
   * Validate session
   */
  async validateSession(token) {
    try {
      // Verify JWT
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, JWT_SECRET);
      } catch (jwtError) {
        console.error("JWT validation failed:", jwtError.message);
        return null;
      }

      // Check session in database
      const result = await getPool().query(
        `SELECT ls.id as session_id, ls.user_id, ls.expires_at, ls.is_active, 
                u.email, u.first_name, u.last_name, u.is_active as user_active
         FROM login_sessions ls 
         JOIN users u ON u.id = ls.user_id 
         WHERE ls.token_hash = $1 AND ls.is_active = true`,
        [token]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const sessionData = result.rows[0];
      const now = new Date();

      // Check if session has expired
      if (new Date(sessionData.expires_at) < now) {
        await getPool().query(
          'UPDATE login_sessions SET is_active = false WHERE token_hash = $1',
          [token]
        );
        return null;
      }

      // Check if user is still active
      if (!sessionData.user_active) {
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error("Error validating session:", error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logoutUser(token) {
    try {
      const result = await getPool().query(
        'UPDATE login_sessions SET is_active = false WHERE token_hash = $1 RETURNING user_id',
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Sesión no encontrada');
      }

      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
  }

  /**
   * Create session
   */
  async createSession(userId, token, ipAddress = null, userAgent = null) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const result = await getPool().query(
        `INSERT INTO login_sessions (user_id, token_hash, ip_address, user_agent, expires_at, created_at, is_active) 
         VALUES ($1, $2, $3, $4, $5, NOW(), true) 
         RETURNING id, expires_at`,
        [userId, token, ipAddress, userAgent, expiresAt]
      );

      return {
        sessionId: result.rows[0].id,
        expiresAt: result.rows[0].expires_at
      };
    } catch (error) {
      throw new Error(`Error al crear sesión: ${error.message}`);
    }
  }

  /**
   * Log login attempts
   */
  async logLoginAttempt(email, success, failureReason = null, ipAddress = null, userAgent = null) {
    try {
      await getPool().query(
        `INSERT INTO login_attempts (email, ip_address, success, failure_reason, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [email.toLowerCase(), ipAddress, success, failureReason, userAgent]
      );
    } catch (error) {
      console.error("Error logging login attempt:", error);
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email) {
    try {
      const result = await getPool().query(
        'SELECT id, email, password_hash, first_name, last_name, phone, status, rol, accepted, org_id, is_active FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const result = await getPool().query(
        'SELECT id, email, first_name, last_name, phone, status, rol, accepted, org_id, is_active, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener perfil del usuario: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const { firstName, lastName, phone, status, rol, accepted, orgId } = updateData;

      // Validate rol if provided
      if (rol) {
        const validRoles = ['Propietario', 'Lider', 'Encargado'];
        if (!validRoles.includes(rol)) {
          throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
        }
      }

      const result = await getPool().query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name), 
             last_name = COALESCE($2, last_name), 
             phone = COALESCE($3, phone),
             status = COALESCE($4, status),
             rol = COALESCE($5, rol),
             accepted = COALESCE($6, accepted),
             org_id = COALESCE($7, org_id),
             updated_at = NOW()
         WHERE id = $8 
         RETURNING id, email, first_name, last_name, phone, status, rol, accepted, org_id, updated_at`,
        [firstName, lastName, phone, status, rol, accepted, orgId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        status: user.status,
        rol: user.rol,
        accepted: user.accepted,
        orgId: user.org_id,
        updatedAt: user.updated_at
      };
    } catch (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }
  }

  /**
   * Get user by email (public method for external services)
   */
  async getUserByEmail(email) {
    return await this.findUserByEmail(email);
  }
}

module.exports = new AuthService();

// Export the service instance
console.log("Creating AuthService instance...");
const authService = new AuthService();
console.log("AuthService created successfully");
console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(authService)));

module.exports = authService;