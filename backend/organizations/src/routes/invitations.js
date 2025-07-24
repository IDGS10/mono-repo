const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/invitationController');
const { authenticateToken, checkOwnerRole } = require('../middleware/auth');
const { validateInvitation } = require('../middleware/validation');

router.get('/verify/:token', InvitationController.verifyToken);
router.post('/accept/:token', InvitationController.acceptInvitation);

router.use(authenticateToken);
router.post('/', checkOwnerRole, validateInvitation, InvitationController.create);
router.get('/organization/:orgId', InvitationController.getByOrganization);
router.delete('/:id', checkOwnerRole, InvitationController.revoke);

module.exports = router;