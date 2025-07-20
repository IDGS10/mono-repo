import { Router } from 'express'
import ProjectController from '../controllers/projectController.js'

const router = Router()

// Project routes
router.get('/', ProjectController.getProjects)
router.post('/', ProjectController.createProject)
router.get('/stats', ProjectController.getProjectStats)
router.get('/:id', ProjectController.getProject)
router.put('/:id', ProjectController.updateProject)
router.delete('/:id', ProjectController.deleteProject)

// Project status management
router.patch('/:id/approve', ProjectController.approveProject)
router.patch('/:id/reject', ProjectController.rejectProject)

export default router