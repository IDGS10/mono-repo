const Organization = require('../models/Organization');
const UserInvitation = require('../models/UserInvitation');
const ProjectApproval = require('../models/ProjectApproval');

class OrganizationService {
  static async getDashboardData(organizationId) {
    try {
      const organization = await Organization.findById(organizationId);
      const invitations = await UserInvitation.findByOrganization(organizationId);
      const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
      const pendingProjects = await ProjectApproval.findPendingByOrganization(organizationId);
       
      return {
        organization,
        stats: {
          pending_invitations: pendingInvitations.length,
          pending_projects: pendingProjects.length,
        },
        pending_invitations: pendingInvitations.slice(0, 5), 
        pending_projects: pendingProjects.slice(0, 5) 
      };
    } catch (error) {
      throw new Error(`Error obteniendo datos del dashboard: ${error.message}`);
    }
  }

  static async validateOrganizationAccess(userId, organizationId) {
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    if (organization.owner_id !== userId) {
      throw new Error('No tienes acceso a esta organización');
    }

    return organization;
  }
}

module.exports = OrganizationService;