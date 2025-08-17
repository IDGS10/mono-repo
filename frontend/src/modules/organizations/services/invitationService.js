import { OrganizationsApi } from '../../../Api.jsx';

// Invitations API Service using configured Axios instance
class InvitationService {
  // Get invitations by organization
  static async getByOrganization(organizationId) {
    try {
      const response = await OrganizationsApi.get(`/invitations/organization/${organizationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  }

  // Create new invitation
  static async create(invitationData) {
    try {
      const response = await OrganizationsApi.post('/invitations', invitationData);
      return response.data;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  // Resend invitation
  static async resend(invitationId) {
    try {
      const response = await OrganizationsApi.post(`/invitations/${invitationId}/resend`);
      return response.data;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  // Revoke invitation
  static async revoke(invitationId) {
    try {
      const response = await OrganizationsApi.patch(`/invitations/${invitationId}/revoke`);
      return response.data;
    } catch (error) {
      console.error('Error revoking invitation:', error);
      throw error;
    }
  }

  // Delete invitation
  static async delete(invitationId) {
    try {
      const response = await OrganizationsApi.delete(`/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  }

  // Get invitation by ID
  static async getById(invitationId) {
    try {
      const response = await OrganizationsApi.get(`/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  }

  // Verify invitation token (public route)
  static async verifyToken(token) {
    try {
      const response = await OrganizationsApi.get(`/invitations/verify/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying invitation token:', error);
      throw error;
    }
  }

  // Accept invitation (public route)
  static async accept(token, userData) {
    try {
      const response = await OrganizationsApi.post(`/invitations/accept/${token}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Utility methods
  static isExpired(invitation) {
    return new Date(invitation.expires_at) < new Date();
  }
  

  static canResend(invitation) {
    return invitation.status === 'pending' && !this.isExpired(invitation);
  }

  static canRevoke(invitation) {
    return invitation.status === 'pending';
  }

  static getStatusText(status) {
    const statusTexts = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      expired: 'Expirada',
      revoked: 'Revocada'
    };
    return statusTexts[status] || status;
  }

  static getRoleText(role) {
    const roleTexts = {
      'líder': 'Líder',
      'encargado': 'Encargado'
    };
    return roleTexts[role] || role;
  }

  // Validation helpers
  static validateInvitationData(data) {
    const errors = {};

    if (!data.invited_name?.trim()) {
      errors.invited_name = 'El nombre es requerido';
    } else if (data.invited_name.length < 2) {
      errors.invited_name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!data.invited_email?.trim()) {
      errors.invited_email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.invited_email)) {
      errors.invited_email = 'El email debe tener un formato válido';
    }

    if (!data.invited_role) {
      errors.invited_role = 'El rol es requerido';
    } else if (!['líder', 'encargado'].includes(data.invited_role)) {
      errors.invited_role = 'El rol debe ser líder o encargado';
    }

    if (!data.organization_id) {
      errors.organization_id = 'El ID de organización es requerido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Filter helpers
  static filterByStatus(invitations, status) {
    if (!status) return invitations;
    return invitations.filter(inv => inv.status === status);
  }

  static filterByRole(invitations, role) {
    if (!role) return invitations;
    return invitations.filter(inv => inv.invited_role === role);
  }

  static filterBySearch(invitations, searchTerm) {
    if (!searchTerm) return invitations;
    const term = searchTerm.toLowerCase();
    return invitations.filter(inv =>
      inv.invited_name.toLowerCase().includes(term) ||
      inv.invited_email.toLowerCase().includes(term)
    );
  }

  static getStats(invitations) {
    return {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === 'pending').length,
      accepted: invitations.filter(inv => inv.status === 'accepted').length,
      expired: invitations.filter(inv => inv.status === 'expired').length,
      revoked: invitations.filter(inv => inv.status === 'revoked').length
    };
  }
}

export default InvitationService;