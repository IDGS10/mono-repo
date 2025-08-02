const request = require('supertest');
const { expect } = require('chai');

const { app } = require('../server');

describe('Dashboard API Tests', () => {
  let authToken;

  // Setup: Register and login a test user
  before(async () => {
    const userData = {
      firstName: 'Dashboard',
      lastName: 'Tester',
      email: 'dashboard.tester@example.com',
      password: 'SecurePass123!',
      rol: 'Propietario'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.token;
  });

  describe('GET /api/dashboard/stats', () => {
    it('should get dashboard statistics with valid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('stats');
      expect(response.body.stats).to.be.an('object');
    });

    it('should fail without authorization token', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Token de acceso requerido');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });
  });
});
