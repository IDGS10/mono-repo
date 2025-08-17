const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/invitationController');
const { authenticateToken, checkOwnerRole } = require('../middleware/auth');
const { validateInvitation } = require('../middleware/validation');


// PUBLICS ROUTES
router.get('/verify/:token', InvitationController.verifyToken);
router.post('/accept/:token', InvitationController.acceptInvitation);

// PROTECTEC ROUTES
router.use(authenticateToken);

// INVITATIONS
router.post('/', checkOwnerRole, validateInvitation, InvitationController.create);
router.get('/organization/:orgId', InvitationController.getByOrganization);
router.get('/:id', InvitationController.getById);
router.post('/:id/resend', checkOwnerRole, InvitationController.resendInvitation);
router.patch('/:id/revoke', checkOwnerRole, InvitationController.revoke);
router.delete('/:id', checkOwnerRole, InvitationController.delete);


module.exports = router;