const express = require('express');
const InvitationController = require('../controllers/invitationController');
const { validateInvitation } = require('../middleware/validation');

// Factory function que recibe el middleware compartido
module.exports = (middleware) => {
  const router = express.Router();

  // PUBLICS ROUTES
  router.get('/verify/:token', InvitationController.verifyToken);
  router.post('/accept/:token', InvitationController.acceptInvitation);

  // PROTECTED ROUTES - Usando middleware compartido con roles específicos
  
  // Rutas que requieren roles administrativos para crear invitaciones
  router.post('/', 
    middleware.requireRoles(['Organization', 'Manager', 'Cluster manager', 'Propietario']), 
    validateInvitation, 
    InvitationController.create
  );
  
  // Rutas de consulta (cualquier usuario autenticado)
  router.get('/organization/:orgId', 
    middleware.requireAuth(), 
    InvitationController.getByOrganization
  );
  
  router.get('/:id', 
    middleware.requireAuth(), 
    InvitationController.getById
  );
  
  // Rutas de gestión que requieren roles administrativos
  router.post('/:id/resend', 
    middleware.requireRoles(['Organization', 'Manager', 'Cluster manager']), 
    InvitationController.resendInvitation
  );
  
  router.patch('/:id/revoke', 
    middleware.requireRoles(['Organization', 'Manager', 'Cluster manager']), 
    InvitationController.revoke
  );
  
  router.delete('/:id', 
    middleware.requireRoles(['Organization', 'Manager', 'Cluster manager']), 
    InvitationController.delete
  );

  return router;
};