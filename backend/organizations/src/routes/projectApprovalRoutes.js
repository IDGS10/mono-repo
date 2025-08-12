const express = require('express');
const router = express.Router();
const ProjectApprovalController = require('../controllers/projectApprovalController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', ProjectApprovalController.getAll);

router.get('/:id', ProjectApprovalController.getById);

router.patch('/:id/approve', ProjectApprovalController.approve);

router.patch('/:id/reject', ProjectApprovalController.reject);

module.exports = router;