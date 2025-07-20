import Project from '../models/Project.js'

export default class ProjectController {
  // Get all projects
  static async getProjects(req, res) {
    try {
      const { ownerId, owner_id, userId, status, id_org } = req.query
      
      // Soportar diferentes nombres de parámetros para compatibilidad
      const finalOwnerId = ownerId || owner_id || userId
      let projects

      if (status) {
        projects = await Project.findByStatus(status, finalOwnerId, id_org)
      } else {
        projects = await Project.findAll(finalOwnerId, id_org)
      }

      res.status(200).json({
        success: true,
        data: projects.map(p => p.toJSON()),
        count: projects.length,
        message: 'Projects retrieved successfully'
      })
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

      // Validation
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        })
      }

      // Determinar el usuario que crea el proyecto
      const creatorId = created_by || userId || requesterId || owner_id
      if (!creatorId) {
        return res.status(400).json({
          success: false,
          message: 'Creator ID is required (userId, created_by, or owner_id)'
        })
      }

      const projectData = {
        name: name.trim(),
        description: description?.trim(),
        location: location?.trim(),
        status: 'pending_approval',
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

      const project = await Project.findById(parseInt(id))
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      // Add modified_by if provided
      if (updates.userId || updates.modified_by) {
        updates.modified_by = updates.modified_by || updates.userId
      }

      const updatedProject = await project.update(updates)

      res.status(200).json({
        success: true,
        data: updatedProject.toJSON(),
        message: 'Project updated successfully'
      })
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

      const deletedProject = await Project.delete(parseInt(id))

      res.status(200).json({
        success: true,
        data: deletedProject.toJSON(),
        message: 'Project deleted successfully'
      })
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

      const updateData = { 
        status: 'approved'
      }
      
      if (modified_by || userId) {
        updateData.modified_by = modified_by || userId
      }

      const updatedProject = await project.update(updateData)

      res.status(200).json({
        success: true,
        data: updatedProject.toJSON(),
        message: 'Project approved successfully'
      })
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

      const updateData = { 
        status: 'rejected'
      }
      
      if (modified_by || userId) {
        updateData.modified_by = modified_by || userId
      }

      const updatedProject = await project.update(updateData)

      res.status(200).json({
        success: true,
        data: updatedProject.toJSON(),
        message: 'Project rejected successfully',
        reason: reason
      })
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
    } catch (error) {
      console.error('Error fetching project stats:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project statistics',
        error: error.message
      })
    }
  }

  // Get projects by organization
  static async getProjectsByOrg(req, res) {
    try {
      const { id_org } = req.params
      const { status } = req.query

      let projects
      if (status) {
        projects = await Project.findByStatus(status, null, parseInt(id_org))
      } else {
        projects = await Project.findAll(null, parseInt(id_org))
      }

      res.status(200).json({
        success: true,
        data: projects.map(p => p.toJSON()),
        count: projects.length,
        message: 'Organization projects retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching organization projects:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization projects',
        error: error.message
      })
    }
  }
}