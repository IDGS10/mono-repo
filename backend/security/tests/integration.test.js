const request = require('supertest');
const { expect } = require('chai');

const { app } = require('../server');

describe('System Health and Integration Tests', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).to.have.property('status');
      expect(response.body).to.have.property('timestamp');
      expect(response.body.status).to.be.oneOf(['OK', 'healthy', 'running']);
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should work without any authentication headers
      expect(response.body).to.have.property('status');
    });
  });

  describe('Database Integration', () => {
    it('should connect to database successfully', async () => {
      // This test creates a user, which tests database connectivity
      const userData = {
        firstName: 'Database',
        lastName: 'Test',
        email: 'database.test@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body.user).to.have.property('id');
    });

    it('should handle database constraints properly', async () => {
      // Try to create duplicate user (should fail due to unique constraint)
      const userData = {
        firstName: 'Duplicate',
        lastName: 'Test',
        email: 'database.test@example.com', // Same as above
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).to.have.property('success', false);
    });
  });

  describe('Full Authentication Flow', () => {
    let authToken, userId;

    it('should complete full registration -> login -> access -> logout flow', async () => {
      // Step 1: Register
      const userData = {
        firstName: 'Flow',
        lastName: 'Test',
        email: 'flow.test@example.com',
        password: 'SecurePass123!',
        rol: 'Lider'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).to.have.property('success', true);
      expect(registerResponse.body).to.have.property('token');
      authToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;

      // Step 2: Access protected route with token from registration
      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.user).to.have.property('email', userData.email);

      // Step 3: Login again (should work)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).to.have.property('token');
      const newToken = loginResponse.body.token;

      // Step 4: Access with new login token
      const profileResponse2 = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(profileResponse2.body.user).to.have.property('id', userId);

      // Step 5: Update profile
      const updateResponse = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send({ firstName: 'Updated Flow' })
        .expect(200);

      expect(updateResponse.body.user).to.have.property('firstName', 'Updated Flow');

      // Step 6: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(logoutResponse.body).to.have.property('success', true);

      // Step 7: Try to access after logout (should fail)
      const accessAfterLogout = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(401);

      expect(accessAfterLogout.body).to.have.property('success', false);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent registrations safely', async () => {
      const promises = [];

      // Create 5 concurrent registrations with different emails
      for (let i = 0; i < 5; i++) {
        const userData = {
          firstName: 'Concurrent',
          lastName: `User${i}`,
          email: `concurrent${i}@example.com`,
          password: 'SecurePass123!'
        };

        promises.push(
          request(app)
            .post('/api/auth/register')
            .send(userData)
        );
      }

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('success', true);
      });

      // All should have unique user IDs
      const userIds = responses.map(r => r.body.user.id);
      const uniqueIds = [...new Set(userIds)];
      expect(uniqueIds).to.have.length(5);
    });
  });

  describe('Session Management', () => {
    let authToken, userId;

    before(async () => {
      const userData = {
        firstName: 'Session',
        lastName: 'Test',
        email: 'session.test@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should track active sessions', async () => {
      const response = await request(app)
        .get('/api/user/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('sessions');
      expect(response.body.sessions).to.be.an('array');
      expect(response.body.sessions.length).to.be.greaterThan(0);
    });

    it('should provide session details', async () => {
      const response = await request(app)
        .get('/api/user/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const session = response.body.sessions[0];
      expect(session).to.have.property('id');
      expect(session).to.have.property('created_at');
      expect(session).to.have.property('is_active');
    });
  });
});
