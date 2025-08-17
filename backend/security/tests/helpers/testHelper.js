const { pool } = require('../../config/database');

/**
 * Test database helper utilities
 */
class TestHelper {
  /**
   * Clean up test data from database
   */
  static async cleanDatabase() {
    try {
      await pool.query('DELETE FROM login_sessions WHERE 1=1');
      await pool.query('DELETE FROM login_attempts WHERE 1=1');
      await pool.query('DELETE FROM user_settings WHERE 1=1');
      await pool.query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
      await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
      console.log('🧹 Test database cleaned');
    } catch (error) {
      console.error('❌ Error cleaning test database:', error.message);
      throw error;
    }
  }

  /**
   * Generate unique test email
   */
  static generateTestEmail(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}.${timestamp}.${random}@example.com`;
  }

  /**
   * Create a test user and return user data with token
   */
  static async createTestUser(userData = {}) {
    const defaultData = {
      email: this.generateTestEmail('testuser'),
      password: 'Test123456!',
      firstName: 'Test',
      lastName: 'User',
      phone: '3001234567',
      rol: 'Propietario'
    };

    const testUser = { ...defaultData, ...userData };

    const { app } = require('../../server');
    const request = require('supertest');

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    return {
      user: registerResponse.body.user,
      token: registerResponse.body.token,
      credentials: testUser
    };
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset database sequences
   */
  static async resetSequences() {
    try {
      await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE login_sessions_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE login_attempts_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE user_settings_id_seq RESTART WITH 1');
    } catch (error) {
      console.log('⚠️  Note: Could not reset sequences (may not exist yet)');
    }
  }
}

module.exports = TestHelper;
