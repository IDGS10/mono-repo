const ProjectApproval = require('../models/ProjectApproval');
const Organization = require('../models/Organization');

class ProjectController {
  // POST API APPROVAL PROJECT
  // PROJECT JSON RECEPTION - PROJECT MODULE

  static async createApprovalRequest(req, res, next) {
    try {
      const { organization_id, ...projectData } = req.body;

// ORG_ID - OBLIGATORY

      if (!organization_id) {
        return res.status(400).json({
          error: 'organization_id es requerido'
        });
      }

// ID TEMPORAL - OBLIGATORY

      if (!projectData.id) {
        return res.status(400).json({
          error: 'id del proyecto temporal es requerido'
        });
      }

// NAME - OBLIGATORY

      if (!projectData.name) {
        return res.status(400).json({
          error: 'name del proyecto es requerido'
        });
      }

      // VERIFY ORG

      const organization = await Organization.findById(organization_id);
      
      if (!organization) {
        return res.status(404).json({
          error: 'Organización no encontrada',
          debug: `No se encontró organización con ID: ${organization_id}`
        });
      }

      if (!organization.isactive) {
        return res.status(400).json({
          error: 'La organización no está activa',
          debug: {
            organization_id: organization.id_organization,
            name: organization.name,
            isActive: organization.isactive
          }
        });
      }

      // CHECK PENDING APPROVAL FOR THIS PROJECT

      const exists = await ProjectApproval.exists(projectData.id);
      if (exists) {
        return res.status(409).json({
          error: 'Ya existe una solicitud de aprobación para este proyecto'
        });
      }


      // CREATE REQUEST
      const approval = await ProjectApproval.create(
        organization_id, 
        projectData.id, 
        projectData
      );

      res.status(201).json({
        message: 'Solicitud de aprobación creada exitosamente',
        temporal_id: approval.temporal_id,
        temporal_project_id: approval.temporal_project_id,
        organization_id: approval.organization_id,
        status: approval.status
      });
    } catch (error) {
      console.error('Error en createApprovalRequest:', error);
      next(error);
    }
  }

  // PENDIG APPROVALS
  static async getPendingApprovals(req, res, next) {
    try {
      const { orgId } = req.params;
      const userId = req.user.id;
      const organization = await Organization.findById(orgId);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes acceso a esta organización'
        });
      }

      const pendingProjects = await ProjectApproval.findPendingByOrganization(orgId);

      res.json({
        pending_projects: pendingProjects.map(project => ({
          temporal_id: project.temporal_id,
          temporal_project_id: project.temporal_project_id,
          name: project.project_data.name,
          description: project.project_data.description,
          location: project.project_data.location,
          start_date: project.project_data.startDate,
          requested_by: project.project_data.userId,
          budget: project.project_data.budget,
          duration: project.project_data.duration,
          sensors: project.project_data.sensors,
          status: project.status,
          requested_at: project.created_at,
          full_data: project.project_data
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  // GET PROJECT DETAILS

  static async getProjectDetails(req, res, next) {
    try {
      const { temporalId } = req.params;
      const userId = req.user.id;

      const approval = await ProjectApproval.findByTemporalId(temporalId);
      if (!approval) {
        return res.status(404).json({
          error: 'Proyecto no encontrado'
        });
      }
      const organization = await Organization.findById(approval.organization_id);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes acceso a este proyecto'
        });
      }

      res.json({
        temporal_id: approval.temporal_id,
        temporal_project_id: approval.temporal_project_id,
        organization_id: approval.organization_id,
        status: approval.status,
        requested_at: approval.created_at,
        reviewed_at: approval.reviewed_at,
        reviewed_by: approval.reviewed_by,
        review_notes: approval.review_notes,
        real_project_id: approval.real_project_id,
        project_data: approval.project_data
      });
    } catch (error) {
      next(error);
    }
  }

  // POST APROBATION PROJECT

  static async approveProject(req, res, next) {
    try {
      const { temporalId } = req.params;
      const { review_notes } = req.body;
      const userId = req.user.id;

      const approval = await ProjectApproval.findByTemporalId(temporalId);
      if (!approval) {
        return res.status(404).json({
          error: 'Solicitud de aprobación no encontrada'
        });
      }

      if (approval.status !== 'pending') {
        return res.status(400).json({
          error: 'Este proyecto ya fue revisado'
        });
      }

      const organization = await Organization.findById(approval.organization_id);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes permisos para aprobar este proyecto'
        });
      }
      const updatedApproval = await ProjectApproval.updateStatus(
        temporalId,
        'approved',
        userId,
        review_notes
      );

      // NOTIFY THE PROJECT MODULE - ¡¡¡¡ CHECK THIS EQUIPMENT!!!!

      try {
        const realProjectId = await ProjectController.notifyProjectApproval({
          temporal_project_id: approval.temporal_project_id,
          organization_id: approval.organization_id,
          reviewed_by: userId,
          review_notes: review_notes,
          project_data: approval.project_data
        });

        //  CREATE REAL ID

        if (realProjectId) {
          await ProjectApproval.updateRealProjectId(temporalId, realProjectId);
        }
      } catch (notificationError) {
        console.error('Error notificando al módulo de proyectos:', notificationError);
      }

      res.json({
        message: 'Proyecto aprobado exitosamente',
        temporal_id: updatedApproval.temporal_id,
        temporal_project_id: updatedApproval.temporal_project_id,
        status: updatedApproval.status,
        reviewed_at: updatedApproval.reviewed_at,
        project_name: approval.project_data.name
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectProject(req, res, next) {
    try {
      const { temporalId } = req.params;
      const { review_notes } = req.body;
      const userId = req.user.id;

      if (!review_notes || review_notes.trim().length === 0) {
        return res.status(400).json({
          error: 'Las notas de rechazo son requeridas'
        });
      }

      const approval = await ProjectApproval.findByTemporalId(temporalId);
      if (!approval) {
        return res.status(404).json({
          error: 'Solicitud de aprobación no encontrada'
        });
      }

      if (approval.status !== 'pending') {
        return res.status(400).json({
          error: 'Este proyecto ya fue revisado'
        });
      }
      const organization = await Organization.findById(approval.organization_id);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes permisos para rechazar este proyecto'
        });
      }

      const updatedApproval = await ProjectApproval.updateStatus(
        temporalId,
        'rejected',
        userId,
        review_notes
      );

       // NOTIFY REJECT THE PROJECT MODULE - ¡¡¡¡ CHECK THIS EQUIPMENT!!!!

      try {
        await ProjectController.notifyProjectRejection({
          temporal_project_id: approval.temporal_project_id,
          organization_id: approval.organization_id,
          reviewed_by: userId,
          review_notes: review_notes
        });
      } catch (notificationError) {
        console.error('Error notificando rechazo:', notificationError);
      }

      res.json({
        message: 'Proyecto rechazado',
        temporal_id: updatedApproval.temporal_id,
        temporal_project_id: updatedApproval.temporal_project_id,
        status: updatedApproval.status,
        reviewed_at: updatedApproval.reviewed_at,
        project_name: approval.project_data.name
      });
    } catch (error) {
      next(error);
    }
  }

  // GET HISTORIAL APPROVAL

  static async getApprovalHistory(req, res, next) {
    try {
      const { orgId } = req.params;
      const { limit = 50 } = req.query;
      const userId = req.user.id;

      const organization = await Organization.findById(orgId);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes acceso a esta organización'
        });
      }

      const history = await ProjectApproval.getHistory(orgId, parseInt(limit));

      res.json({
        history: history.map(project => ({
          temporal_id: project.temporal_id,
          temporal_project_id: project.temporal_project_id,
          name: project.project_data.name,
          description: project.project_data.description,
          status: project.status,
          requested_at: project.created_at,
          reviewed_at: project.reviewed_at,
          reviewed_by: project.reviewed_by,
          review_notes: project.review_notes,
          real_project_id: project.real_project_id
        }))
      });
    } catch (error) {
      next(error);
    }
  }
  static async searchProjects(req, res, next) {
    try {
      const { orgId } = req.params;
      const { q } = req.query;
      const userId = req.user.id;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          error: 'Parámetro de búsqueda requerido'
        });
      }
      const organization = await Organization.findById(orgId);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes acceso a esta organización'
        });
      }

      const results = await ProjectApproval.searchProjects(orgId, q);

      res.json({
        search_term: q,
        results: results.map(project => ({
          temporal_id: project.temporal_id,
          temporal_project_id: project.temporal_project_id,
          name: project.project_data.name,
          description: project.project_data.description,
          status: project.status,
          created_at: project.created_at
        }))
      });
    } catch (error) {
      next(error);
    }
  }
  // NOTIFICATION METHODS
  static async notifyProjectApproval(approvalData) {
    const {
      temporal_project_id,
      organization_id,
      reviewed_by,
      review_notes,
      project_data
    } = approvalData;

    try {

      // URL SERVER PROJECT MODULE
      const projectsServerUrl = process.env.PROJECTS_MODULE_URL || 'http://localhost:3002';
      
      const payload = {
        temporal_project_id,
        organization_id,
        status: 'approved',
        reviewed_by,
        review_notes,
        approved_at: new Date().toISOString(),
        project_data: project_data
      };

      const response = await fetch(`${projectsServerUrl}/api/projects/create-approved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error del módulo de proyectos:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Proyecto aprobado notificado exitosamente:', result);  // CHECK CONSOLE FOR NOTIFICATION
      return result.project_id || result.real_project_id || result.id;
      
    } catch (error) {
      console.error('Error notificando aprobación:', error.message);

      throw error;
    }
  }

  static async notifyProjectRejection(rejectionData) {
    const {
      temporal_project_id,
      organization_id,
      reviewed_by,
      review_notes
    } = rejectionData;

    try {
      const projectsServerUrl = process.env.PROJECTS_MODULE_URL || 'http://localhost:3002';
      
      const payload = {
        temporal_project_id,
        organization_id,
        status: 'rejected',
        reviewed_by,
        review_notes,
        rejected_at: new Date().toISOString()
      };
      const response = await fetch(`${projectsServerUrl}/api/projects/notify-rejection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error notificando rechazo:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      const result = await response.json();    
      return result;
      
    } catch (error) {
      console.error('Error notificando rechazo:', error.message);
      throw error;
    }
  }

  static async notifyProjectModule(projectId, status, reviewNotes) {
    console.warn('DEPRECADO: Usar notifyProjectApproval o notifyProjectRejection');
    
    try {
      const projectsServerUrl = process.env.PROJECTS_MODULE_URL || 'http://localhost:3002';
      
      const response = await fetch(`${projectsServerUrl}/api/projects/${projectId}/approval-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          review_notes: reviewNotes,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error notificando al módulo de proyectos:', errorData);
        throw new Error(`Error ${response.status}: ${errorData.message || 'Error desconocido'}`);
      }
      const result = await response.json();
      console.log('Notificación enviada correctamente:', result);
      return result;
    } catch (error) {
      console.error('Error en notifyProjectModule:', error.message);
      throw error;
    }
  }

}

module.exports = ProjectController;