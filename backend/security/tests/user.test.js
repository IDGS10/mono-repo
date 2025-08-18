const request = require('supertest');
const { expect } = require('chai');

const { app } = require('../server');

describe('User Management API Tests', () => {
  let authToken;
  let userId;

  // Setup: Register and login a test user
  before(async () => {
    const userData = {
      firstName: 'Profile',
      lastName: 'Tester',
      email: 'profile.tester@example.com',
      password: 'SecurePass123!',
      phone: '+1234567890',
      rol: 'Organization',
      orgId: 456
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('GET /api/user/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('id', userId);
      expect(response.body.user).to.have.property('email', 'profile.tester@example.com');
      expect(response.body.user).to.have.property('firstName', 'Profile');
      expect(response.body.user).to.have.property('lastName', 'Tester');
      expect(response.body.user).to.have.property('rol', 'Organization');
    });

    it('should fail without authorization token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Token de acceso requerido');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user profile with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210',
        rol: 'Project manager',
        status: 'active',
        accepted: 1,
        orgId: 789
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('firstName', 'Updated');
      expect(response.body.user).to.have.property('lastName', 'Name');
      expect(response.body.user).to.have.property('phone', '+9876543210');
      expect(response.body.user).to.have.property('rol', 'Project manager');
    });

    it('should update partial profile data', async () => {
      const updateData = {
        firstName: 'Partial'
        // Only updating firstName
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.user).to.have.property('firstName', 'Partial');
      // Other fields should remain unchanged
      expect(response.body.user).to.have.property('lastName', 'Name');
    });

    it('should fail with invalid role', async () => {
      const updateData = {
        rol: 'InvalidRole'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(500);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Rol inválido');
    });

    it('should fail without authorization token', async () => {
      const updateData = {
        firstName: 'Unauthorized'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .send(updateData)
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });
  });

  describe('GET /api/user/sessions', () => {
    it('should get user sessions with valid token', async () => {
      const response = await request(app)
        .get('/api/user/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('sessions');
      expect(response.body.sessions).to.be.an('array');
    });

    it('should fail without authorization token', async () => {
      const response = await request(app)
        .get('/api/user/sessions')
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });
  });

  describe('GET /api/user/stats', () => {
    it('should get user statistics with valid token', async () => {
      const response = await request(app)
        .get('/api/user/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('userStats');
    });

    it('should fail without authorization token', async () => {
      const response = await request(app)
        .get('/api/user/stats')
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });
  });
});
