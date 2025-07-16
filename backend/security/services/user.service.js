// services/user.service.js
// Servicio para manejar la lógica de usuarios
const { pool } = require("../config/database");

class UserService {
  /**
   * Obtiene el perfil completo de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} - Datos del perfil del usuario
   */
  async getUserProfile(userId) {
    try {
      const result = await pool.query(
        `SELECT id, email, first_name, last_name, created_at, updated_at, 
                last_login, profile_picture, phone, is_active
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const user = result.rows[0];
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login,
          profilePicture: user.profile_picture,
          phone: user.phone,
          isActive: user.is_active
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener perfil: ${error.message}`);
    }
  }

  /**
   * Actualiza el perfil de un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Object} - Usuario actualizado
   */
  async updateUserProfile(userId, updateData) {
    try {
      const { firstName, lastName, phone, profilePicture } = updateData;
      
      const result = await pool.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone = COALESCE($3, phone),
             profile_picture = COALESCE($4, profile_picture),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, email, first_name, last_name, phone, profile_picture, updated_at`,
        [firstName, lastName, phone, profilePicture, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      return {
        success: true,
        user: result.rows[0]
      };
    } catch (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }
  }

  /**
   * Obtiene el historial de sesiones de un usuario
   * @param {number} userId - ID del usuario
   * @param {number} limit - Límite de resultados
   * @returns {Object} - Historial de sesiones
   */
  async getUserSessions(userId, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT id, created_at, expires_at, is_active, 
                CASE WHEN expires_at > NOW() AND is_active = true THEN 'active' ELSE 'expired' END as status
         FROM login_sessions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return {
        success: true,
        sessions: result.rows
      };
    } catch (error) {
      throw new Error(`Error al obtener sesiones: ${error.message}`);
    }
  }

  /**
   * Actualiza la fecha de último login
   * @param {number} userId - ID del usuario
   * @returns {void}
   */
  async updateLastLogin(userId) {
    try {
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error al actualizar último login:', error);
      // No lanzamos error porque no es crítico
    }
  }

  /**
   * Desactiva un usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} - Resultado de la operación
   */
  async deactivateUser(userId) {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET is_active = false, updated_at = NOW() 
         WHERE id = $1 
         RETURNING id, email, is_active`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      // También desactivar todas las sesiones activas
      await pool.query(
        'UPDATE login_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );

      return {
        success: true,
        message: 'Usuario desactivado exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al desactivar usuario: ${error.message}`);
    }
  }

  /**
   * Busca usuarios por criterios
   * @param {Object} searchCriteria - Criterios de búsqueda
   * @returns {Object} - Usuarios encontrados
   */
  async searchUsers(searchCriteria) {
    try {
      const { email, firstName, lastName, isActive, limit = 50 } = searchCriteria;
      
      let query = `
        SELECT id, email, first_name, last_name, created_at, last_login, is_active
        FROM users 
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (email) {
        query += ` AND email ILIKE $${paramIndex}`;
        params.push(`%${email}%`);
        paramIndex++;
      }

      if (firstName) {
        query += ` AND first_name ILIKE $${paramIndex}`;
        params.push(`%${firstName}%`);
        paramIndex++;
      }

      if (lastName) {
        query += ` AND last_name ILIKE $${paramIndex}`;
        params.push(`%${lastName}%`);
        paramIndex++;
      }

      if (typeof isActive === 'boolean') {
        query += ` AND is_active = $${paramIndex}`;
        params.push(isActive);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await pool.query(query, params);

      return {
        success: true,
        users: result.rows,
        count: result.rows.length
      };
    } catch (error) {
      throw new Error(`Error al buscar usuarios: ${error.message}`);
    }
  }
}

module.exports = new UserService();