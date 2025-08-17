import { API_CONFIG } from '../../../config/api.js';

const API_BASE = API_CONFIG.BASE_API || "http://localhost:3001/api";


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

class OrganizationService {
  // Get dashboard data
  static async getDashboard() {
    const response = await fetch(`${API_BASE}/organizations/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Get organization types
  static async getTypes() {
    const response = await fetch(`${API_BASE}/organizations/types`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Create new organization
  static async create(organizationData) {
    const response = await fetch(`${API_BASE}/organizations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(organizationData)
    });
    return handleResponse(response);
  }

  // Get organization by ID
  static async getById(id) {
    const response = await fetch(`${API_BASE}/organizations/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Update organization
  static async update(id, organizationData) {
    const response = await fetch(`${API_BASE}/organizations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(organizationData)
    });
    return handleResponse(response);
  }

  // Update organization status (active/inactive)
  static async updateStatus(id, isActive) {
    const response = await fetch(`${API_BASE}/organizations/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive })
    });
    return handleResponse(response);
  }

  // Get basic organization info (for other modules)
  static async getBasicInfo(id) {
    const response = await fetch(`${API_BASE}/organizations/${id}/basic`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Get active organizations (for other modules)
  static async getActiveOrganizations() {
    const response = await fetch(`${API_BASE}/organizations/active`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Utility method to check if user has organization
  static async hasOrganization() {
    try {
      const dashboard = await this.getDashboard();
      return {
        hasOrganization: dashboard.hasOrganization,
        organization: dashboard.organization?.organization || null
      };
    } catch (error) {
      throw new Error('Error checking organization status: ' + error.message);
    }
  }

  // Validation helpers
  static validateOrganizationData(data) {
    const errors = {};

    if (!data.name?.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (data.name.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!data.organization_email?.trim()) {
      errors.organization_email = 'El email institucional es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.organization_email)) {
      errors.organization_email = 'El email debe tener un formato válido';
    }

    if (!data.organization_type_id) {
      errors.organization_type_id = 'El tipo de organización es requerido';
    }

    if (data.phone_number && !/^[\+]?[0-9\-\(\)\s]+$/.test(data.phone_number)) {
      errors.phone_number = 'El formato del teléfono no es válido';
    }

    if (data.logo_url && !/^https?:\/\/.*\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(data.logo_url)) {
      errors.logo_url = 'La URL del logo debe ser válida y apuntar a una imagen';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default OrganizationService;