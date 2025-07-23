import { Router } from 'express'
import ProjectController from '../controllers/projectController.js'
import { authenticateJWT, requireRole } from '../middleware/auth.js'

const router = Router()

// POLÍTICA DE SEGURIDAD OBLIGATORIA: JWT en todas las rutas de información de usuario
console.log('🔐 Aplicando autenticación JWT obligatoria a todas las rutas de projects')

// Middleware JWT obligatorio para TODAS las rutas
router.use(authenticateJWT)

// Project routes - TODAS PROTEGIDAS CON JWT
router.get('/', ProjectController.getProjects)
router.post('/', ProjectController.createProject)

// Stats route - información sensible requiere JWT
router.get('/stats', ProjectController.getProjectStats)

// Project by ID routes
router.get('/:id', ProjectController.getProject)
router.put('/:id', ProjectController.updateProject)
router.delete('/:id', ProjectController.deleteProject)

// Project status management - operaciones críticas
router.patch('/:id/approve', ProjectController.approveProject)
router.patch('/:id/reject', ProjectController.rejectProject)

// Organization projects - información de reglas de negocio
router.get('/org/:id_org', ProjectController.getProjectsByOrg)

// Logging de seguridad
router.use((req, res, next) => {
  console.log(`🔒 JWT-protected route accessed: ${req.method} ${req.path}`)
  console.log(`👤 User: ${req.user?.userId || req.user?.sub}`)
  next()
})

export default router