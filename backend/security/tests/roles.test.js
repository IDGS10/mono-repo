const request = require('supertest');
const { expect } = require('chai');

const { app } = require('../server');

describe('Role-based Access Control Tests', () => {
  let managerToken, projectManagerToken, organizationToken, clusterManagerToken;
  let managerId, projectManagerId, organizationId, clusterManagerId;

  // Setup: Create users with different roles
  before(async () => {
    // Create Manager user
    const managerData = {
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@example.com',
      password: 'SecurePass123!',
      rol: 'Manager'
    };

    const managerResponse = await request(app)
      .post('/api/auth/register')
      .send(managerData);

    managerToken = managerResponse.body.token;
    managerId = managerResponse.body.user.id;

    // Create Project manager user
    const projectManagerData = {
      firstName: 'Project',
      lastName: 'Manager',
      email: 'projectmanager@example.com',
      password: 'SecurePass123!',
      rol: 'Project manager'
    };

    const projectManagerResponse = await request(app)
      .post('/api/auth/register')
      .send(projectManagerData);

    projectManagerToken = projectManagerResponse.body.token;
    projectManagerId = projectManagerResponse.body.user.id;

    // Create Organization user
    const organizationData = {
      firstName: 'Organization',
      lastName: 'User',
      email: 'organization@example.com',
      password: 'SecurePass123!',
      rol: 'Organization'
    };

    const organizationResponse = await request(app)
      .post('/api/auth/register')
      .send(organizationData);

    organizationToken = organizationResponse.body.token;
    organizationId = organizationResponse.body.user.id;

    // Create Cluster manager user
    const clusterManagerData = {
      firstName: 'Cluster',
      lastName: 'Manager',
      email: 'clustermanager@example.com',
      password: 'SecurePass123!',
      rol: 'Cluster manager'
    };

    const clusterManagerResponse = await request(app)
      .post('/api/auth/register')
      .send(clusterManagerData);

    clusterManagerToken = clusterManagerResponse.body.token;
    clusterManagerId = clusterManagerResponse.body.user.id;
  });

  describe('Role Creation and Validation', () => {
    it('should create Manager user with correct role', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Manager');
      expect(response.body.user).to.have.property('id', managerId);
    });

    it('should create Project manager user with correct role', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${projectManagerToken}`)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Project manager');
      expect(response.body.user).to.have.property('id', projectManagerId);
    });

    it('should create Organization user with correct role', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Organization');
      expect(response.body.user).to.have.property('id', organizationId);
    });

    it('should create Cluster manager user with correct role', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${clusterManagerToken}`)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Cluster manager');
      expect(response.body.user).to.have.property('id', clusterManagerId);
    });
  });

  describe('Role Update Validation', () => {
    it('should allow Manager to update to Project manager', async () => {
      const updateData = { rol: 'Project manager' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Project manager');
    });

    it('should allow Project manager to update to Organization', async () => {
      const updateData = { rol: 'Organization' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${projectManagerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Organization');
    });

    it('should allow Organization to update to Cluster manager', async () => {
      const updateData = { rol: 'Cluster manager' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${organizationToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).to.have.property('rol', 'Cluster manager');
    });

    it('should reject invalid role update', async () => {
      const updateData = { rol: 'SuperAdmin' };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${managerToken}`)
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

      expect(response.body.user).to.have.property('rol', 'Manager');
      expect(response.body.user).to.have.property('status', 'active');
      expect(response.body.user).to.have.property('accepted', 0);
      expect(response.body.user).to.have.property('orgId', null);
    });
  });
});
