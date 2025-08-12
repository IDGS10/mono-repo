const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');

// Ruta para el modulo de proyectos (Mariana)
router.post('/approval-request', ProjectController.createApprovalRequest);

router.use(authenticateToken);
router.get('/pending/:orgId', ProjectController.getPendingApprovals);
router.get('/details/:temporalId', ProjectController.getProjectDetails);
router.post('/approve/:temporalId', ProjectController.approveProject);
router.post('/reject/:temporalId', ProjectController.rejectProject);
router.get('/history/:orgId', ProjectController.getApprovalHistory);
router.get('/search/:orgId', ProjectController.searchProjects);

module.exports = router;