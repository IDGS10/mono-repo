// services/dashboard.service.js
// Servicio para manejar la lógica del dashboard y estadísticas
const { pool } = require("../config/database");

class DashboardService {
  /**
   * Obtiene estadísticas generales del sistema
   * @returns {Object} - Estadísticas del dashboard
   */
  async getDashboardStats() {
    try {
      const stats = await Promise.all([
        this.getTotalUsers(),
        this.getActiveUsers(),
        this.getTotalSessions(),
        this.getAverageSessionTime(),
        this.getRegistrationStats(),
        this.getLoginStats()
      ]);

      return {
        success: true,
        stats: {
          totalUsers: stats[0],
          activeUsers: stats[1],
          totalSessions: stats[2],
          avgSessionTime: stats[3],
          registrationStats: stats[4],
          loginStats: stats[5],
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtiene el total de usuarios registrados
   * @returns {number} - Total de usuarios
   */
  async getTotalUsers() {
    try {
      const result = await pool.query('SELECT COUNT(*) as total FROM users');
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('Error al obtener total de usuarios:', error);
      return 0;
    }
  }

  /**
   * Obtiene el número de usuarios activos
   * @returns {number} - Usuarios activos
   */
  async getActiveUsers() {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as active FROM users WHERE is_active = true'
      );
      return parseInt(result.rows[0].active);
    } catch (error) {
      console.error('Error al obtener usuarios activos:', error);
      return 0;
    }
  }

  /**
   * Obtiene el total de sesiones
   * @returns {number} - Total de sesiones
   */
  async getTotalSessions() {
    try {
      const result = await pool.query('SELECT COUNT(*) as total FROM login_sessions');
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('Error al obtener total de sesiones:', error);
      return 0;
    }
  }

  /**
   * Calcula el tiempo promedio de sesión en minutos
   * @returns {number} - Tiempo promedio en minutos
   */
  async getAverageSessionTime() {
    try {
      const result = await pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (expires_at - created_at))/60) as avg_time
        FROM login_sessions 
        WHERE is_active = false AND expires_at > created_at
      `);
      
      return result.rows[0].avg_time ? Math.round(result.rows[0].avg_time) : 0;
    } catch (error) {
      console.error('Error al calcular tiempo promedio de sesión:', error);
      return 0;
    }
  }

  /**
   * Obtiene estadísticas de registros por período
   * @param {number} days - Días hacia atrás para calcular
   * @returns {Object} - Estadísticas de registro
   */
  async getRegistrationStats(days = 30) {
    try {
      const result = await pool.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as count
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `);

      const today = await pool.query(`
        SELECT COUNT(*) as today_count
        FROM users 
        WHERE DATE_TRUNC('day', created_at) = DATE_TRUNC('day', NOW())
      `);

      const thisWeek = await pool.query(`
        SELECT COUNT(*) as week_count
        FROM users 
        WHERE created_at >= DATE_TRUNC('week', NOW())
      `);

      const thisMonth = await pool.query(`
        SELECT COUNT(*) as month_count
        FROM users 
        WHERE created_at >= DATE_TRUNC('month', NOW())
      `);

      return {
        daily: result.rows,
        today: parseInt(today.rows[0].today_count),
        thisWeek: parseInt(thisWeek.rows[0].week_count),
        thisMonth: parseInt(thisMonth.rows[0].month_count)
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de registro:', error);
      return {
        daily: [],
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      };
    }
  }

  /**
   * Obtiene estadísticas de logins por período
   * @param {number} days - Días hacia atrás para calcular
   * @returns {Object} - Estadísticas de login
   */
  async getLoginStats(days = 30) {
    try {
      const result = await pool.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as count
        FROM login_sessions 
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `);

      const activeSessions = await pool.query(`
        SELECT COUNT(*) as active_count
        FROM login_sessions 
        WHERE is_active = true AND expires_at > NOW()
      `);

      const todaySessions = await pool.query(`
        SELECT COUNT(*) as today_count
        FROM login_sessions 
        WHERE DATE_TRUNC('day', created_at) = DATE_TRUNC('day', NOW())
      `);

      return {
        daily: result.rows,
        activeSessions: parseInt(activeSessions.rows[0].active_count),
        todaySessions: parseInt(todaySessions.rows[0].today_count)
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de login:', error);
      return {
        daily: [],
        activeSessions: 0,
        todaySessions: 0
      };
    }
  }

  /**
   * Obtiene estadísticas específicas para un usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} - Estadísticas del usuario
   */
  async getUserStats(userId) {
    try {
      const userInfo = await pool.query(`
        SELECT email, first_name, last_name, created_at, last_login, is_active
        FROM users 
        WHERE id = $1
      `, [userId]);

      if (userInfo.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const sessionCount = await pool.query(`
        SELECT COUNT(*) as total_sessions
        FROM login_sessions 
        WHERE user_id = $1
      `, [userId]);

      const activeSessions = await pool.query(`
        SELECT COUNT(*) as active_sessions
        FROM login_sessions 
        WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
      `, [userId]);

      const lastSessions = await pool.query(`
        SELECT created_at, expires_at, is_active
        FROM login_sessions 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `, [userId]);

      return {
        success: true,
        userStats: {
          user: userInfo.rows[0],
          totalSessions: parseInt(sessionCount.rows[0].total_sessions),
          activeSessions: parseInt(activeSessions.rows[0].active_sessions),
          recentSessions: lastSessions.rows
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del usuario: ${error.message}`);
    }
  }

  /**
   * Obtiene métricas de rendimiento del sistema
   * @returns {Object} - Métricas del sistema
   */
  async getSystemMetrics() {
    try {
      const dbSize = await pool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `);

      const tableStats = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
        ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
      `);

      return {
        success: true,
        metrics: {
          databaseSize: dbSize.rows[0].database_size,
          tableStats: tableStats.rows,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener métricas del sistema: ${error.message}`);
    }
  }
}

module.exports = new DashboardService();