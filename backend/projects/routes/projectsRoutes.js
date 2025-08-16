import { Router } from 'express'
import ProjectController from '../controllers/projectController.js'
import { createMiddleware } from '@mono-repo/shared-middleware'

const router = Router()

// Inicializar middleware para validaciones específicas
const middleware = createMiddleware({
  serviceName: 'projects-service',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret'
})

console.log('🔐 Projects routes: JWT authentication handled by shared middleware')

// NOTA IMPORTANTE: 
// El JWT authentication ya se aplica automáticamente cuando usas addAuthenticatedRoutes()
// en server.js, por lo que NO necesitas aplicar authenticateToken aquí

// Middleware de validación personalizada para proyectos
const validateProjectData = middleware.validateInput((data) => {
  const errors = []
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string')
  }
  
  if (data.name && data.name.length > 255) {
    errors.push('Name must be 255 characters or less')
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push('Description must be 1000 characters or less')
  }
  
  if (data.location && data.location.length > 255) {
    errors.push('Location must be 255 characters or less')
  }
  
  if (data.status && !['pending_approval', 'approved', 'rejected', 'completed'].includes(data.status)) {
    errors.push('Status must be one of: pending_approval, approved, rejected, completed')
  }
  
  return errors
})

// Middleware de paginación
const validatePagination = middleware.validatePagination()

// Middleware de sanitización
const sanitizeProjectInput = middleware.sanitizeInput(['name', 'description', 'location'])

// RUTAS DE PROYECTOS
// Todas estas rutas ya tienen JWT authentication aplicado por addAuthenticatedRoutes() en server.js

// Obtener proyectos con paginación
router.get('/', 
  validatePagination,
  ProjectController.getProjects
)

// Crear proyecto
router.post('/', 
  validateProjectData,
  sanitizeProjectInput,
  ProjectController.createProject
)

// Estadísticas de proyectos
router.get('/stats', 
  ProjectController.getProjectStats
)

// Búsqueda de proyectos
router.get('/search',
  validatePagination,
  ProjectController.searchProjects
)

// Proyectos por organización
router.get('/org/:id_org',
  validatePagination,
  ProjectController.getProjectsByOrg
)

// Obtener proyecto específico
router.get('/:id', 
  ProjectController.getProject
)

// Actualizar proyecto
router.put('/:id',
  validateProjectData,
  sanitizeProjectInput,
  ProjectController.updateProject
)

// Eliminar proyecto
router.delete('/:id', 
  ProjectController.deleteProject
)

// Aprobar proyecto - solo para Owner y Leader
router.patch('/:id/approve', 
  ProjectController.approveProject
)

// Rechazar proyecto - solo para Owner y Leader
router.patch('/:id/reject',
  validateProjectData, // Para validar el campo 'reason' si se incluye
  sanitizeProjectInput,
  ProjectController.rejectProject
)

// Middleware de logging para rutas protegidas
router.use((req, res, next) => {
  console.log(`🔒 Protected route accessed: ${req.method} ${req.path}`)
  console.log(`👤 User: ${req.user?.userId || req.user?.sub} (${req.user?.rol || 'unknown role'})`)
  next()
})

export default router