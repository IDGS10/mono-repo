import Project from '../models/Project.js'
import { query } from '../config/database.js'

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
      
      // POLÍTICA DE SEGURIDAD: Validar parámetros de paginación
      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)) // Máximo 100 por página
      
      // Soportar diferentes nombres de parámetros para compatibilidad
      const finalOwnerId = ownerId || owner_id || userId
      let result

      if (status) {
        result = await Project.findByStatus(status, finalOwnerId, id_org, pageNum, limitNum)
      } else {
        result = await Project.findAll(finalOwnerId, id_org, pageNum, limitNum)
      }

      res.status(200).json({
        success: true,
        data: result.projects.map(p => p.toJSON()),
        pagination: result.pagination,
        count: result.projects.length,
        message: 'Projects retrieved successfully'
      })
      
      console.log(`✅ Retrieved ${result.projects.length} projects (JWT verified)`)
    } catch (error) {
      console.error('Error fetching projects:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error.message
      })
    }
  }

  // Get project by ID
  static async getProject(req, res) {
    try {
      const { id } = req.params
 
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID provided'
        })
      }

      const project = await Project.findById(parseInt(id))

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

    
      res.status(200).json({
        success: true,
        data: project.toJSON(),
        message: 'Project retrieved successfully'
      })
      
      console.log(`✅ Retrieved project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error fetching project:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project',
        error: error.message
      })
    }
  }

  // Create new project
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

      
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        })
      }

      // Usar el usuario del JWT como creador principal
      const jwtUserId = req.user.userId || req.user.sub
      const creatorId = created_by || userId || requesterId || owner_id || jwtUserId

      if (!creatorId) {
        return res.status(400).json({
          success: false,
          message: 'Creator ID is required'
        })
      }

      
      const projectData = {
        name: name.trim().substring(0, 255), // Limitar longitud
        description: description?.trim().substring(0, 1000),
        location: location?.trim().substring(0, 255),
        status: 'pending_approval', // Forzar status inicial
        created_by: creatorId,
        modified_by: creatorId,
        owner_id: creatorId,
        id_org: id_org || null
      }

      const project = new Project(projectData)
      const savedProject = await project.save()

      res.status(201).json({
        success: true,
        data: savedProject.toJSON(),
        message: 'Project created successfully'
      })
      
      console.log(`✅ Created project ${savedProject.id_project} (JWT verified)`)
    } catch (error) {
      console.error('Error creating project:', error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'A project with this name already exists'
        })
      }
      
      if (error.code === '23503') { // Foreign key constraint violation
        return res.status(400).json({
          success: false,
          message: 'Invalid organization or user ID'
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error.message
      })
    }
  }

  // Update project
  static async updateProject(req, res) {
    try {
      const { id } = req.params
      const updates = req.body

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID provided'
        })
      }

      const project = await Project.findById(parseInt(id))
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      const jwtUserId = req.user.userId || req.user.sub
      updates.modified_by = updates.modified_by || updates.userId || jwtUserId


      const allowedUpdates = ['name', 'description', 'location', 'status', 'modified_by', 'id_org', 'owner_id']
      const sanitizedUpdates = {}
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key) && updates[key] !== undefined) {
          if (typeof updates[key] === 'string') {
            sanitizedUpdates[key] = updates[key].trim()
          } else {
            sanitizedUpdates[key] = updates[key]
          }
        }
      })

      const updatedProject = await project.update(sanitizedUpdates)

      res.status(200).json({
        success: true,
        data: updatedProject.toJSON(),
        message: 'Project updated successfully'
      })
      
      console.log(`✅ Updated project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error updating project:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        error: error.message
      })
    }
  }

  // Delete project
  static async deleteProject(req, res) {
    try {
      const { id } = req.params

          
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID provided'
        })
      }

      const deletedProject = await Project.delete(parseInt(id))

      res.status(200).json({
        success: true,
        data: deletedProject.toJSON(),
        message: 'Project deleted successfully'
      })
      
      console.log(`✅ Deleted project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error deleting project:', error)
      
      if (error.message === 'Project not found') {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message
      })
    }
  }

  // Approve project
  static async approveProject(req, res) {
    try {
      const { id } = req.params
      const { modified_by, userId } = req.body
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID provided'
        })
      }

      const project = await Project.findById(parseInt(id))
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      if (project.status !== 'pending_approval') {
        return res.status(400).json({
          success: false,
          message: 'Project must be in pending approval status'
        })
      }

 
      const jwtUserId = req.user.userId || req.user.sub
      const updateData = { 
        status: 'approved',
        modified_by: modified_by || userId || jwtUserId
      }

      const updatedProject = await project.update(updateData)

      res.status(200).json({
        success: true,
        data: updatedProject.toJSON(),
        message: 'Project approved successfully'
      })
      
      console.log(`✅ Approved project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error approving project:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to approve project',
        error: error.message
      })
    }
  }

  // Reject project
  static async rejectProject(req, res) {
    try {
      const { id } = req.params
      const { reason, modified_by, userId } = req.body

      // POLÍTICA DE SEGURIDAD: Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID provided'
        })
      }

      const project = await Project.findById(parseInt(id))
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      if (project.status !== 'pending_approval') {
        return res.status(400).json({
          success: false,
          message: 'Project must be in pending approval status'
        })
      }

      // POLÍTICA DE SEGURIDAD: Usar JWT user
      const jwtUserId = req.user.userId || req.user.sub
      const updateData = { 
        status: 'rejected',
        modified_by: modified_by || userId || jwtUserId
      }

      const updatedProject = await project.update(updateData)

      res.status(200).json({
        success: true,
        data: updatedProject.toJSON(),
        message: 'Project rejected successfully',
        reason: reason?.trim()
      })
      
      console.log(`✅ Rejected project ${id} (JWT verified)`)
    } catch (error) {
      console.error('Error rejecting project:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to reject project',
        error: error.message
      })
    }
  }

  // Get project statistics
  static async getProjectStats(req, res) {
    try {
      const { ownerId, owner_id, userId, id_org } = req.query
      
      const finalOwnerId = ownerId || owner_id || userId
      const stats = await Project.getStats(finalOwnerId, id_org)

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Project statistics retrieved successfully'
      })
      
      console.log(`✅ Retrieved project stats (JWT verified)`)
    } catch (error) {
      console.error('Error fetching project stats:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project statistics',
        error: error.message
      })
    }
  }

  // Get projects by organization - POLÍTICA: Con paginación
  static async getProjectsByOrg(req, res) {
    try {
      const { id_org } = req.params
      const { status, page = 1, limit = 10 } = req.query

      // POLÍTICA DE SEGURIDAD: Validar parámetros
      if (!id_org || isNaN(parseInt(id_org))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid organization ID provided'
        })
      }

      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))

      let result
      if (status) {
        result = await Project.findByStatus(status, null, parseInt(id_org), pageNum, limitNum)
      } else {
        result = await Project.findAll(null, parseInt(id_org), pageNum, limitNum)
      }

      res.status(200).json({
        success: true,
        data: result.projects.map(p => p.toJSON()),
        pagination: result.pagination,
        count: result.projects.length,
        message: 'Organization projects retrieved successfully'
      })
      
      console.log(`✅ Retrieved org projects ${id_org} (JWT verified)`)
    } catch (error) {
      console.error('Error fetching organization projects:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization projects',
        error: error.message
      })
    }
  }

  // Get projects by user (filtered by JWT user)
  static async getMyProjects(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query
      
      // POLÍTICA DE SEGURIDAD: Usar JWT user ID
      const jwtUserId = req.user.userId || req.user.sub
      
      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))

      let result
      if (status) {
        result = await Project.findByStatus(status, jwtUserId, null, pageNum, limitNum)
      } else {
        result = await Project.findAll(jwtUserId, null, pageNum, limitNum)
      }

      res.status(200).json({
        success: true,
        data: result.projects.map(p => p.toJSON()),
        pagination: result.pagination,
        count: result.projects.length,
        message: 'User projects retrieved successfully'
      })
      
      console.log(`✅ Retrieved ${result.projects.length} projects for user ${jwtUserId} (JWT verified)`)
    } catch (error) {
      console.error('Error fetching user projects:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user projects',
        error: error.message
      })
    }
  }

  // Bulk operations (admin only)
  static async bulkUpdateProjects(req, res) {
    try {
      const { projectIds, updates } = req.body

      // POLÍTICA DE SEGURIDAD: Validar entrada
      if (!Array.isArray(projectIds) || projectIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Project IDs array is required'
        })
      }

      if (projectIds.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 projects can be updated at once'
        })
      }

      const jwtUserId = req.user.userId || req.user.sub
      const sanitizedUpdates = {
        ...updates,
        modified_by: jwtUserId
      }

      const updatedProjects = []
      const errors = []

      for (const projectId of projectIds) {
        try {
          const project = await Project.findById(parseInt(projectId))
          if (project) {
            const updatedProject = await project.update(sanitizedUpdates)
            updatedProjects.push(updatedProject.toJSON())
          } else {
            errors.push({ projectId, error: 'Project not found' })
          }
        } catch (error) {
          errors.push({ projectId, error: error.message })
        }
      }

      res.status(200).json({
        success: true,
        data: {
          updated: updatedProjects,
          errors: errors
        },
        message: `Bulk update completed: ${updatedProjects.length} updated, ${errors.length} errors`
      })

      console.log(`✅ Bulk updated ${updatedProjects.length} projects (JWT verified)`)
    } catch (error) {
      console.error('Error in bulk update:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk update',
        error: error.message
      })
    }
  }

  // Search projects with filters
  static async searchProjects(req, res) {
    try {
      const { 
        q, // search query
        status,
        location,
        created_after,
        created_before,
        page = 1,
        limit = 10
      } = req.query

      // POLÍTICA DE SEGURIDAD: Validar parámetros
      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))

      // Base query with specific fields
      let searchQuery = `
        SELECT ${Project.getSelectFields()}
        FROM projects 
        WHERE 1=1
      `
      const values = []
      let paramCount = 1

      // Search in name and description
      if (q && q.trim()) {
        searchQuery += ` AND (
          LOWER(name) LIKE LOWER($${paramCount}) OR 
          LOWER(description) LIKE LOWER($${paramCount})
        )`
        values.push(`%${q.trim()}%`)
        paramCount++
      }

      // Filter by status
      if (status) {
        searchQuery += ` AND status = $${paramCount}`
        values.push(status)
        paramCount++
      }

      // Filter by location
      if (location) {
        searchQuery += ` AND LOWER(location) LIKE LOWER($${paramCount})`
        values.push(`%${location.trim()}%`)
        paramCount++
      }

      // Date filters
      if (created_after) {
        searchQuery += ` AND created_at >= $${paramCount}`
        values.push(created_after)
        paramCount++
      }

      if (created_before) {
        searchQuery += ` AND created_at <= $${paramCount}`
        values.push(created_before)
        paramCount++
      }

      // Count query for pagination
      const countQuery = searchQuery.replace(
        `SELECT ${Project.getSelectFields()}`,
        'SELECT COUNT(*) as total'
      )

      // Add pagination
      searchQuery += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
      const offset = (pageNum - 1) * limitNum
      const queryValues = [...values, limitNum, offset]

      // Execute queries
      const [dataResult, countResult] = await Promise.all([
        query(searchQuery, queryValues),
        query(countQuery, values)
      ])

      const projects = dataResult.rows.map(row => new Project(row))
      const total = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(total / limitNum)

      res.status(200).json({
        success: true,
        data: projects.map(p => p.toJSON()),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        search: {
          query: q,
          filters: { status, location, created_after, created_before }
        },
        count: projects.length,
        message: 'Search completed successfully'
      })

      console.log(`✅ Search completed: ${projects.length} results (JWT verified)`)
    } catch (error) {
      console.error('Error searching projects:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to search projects',
        error: error.message
      })
    }
  }
}