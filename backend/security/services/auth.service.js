// Servicio para manejar la lógica de autenticación
const { pool } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../config/constats");

class AuthService {
  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} userData - Datos del usuario (email, password, firstName, lastName)
   * @returns {Object} - Resultado del registro
   */
  async registerUser(userData) {
    const { email, password, firstName, lastName } = userData;
    
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario en la base de datos
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING id, email, first_name, last_name, created_at`,
        [email, hashedPassword, firstName, lastName]
      );

      return {
        success: true,
        user: result.rows[0]
      };
    } catch (error) {
      throw new Error(`Error al registrar usuario: ${error.message}`);
    }
  }

  /**
   * Autentica un usuario con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Object} - Resultado del login con token
   */
  async loginUser(email, password) {
    try {
      // Buscar usuario por email
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Crear sesión en la base de datos
      const sessionResult = await this.createSession(user.id, token);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        },
        session: sessionResult
      };
    } catch (error) {
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }
  }

  /**
   * Cierra sesión del usuario
   * @param {string} token - Token de la sesión
   * @returns {Object} - Resultado del logout
   */
  async logoutUser(token) {
    try {
      // Desactivar sesión en la base de datos
      await pool.query(
        'UPDATE login_sessions SET is_active = false WHERE token_hash = $1',
        [token]
      );

      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
  }

  /**
   * Busca un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Object|null} - Usuario encontrado o null
   */
  async findUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, first_name, last_name, created_at FROM users WHERE email = $1',
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  /**
   * Crea una nueva sesión para el usuario
   * @param {number} userId - ID del usuario
   * @param {string} token - Token de la sesión
   * @returns {Object} - Datos de la sesión creada
   */
  async createSession(userId, token) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const result = await pool.query(
        `INSERT INTO login_sessions (user_id, token_hash, expires_at, created_at, is_active) 
         VALUES ($1, $2, $3, NOW(), true) 
         RETURNING id, expires_at`,
        [userId, token, expiresAt]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al crear sesión: ${error.message}`);
    }
  }

  /**
   * Valida si un token es válido y está activo
   * @param {string} token - Token a validar
   * @returns {Object|null} - Datos de la sesión o null si es inválida
   */
  async validateSession(token) {
    try {
      const result = await pool.query(
        `SELECT ls.user_id, ls.expires_at, ls.is_active, u.email, u.first_name, u.last_name
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

      // Verificar si el token ha expirado
      if (new Date(sessionData.expires_at) < now) {
        // Desactivar sesión expirada
        await pool.query(
          'UPDATE login_sessions SET is_active = false WHERE token_hash = $1',
          [token]
        );
        return null;
      }

      return sessionData;
    } catch (error) {
      throw new Error(`Error al validar sesión: ${error.message}`);
    }
  }
}

module.exports = new AuthService();