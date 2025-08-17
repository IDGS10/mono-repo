// Test setup file - runs before all tests
require('dotenv').config();

// Global test configuration
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
process.env.TEST_TIMEOUT = '10000';

// Test database configuration (if using separate test DB)
if (!process.env.DB_NAME) {
  console.warn('⚠️  Warning: No test database configured. Using development database.');
}

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export test utilities if needed
module.exports = {
  testTimeout: 10000,

  // Helper function to generate test user data
  generateTestUser: (suffix = '') => ({
    firstName: `Test${suffix}`,
    lastName: `User${suffix}`,
    email: `test${suffix}@example.com`.toLowerCase(),
    password: 'SecurePass123!',
    phone: '+1234567890',
    rol: 'Propietario'
  }),

  // Helper function to generate different roles
  generateUserWithRole: (role, suffix = '') => ({
    firstName: `${role}${suffix}`,
    lastName: `User${suffix}`,
    email: `${role.toLowerCase()}${suffix}@example.com`,
    password: 'SecurePass123!',
    rol: role
  }),

  // Valid roles for testing
  validRoles: ['Propietario', 'Lider', 'Encargado'],

  // Test data constants
  testConstants: {
    MIN_PASSWORD_LENGTH: 6,
    VALID_EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    DEFAULT_STATUS: 'active',
    DEFAULT_ACCEPTED: 0
  }
};
