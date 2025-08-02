const request = require('supertest');
const { expect } = require('chai');

const { app } = require('../server');

describe('Security and Validation Tests', () => {
  describe('Input Validation', () => {
    it('should sanitize email to lowercase', async () => {
      const userData = {
        firstName: 'Case',
        lastName: 'Test',
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).to.have.property('email', 'uppercase@example.com');
    });

    it('should trim whitespace from names', async () => {
      const userData = {
        firstName: '  Trimmed  ',
        lastName: '  Name  ',
        email: 'trimmed@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).to.have.property('firstName', 'Trimmed');
      expect(response.body.user).to.have.property('lastName', 'Name');
    });

    it('should validate email format strictly', async () => {
      const testCases = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..double@example.com',
        'user@.com'
      ];

      for (const email of testCases) {
        const userData = {
          firstName: 'Invalid',
          lastName: 'Email',
          email: email,
          password: 'SecurePass123!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('Formato de email inválido');
      }
    });

    it('should enforce minimum password length', async () => {
      const userData = {
        firstName: 'Short',
        lastName: 'Password',
        email: 'short@example.com',
        password: '12345' // Only 5 characters
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('6 caracteres');
    });
  });

  describe('SQL Injection Protection', () => {
    it('should handle malicious email input safely', async () => {
      const userData = {
        firstName: 'SQL',
        lastName: 'Injection',
        email: "'; DROP TABLE users; --",
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
    });

    it('should handle malicious name input safely', async () => {
      const userData = {
        firstName: "'; DROP TABLE users; --",
        lastName: 'Test',
        email: 'sqltest@example.com',
        password: 'SecurePass123!'
      };

      // Should either succeed with sanitized input or fail validation
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Either way, it shouldn't crash the server
      expect([200, 201, 400, 500]).to.include(response.status);
    });
  });

  describe('XSS Protection', () => {
    it('should handle script tags in user input', async () => {
      const userData = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        email: 'xsstest@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should either sanitize or reject the input
      if (response.status === 201) {
        expect(response.body.user.firstName).to.not.include('<script>');
      } else {
        expect(response.body).to.have.property('success', false);
      }
    });
  });

  describe('Rate Limiting (if implemented)', () => {
    it('should handle multiple rapid requests gracefully', async () => {
      const promises = [];

      // Send 10 rapid requests
      for (let i = 0; i < 10; i++) {
        const userData = {
          firstName: 'Rapid',
          lastName: `Test${i}`,
          email: `rapid${i}@example.com`,
          password: 'SecurePass123!'
        };

        promises.push(
          request(app)
            .post('/api/auth/register')
            .send(userData)
        );
      }

      const responses = await Promise.all(promises);

      // All requests should complete (even if some fail)
      responses.forEach(response => {
        expect([200, 201, 400, 409, 429, 500]).to.include(response.status);
      });
    });
  });

  describe('Token Security', () => {
    let authToken, userId;

    before(async () => {
      const userData = {
        firstName: 'Token',
        lastName: 'Security',
        email: 'token.security@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'invalid.token',
        'Bearer invalid',
        'malformed_token_here',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid.signature'
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);

        expect(response.body).to.have.property('success', false);
      }
    });

    it('should validate token signature', async () => {
      // Create a token with wrong signature
      const fakeToken = authToken.slice(0, -10) + 'fakesign1';

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });

    it('should validate token structure', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer not.a.jwt.token.structure')
        .expect(401);

      expect(response.body).to.have.property('success', false);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.a('string');
    });

    it('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).to.not.include('password');
      expect(response.body.message).to.not.include('hash');
      expect(response.body.message).to.not.include('database');
    });
  });
});
