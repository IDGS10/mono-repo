const express = require('express');
const OrganizationController = require('../controllers/organizationController');
const { validateOrganization } = require('../middleware/validation');
const upload = require('../utils/fileUpload');

// Middleware específico del dominio - simplificado
const checkOrganizationAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = require('../config/database');
    const result = await db.query(
      'SELECT id_organization FROM organizations WHERE id_organization = $1 AND owner_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes acceso a esta organización',
        code: 'FORBIDDEN_ACCESS',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Factory function que recibe el middleware compartido
module.exports = (middleware) => {
  const router = express.Router();

  // ROUTES FOR ALL MODULES FOR ORGANIZATION ID - PÚBLICAS
  router.get('/:id/basic', OrganizationController.getBasicInfo);
  router.get('/active', OrganizationController.getActiveOrganizations);

  router.post('/auth/test-token', (req, res) => {
    try {
      const jwt = require('jsonwebtoken');
      const config = require('../config/config');

      // GENERATE TOKEN TEST - DELETE TO FINISH
      const testUser = {
        id: 1,
        name: 'Usuario de prueba',
        email: 'prueba@email.com',
        role: 'propietario'
      };
      
      const token = jwt.sign(testUser, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn 
      });
      
      res.json({ 
        message: 'Token de prueba generado exitosamente',
        token: token,
        user: testUser,
        expires_in: config.jwt.expiresIn
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error generando token de prueba',
        details: error.message 
      });
    }
  });

  // RUTAS PROTEGIDAS - Usando middleware compartido
  // Para operaciones básicas de lectura (cualquier usuario autenticado)
  router.get('/dashboard', middleware.requireAuth(), OrganizationController.getDashboard);
  router.get('/types', middleware.requireAuth(), OrganizationController.getTypes);
  
  // Rutas que requieren roles administrativos (Organization, Manager, Cluster manager)
  router.post('/', 
    middleware.requireRoles(['Organization', 'Manager', 'Cluster manager']), 
    validateOrganization, 
    OrganizationController.create
  );
  
  router.get('/:id', 
    middleware.requireAuth(), 
    checkOrganizationAccess, 
    OrganizationController.getById
  );
  
  router.put('/:id', 
    middleware.requireRoles(['Organization', 'Manager', 'Cluster manager']), 
    checkOrganizationAccess, 
    validateOrganization, 
    OrganizationController.update
  );
  
  router.patch('/:id/status', 
    middleware.requireRoles(['Organization', 'Manager', 'Cluster manager']), 
    checkOrganizationAccess, 
    OrganizationController.updateStatus
  );

  return router;
};
