const request = require('supertest');
const { expect } = require('chai');

const { app } = require('../server');

describe('Role-based Access Control Tests', () => {
  let propietarioToken, liderToken, encargadoToken;
  let propietarioId, liderId, encargadoId;

  // Setup: Create users with different roles
  before(async () => {
    // Create Propietario user
    const propietarioData = {
      firstName: 'Owner',
      lastName: 'User',
      email: 'owner@example.com',
      password: 'SecurePass123!',
      rol: 'Propietario'
    };

    const propietarioResponse = await request(app)
      .post('/api/auth/register')
      .send(propietarioData);

    propietarioToken = propietarioResponse.body.token;
    propietarioId = propietarioResponse.body.user.id;

    // Create Lider user
    const liderData = {
      firstName: 'Leader',
      lastName: 'User',
      email: 'leader@example.com',
      password: 'SecurePass123!',
      rol: 'Lider'
    };

    const liderResponse = await request(app)
      .post('/api/auth/register')
      .send(liderData);

    liderToken = liderResponse.body.token;
    liderId = liderResponse.body.user.id;

    // Create Encargado user
    const encargadoData = {
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@example.com',
      password: 'SecurePass123!',
      rol: 'Encargado'
    };

    const encargadoResponse = await request(app)
      .post('/api/auth/register')
      .send(encargadoData);

    encargadoToken = encargadoResponse.body.token;
    encargadoId = encargadoResponse.body.user.id;
  });

  describe('Role Creation and Validation', () => {
    it('should create Propietario user with correct role', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${propietarioToken}`)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Propietario');
      expect(response.body.user).to.have.property('id', propietarioId);
    });

    it('should create Lider user with correct role', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${liderToken}`)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Lider');
      expect(response.body.user).to.have.property('id', liderId);
    });

    it('should create Encargado user with correct role', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${encargadoToken}`)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Encargado');
      expect(response.body.user).to.have.property('id', encargadoId);
    });
  });

  describe('Role Update Validation', () => {
    it('should allow Propietario to update to Lider', async () => {
      const updateData = { rol: 'Lider' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${propietarioToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Lider');
    });

    it('should allow Lider to update to Encargado', async () => {
      const updateData = { rol: 'Encargado' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${liderToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Encargado');
    });

    it('should allow Encargado to update to Propietario', async () => {
      const updateData = { rol: 'Propietario' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${encargadoToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Propietario');
    });

    it('should reject invalid role update', async () => {
      const updateData = { rol: 'SuperAdmin' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${propietarioToken}`)
        .send(updateData)
        .expect(500);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Rol inválido');
    });
  });

  describe('Default Values Testing', () => {
    it('should create user with default values when not specified', async () => {
      const userData = {
        firstName: 'Default',
        lastName: 'User',
        email: 'default@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).to.have.property('rol', 'Propietario');
      expect(response.body.user).to.have.property('status', 'active');
      expect(response.body.user).to.have.property('accepted', 0);
      expect(response.body.user).to.have.property('orgId', null);
    });
  });
});
