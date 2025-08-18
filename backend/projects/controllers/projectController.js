import Project from '../models/Project.js'
import { query } from '../config/database.js'
import {   requestCompleteSwarm, getProjectSwarmsFromAPI, getAvailableDevicesFromAPI 
} from '../services/swarmService.js'
// Si tienes el middleware compartido instalado, descomenta esta línea:
import { createMiddleware } from '@mono-repo/shared-middleware'

// Mientras tanto, usamos ResponseUtils básico
const ResponseUtils = {
  success: (res, status, message, data = null) => {
    res.status(status).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  },
  created: (res, message, data = null) => {
    res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  },
  error: (res, status, message, details = null) => {
    res.status(status).json({
      success: false,
      message,
      ...(details && { error: details }),
      timestamp: new Date().toISOString()
    })
  },
  validationError: (res, message, errors = []) => {
    res.status(400).json({
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      timestamp: new Date().toISOString()
    })
  },
  notFound: (res, message) => {
    res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    })
  },
  conflict: (res, message) => {
    res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    })
  }
}

const ValidationUtils = {
  validateRequiredFields: (data, fields) => {
    const missing = fields.filter(field => !data[field] || data[field].toString().trim() === '')
    return missing
  },
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/[<>]/g, '')
                .trim()
  },
  validatePagination: (page, limit) => {
    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 10
    return pageNum >= 1 && limitNum >= 1 && limitNum <= 100
  }
}

// Función para generar ID único (movida fuera de la clase)
async function generateUniqueProjectId() {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    // Generar ID aleatorio de 8 dígitos
    const randomId = Math.floor(10000000 + Math.random() * 90000000)
    
    try {
      // Verificar que no exista en BD
      const existingProject = await query(
        'SELECT id_project FROM projects WHERE id_project = $1', 
        [randomId]
      )
      
      if (existingProject.rows.length === 0) {
        console.log(`✅ Generated unique project ID: ${randomId}`)
        return randomId
      }
      
      attempts++
      console.log(`⚠️ ID ${randomId} already exists, retrying... (${attempts}/${maxAttempts})`)
    } catch (error) {
      console.error('Error verificando ID único:', error)
      attempts++
    }
  }
  
  throw new Error('No se pudo generar un ID único después de varios intentos')
}

export default class ProjectController {

  static async getProjects(req, res) {
    try {
      const { 
        ownerId, 
        owner_id, 
        userId, 
        status, 
        id_org,
        page = 1,
        limit = 10
      } = req.query
      
      // Validar paginación
      if (!ValidationUtils.validatePagination(page, limit)) {
        return ResponseUtils.validationError(res, 'Invalid pagination parameters', [
          'page must be >= 1',
          'limit must be between 1 and 100'
        ])
      }
      
      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))
      
      // Soportar diferentes nombres de parámetros
      const finalOwnerId = ownerId || owner_id || userId
      let result

      if (status) {
        result = await Project.findByStatus(status, finalOwnerId, id_org, pageNum, limitNum)
      } else {
        result = await Project.findAll(finalOwnerId, id_org, pageNum, limitNum)
      }

      ResponseUtils.success(res, 200, 'Projects retrieved successfully', {
        projects: result.projects.map(p => p.toJSON()),
        pagination: result.pagination,
        count: result.projects.length
      })
      
      console.log(`✅ Retrieved ${result.projects.length} projects (JWT verified)`)
    } catch (error) {
      console.error('Error fetching projects:', error)
      ResponseUtils.error(res, 500, 'Failed to fetch projects', error.message)
    }
  }

  static async getProject(req, res) {
    try {
      const { id } = req.params
 
      if (!id || isNaN(parseInt(id))) {
        return ResponseUtils.validationError(res, 'Invalid project ID provided')
      }

      const project = await Project.findById(parseInt(id))

      if (!project) {
        return ResponseUtils.notFound(res, 'Project not found')
      }

      ResponseUtils.success(res, 200, 'Project retrieved successfully', project.toJSON())
      
      console.log(`✅ Retrieved project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error fetching project:', error)
      ResponseUtils.error(res, 500, 'Failed to fetch project', error.message)
    }
  }

  static async createProject(req, res) {
    try {
      const { 
        name, 
        description, 
        location, 
        startDate, 
        userId, 
        requesterId, 
        created_by,
        owner_id,
        id_org 
      } = req.body

      // Validar campos requeridos
      const requiredFields = ['name']
      const missingFields = ValidationUtils.validateRequiredFields(req.body, requiredFields)
      
      if (missingFields.length > 0) {
        return ResponseUtils.validationError(res, 'Missing required fields', 
          missingFields.map(field => `${field} is required`)
        )
      }

      if (!name || !name.trim()) {
        return ResponseUtils.validationError(res, 'Project name cannot be empty')
      }

      // Usar el usuario del JWT como creador principal
      const jwtUserId = req.user?.userId || req.user?.sub
      const creatorId = created_by || userId || requesterId || owner_id || jwtUserId

      if (!creatorId) {
        return ResponseUtils.validationError(res, 'Creator ID is required')
      }

      // Generar ID único para el proyecto
      const uniqueId = await generateUniqueProjectId()
      
      // Sanitizar datos de entrada
      const projectData = {
        id_project: uniqueId,
        name: ValidationUtils.sanitizeInput(name.trim()).substring(0, 255),
        description: description ? ValidationUtils.sanitizeInput(description.trim()).substring(0, 1000) : null,
        location: location ? ValidationUtils.sanitizeInput(location.trim()).substring(0, 255) : null,
        status: 'pending_approval',
        created_by: creatorId,
        modified_by: creatorId,
        owner_id: creatorId,
        id_org: id_org || null
      }

      const project = new Project(projectData)
      const savedProject = await project.save()

      ResponseUtils.created(res, 'Project created successfully', savedProject.toJSON())
      
      console.log(`✅ Created project ${savedProject.id_project} (JWT verified)`)
    } catch (error) {
      console.error('Error creating project:', error)
      
      // Manejo específico de errores de BD
      if (error.code === '23505') {
        return ResponseUtils.conflict(res, 'A project with this name already exists')
      }
      
      if (error.code === '23503') {
        return ResponseUtils.validationError(res, 'Invalid organization or user ID')
      }

      ResponseUtils.error(res, 500, 'Failed to create project', error.message)
    }
  }

  static async updateProject(req, res) {
    try {
      const { id } = req.params
      const updates = req.body

      if (!id || isNaN(parseInt(id))) {
        return ResponseUtils.validationError(res, 'Invalid project ID provided')
      }

      const project = await Project.findById(parseInt(id))
      if (!project) {
        return ResponseUtils.notFound(res, 'Project not found')
      }

      const jwtUserId = req.user?.userId || req.user?.sub
      updates.modified_by = updates.modified_by || updates.userId || jwtUserId

      // Sanitizar y validar campos permitidos
      const allowedUpdates = ['name', 'description', 'location', 'status', 'modified_by', 'id_org', 'owner_id']
      const sanitizedUpdates = {}
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key) && updates[key] !== undefined) {
          if (typeof updates[key] === 'string') {
            sanitizedUpdates[key] = ValidationUtils.sanitizeInput(updates[key].trim())
          } else {
            sanitizedUpdates[key] = updates[key]
          }
        }
      })

      const updatedProject = await project.update(sanitizedUpdates)

      ResponseUtils.success(res, 200, 'Project updated successfully', updatedProject.toJSON())
      
      console.log(`✅ Updated project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error updating project:', error)
      ResponseUtils.error(res, 500, 'Failed to update project', error.message)
    }
  }

  static async deleteProject(req, res) {
    try {
      const { id } = req.params
          
      if (!id || isNaN(parseInt(id))) {
        return ResponseUtils.validationError(res, 'Invalid project ID provided')
      }

      const deletedProject = await Project.delete(parseInt(id))

      ResponseUtils.success(res, 200, 'Project deleted successfully', deletedProject.toJSON())
      
      console.log(`✅ Deleted project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error deleting project:', error)
      
      if (error.message === 'Project not found') {
        return ResponseUtils.notFound(res, 'Project not found')
      }

      ResponseUtils.error(res, 500, 'Failed to delete project', error.message)
    }
  }

  static async approveProject(req, res) {
    try {
      const { id } = req.params
      const { modified_by, userId } = req.body
      
      if (!id || isNaN(parseInt(id))) {
        return ResponseUtils.validationError(res, 'Invalid project ID provided')
      }

      const project = await Project.findById(parseInt(id))
      if (!project) {
        return ResponseUtils.notFound(res, 'Project not found')
      }

      if (project.status !== 'pending_approval') {
        return ResponseUtils.validationError(res, 'Project must be in pending approval status')
      }

      const jwtUserId = req.user?.userId || req.user?.sub
      const updateData = { 
        status: 'approved',
        modified_by: modified_by || userId || jwtUserId
      }

      const updatedProject = await project.update(updateData)

      ResponseUtils.success(res, 200, 'Project approved successfully', updatedProject.toJSON())
      
      console.log(`✅ Approved project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error approving project:', error)
      ResponseUtils.error(res, 500, 'Failed to approve project', error.message)
    }
  }


 static async requestSwarm(req, res) {
    try {
      const { id: projectId } = req.params
      const swarmData = req.body

      // Validar campos requeridos
      if (!swarmData.swarmName || !swarmData.deviceCount) {
        return ResponseUtils.validationError(res, 'Swarm name and device count are required')
      }

      // Verificar que el proyecto existe y está aprobado
      const project = await Project.findById(parseInt(projectId))
      if (!project) {
        return ResponseUtils.notFound(res, 'Project not found')
      }

      if (project.status !== 'approved') {
        return ResponseUtils.validationError(res, 'Project must be approved before requesting swarms')
      }

      // Crear swarm completo (backend maneja todo)
      const result = await requestCompleteSwarm(projectId, swarmData, req)

      ResponseUtils.created(res, 'Swarm request submitted successfully', {
        project: project.toJSON(),
        swarm: result.swarm,
        assignedDevices: result.devices,
        summary: {
          swarmId: result.swarm?.swarmId,
          devicesAssigned: result.selectedDevicesCount,
          devicesAvailable: result.availableDevicesCount,
          totalDevices: result.totalDevicesCount,
          status: 'requested'
        },
        message: 'Your swarm request has been submitted and is pending approval'
      })

    } catch (error) {
      console.error('❌ Error requesting swarm:', error)
      ResponseUtils.error(res, 500, 'Failed to request swarm', error.message)
    }
  }

  static async getProjectSwarms(req, res) {
    try {
      const { id: projectId } = req.params

      const project = await Project.findById(parseInt(projectId))
      if (!project) {
        return ResponseUtils.notFound(res, 'Project not found')
      }

      const swarms = await getProjectSwarmsFromAPI(projectId, req)

      ResponseUtils.success(res, 200, 'Project swarms retrieved successfully', {
        project: {
          id: project.id_project,
          name: project.name,
          status: project.status
        },
        swarms: swarms,
        count: swarms.length
      })

    } catch (error) {
      console.error('❌ Error getting project swarms:', error)
      ResponseUtils.error(res, 500, 'Failed to get project swarms', error.message)
    }
  }

  static async getAvailableDevices(req, res) {
    try {
      const deviceInfo = await getAvailableDevicesFromAPI(req)

      // Verificar que deviceInfo tenga la estructura correcta
      if (!deviceInfo || typeof deviceInfo !== 'object') {
        throw new Error('Invalid device info structure received')
      }

      const availableDevices = deviceInfo.availableDevices || []
      const summary = deviceInfo.summary || { total: 0, available: 0, assigned: 0, offline: 0 }

      ResponseUtils.success(res, 200, 'Available devices retrieved successfully', {
        devices: availableDevices,
        allDevices: deviceInfo.allDevices || [],
        count: availableDevices.length,
        summary: {
          totalDevices: summary.total,
          availableDevices: summary.available,
          assignedDevices: summary.assigned,
          offlineDevices: summary.offline,
          byType: Array.isArray(availableDevices) ? availableDevices.reduce((acc, device) => {
            const type = device.type || 'Unknown'
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {}) : {}
        }
      })

    } catch (error) {
      console.error('❌ Error getting available devices:', error)
      ResponseUtils.error(res, 500, 'Failed to get available devices', error.message)
    }
  }


  static async rejectProject(req, res) {
    try {
      const { id } = req.params
      const { reason, modified_by, userId } = req.body

      if (!id || isNaN(parseInt(id))) {
        return ResponseUtils.validationError(res, 'Invalid project ID provided')
      }

      const project = await Project.findById(parseInt(id))
      if (!project) {
        return ResponseUtils.notFound(res, 'Project not found')
      }

      if (project.status !== 'pending_approval') {
        return ResponseUtils.validationError(res, 'Project must be in pending approval status')
      }

      const jwtUserId = req.user?.userId || req.user?.sub
      const updateData = { 
        status: 'rejected',
        modified_by: modified_by || userId || jwtUserId
      }

      const updatedProject = await project.update(updateData)

      ResponseUtils.success(res, 200, 'Project rejected successfully', {
        ...updatedProject.toJSON(),
        rejection_reason: reason ? ValidationUtils.sanitizeInput(reason.trim()) : null
      })
      
      console.log(`✅ Rejected project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error rejecting project:', error)
      ResponseUtils.error(res, 500, 'Failed to reject project', error.message)
    }
  }

  static async getProjectStats(req, res) {
    try {
      const { ownerId, owner_id, userId, id_org } = req.query
      
      const finalOwnerId = ownerId || owner_id || userId
      const stats = await Project.getStats(finalOwnerId, id_org)

      ResponseUtils.success(res, 200, 'Project statistics retrieved successfully', stats)
      
      console.log(`✅ Retrieved project stats (JWT verified)`)
    } catch (error) {
      console.error('Error fetching project stats:', error)
      ResponseUtils.error(res, 500, 'Failed to fetch project statistics', error.message)
    }
  }

  static async getProjectsByOrg(req, res) {
    try {
      const { id_org } = req.params
      const { status, page = 1, limit = 10 } = req.query

      if (!id_org || isNaN(parseInt(id_org))) {
        return ResponseUtils.validationError(res, 'Invalid organization ID provided')
      }

      if (!ValidationUtils.validatePagination(page, limit)) {
        return ResponseUtils.validationError(res, 'Invalid pagination parameters')
      }

      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))

      let result
      if (status) {
        result = await Project.findByStatus(status, null, parseInt(id_org), pageNum, limitNum)
      } else {
        result = await Project.findAll(null, parseInt(id_org), pageNum, limitNum)
      }

      ResponseUtils.success(res, 200, 'Organization projects retrieved successfully', {
        projects: result.projects.map(p => p.toJSON()),
        pagination: result.pagination,
        count: result.projects.length
      })
      
      console.log(`✅ Retrieved org projects ${id_org} (JWT verified)`)
    } catch (error) {
      console.error('Error fetching organization projects:', error)
      ResponseUtils.error(res, 500, 'Failed to fetch organization projects', error.message)
    }
  }

  static async searchProjects(req, res) {
    try {
      const { 
        q,
        status,
        location,
        created_after,
        created_before,
        page = 1,
        limit = 10
      } = req.query

      if (!ValidationUtils.validatePagination(page, limit)) {
        return ResponseUtils.validationError(res, 'Invalid pagination parameters')
      }

      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))

      // Implementar búsqueda básica por ahora
      let result = await Project.findAll(null, null, pageNum, limitNum)

      // Filtrar por query si se proporciona
      if (q && q.trim()) {
        const searchTerm = q.toLowerCase().trim()
        result.projects = result.projects.filter(p => 
          p.name.toLowerCase().includes(searchTerm) || 
          (p.description && p.description.toLowerCase().includes(searchTerm))
        )
      }

      ResponseUtils.success(res, 200, 'Search completed successfully', {
        projects: result.projects.map(p => p.toJSON()),
        pagination: result.pagination,
        search: { query: q, filters: { status, location, created_after, created_before } },
        count: result.projects.length
      })

    } catch (error) {
      console.error('Error searching projects:', error)
      ResponseUtils.error(res, 500, 'Failed to search projects', error.message)
    }
  }
}