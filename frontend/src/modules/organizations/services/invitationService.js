const API_BASE = "http://localhost:3001/api";

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

class InvitationService {
  // Get invitations by organization
  static async getByOrganization(organizationId) {
    const response = await fetch(`${API_BASE}/invitations/organization/${organizationId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Create new invitation
  static async create(invitationData) {
    const response = await fetch(`${API_BASE}/invitations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invitationData)
    });
    return handleResponse(response);
  }

  // Resend invitation
  static async resend(invitationId) {
    const response = await fetch(`${API_BASE}/invitations/${invitationId}/resend`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Revoke invitation
  static async revoke(invitationId) {
    const response = await fetch(`${API_BASE}/invitations/${invitationId}/revoke`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Delete invitation
  static async delete(invitationId) {
    const response = await fetch(`${API_BASE}/invitations/${invitationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Get invitation by token (for accepting invitations - future use)
  static async getByToken(token) {
    const response = await fetch(`${API_BASE}/invitations/token/${token}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Accept invitation (future use)
  static async accept(token) {
    const response = await fetch(`${API_BASE}/invitations/accept/${token}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
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