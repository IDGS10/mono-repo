const express = require('express');
const router = express.Router();
const OrganizationController = require('../controllers/organizationController');
const { authenticateToken, checkOwnerRole, checkOrganizationAccess } = require('../middleware/auth');
const { validateOrganization } = require('../middleware/validation');
const upload = require('../utils/fileUpload');

// ROUTES FOR ALL MODULES FOR ORGANIZATION ID
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

router.use(authenticateToken);
router.get('/dashboard', OrganizationController.getDashboard);
router.get('/types', OrganizationController.getTypes);
router.post('/', checkOwnerRole, validateOrganization, OrganizationController.create);
router.get('/:id', checkOrganizationAccess, OrganizationController.getById);
router.put('/:id', checkOrganizationAccess, validateOrganization, OrganizationController.update);
router.patch('/:id/status', checkOrganizationAccess, OrganizationController.updateStatus);

module.exports = router;
