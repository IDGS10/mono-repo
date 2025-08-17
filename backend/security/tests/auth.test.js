const request = require('supertest');
const { expect } = require('chai');
const TestHelper = require('./helpers/testHelper');

// Import the Express app
const { app } = require('../server');

describe('Authentication API Tests', () => {
  let authToken;
  let userId;

  // Clean database before and after tests
  before(async () => {
    await TestHelper.cleanDatabase();
  });

  after(async () => {
    await TestHelper.cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with full data', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: TestHelper.generateTestEmail('testuser'),
        password: 'SecurePass123!',
        phone: '+1234567890',
        status: 'active',
        rol: 'Lider',
        accepted: 1,
        orgId: 123
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('email', userData.email.toLowerCase());
      expect(response.body.user).to.have.property('firstName', userData.firstName);
      expect(response.body.user).to.have.property('rol', userData.rol);
      expect(response.body.user).to.have.property('status', userData.status);
      expect(response.body.user).to.have.property('accepted', userData.accepted);
      expect(response.body.user).to.have.property('orgId', userData.orgId);

      // Save for later tests
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should register a new user with minimal data (defaults)', async () => {
      const userData = {
        firstName: 'Minimal',
        lastName: 'User',
        email: TestHelper.generateTestEmail('minimal'),
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('rol', 'Propietario'); // Default
      expect(response.body.user).to.have.property('status', 'active'); // Default
      expect(response.body.user).to.have.property('accepted', 0); // Default
      expect(response.body.user).to.have.property('orgId', null); // Default
    });

    it('should fail with duplicate email', async () => {
      const duplicateEmail = TestHelper.generateTestEmail('duplicate');
      const userData = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: duplicateEmail,
        password: 'SecurePass123!'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('ya existe');
    });

    it('should fail with invalid role', async () => {
      const userData = {
        firstName: 'Invalid',
        lastName: 'Role',
        email: TestHelper.generateTestEmail('invalidrole'),
        password: 'SecurePass123!',
        rol: 'InvalidRole'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Rol inválido');
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        firstName: 'Missing',
        // lastName missing
        email: 'missing.fields@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('requeridos');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        firstName: 'Invalid',
        lastName: 'Email',
        email: 'invalid-email-format',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('email inválido');
    });

    it('should fail with short password', async () => {
      const userData = {
        firstName: 'Short',
        lastName: 'Password',
        email: 'short.password@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('6 caracteres');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First create a user for login
      const testUser = await TestHelper.createTestUser({
        email: TestHelper.generateTestEmail('logintest'),
        password: 'SecurePass123!'
      });

      const loginData = {
        email: testUser.credentials.email,
        password: testUser.credentials.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('email', loginData.email);

      // Update token for subsequent tests
      authToken = response.body.token;
    });

    it('should fail with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Email o contraseña incorrectos');
    });

    it('should fail with invalid password', async () => {
      const loginData = {
        email: 'test.user@example.com',
        password: 'WrongPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Email o contraseña incorrectos');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('success', false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.message).to.include('cerrada exitosamente');
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });
  });
});
