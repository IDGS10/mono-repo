// Service to handle user logic
const { pool } = require("../config/database");

class UserService {
  /**
   * Gets the complete profile of a user
   * @param {number} userId - User ID
   * @returns {Object} - User profile data
   */
  async getUserProfile(userId) {
    try {
      const result = await pool.query(
        `SELECT id, email, first_name, last_name, created_at, updated_at, 
                last_login, profile_picture, phone, is_active, rol, status
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
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
          isActive: user.is_active,
          rol: user.rol,
          status: user.status
        }
      };
    } catch (error) {
      throw new Error(`Error getting profile: ${error.message}`);
    }
  }

  /**
   * Updates a user's profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} - Updated user
   */
  async updateUserProfile(userId, updateData) {
    try {
      const { firstName, lastName, phone, profilePicture, rol } = updateData;

      // Validate rol if provided
      if (rol) {
        const validRoles = ['Propietario', 'Lider', 'Encargado'];
        if (!validRoles.includes(rol)) {
          throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
        }
      }

      const result = await pool.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone = COALESCE($3, phone),
             profile_picture = COALESCE($4, profile_picture),
             rol = COALESCE($5, rol),
             updated_at = NOW()
         WHERE id = $6
         RETURNING id, email, first_name, last_name, phone, profile_picture, rol, updated_at`,
        [firstName, lastName, phone, profilePicture, rol, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          profilePicture: user.profile_picture,
          rol: user.rol,
          updatedAt: user.updated_at
        }
      };
    } catch (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }
  }

  /**
   * Gets a user's session history
   * @param {number} userId - User ID
   * @param {number} limit - Results limit
   * @returns {Object} - Session history
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
      throw new Error(`Error getting sessions: ${error.message}`);
    }
  }

  /**
   * Updates the last login date
   * @param {number} userId - User ID
   * @returns {void}
   */
  async updateLastLogin(userId) {
    try {
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      // We don't throw error because it's not critical
    }
  }

  /**
   * Deactivates a user
   * @param {number} userId - User ID
   * @returns {Object} - Operation result
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
        throw new Error('User not found');
      }

      // Also deactivate all active sessions
      await pool.query(
        'UPDATE login_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );

      return {
        success: true,
        message: 'User deactivated successfully'
      };
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }

  /**
   * Searches users by criteria
   * @param {Object} searchCriteria - Search criteria
   * @returns {Object} - Found users
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