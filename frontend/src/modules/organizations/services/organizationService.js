import { OrganizationsApi } from '../../../Api.jsx';

// Organizations API Service using configured Axios instance
class OrganizationService {
  // Get dashboard data
  static async getDashboard() {
    try {
      const response = await OrganizationsApi.get('/organizations/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  // Get organization types
  static async getTypes() {
    try {
      const response = await OrganizationsApi.get('/organizations/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching organization types:', error);
      throw error;
    }
  }

  // Create new organization
  static async create(organizationData) {
    try {
      const response = await OrganizationsApi.post('/organizations', organizationData);
      return response.data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  // Get organization by ID
  static async getById(id) {
    try {
      const response = await OrganizationsApi.get(`/organizations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  }

  // Update organization
  static async update(id, organizationData) {
    try {
      const response = await OrganizationsApi.put(`/organizations/${id}`, organizationData);
      return response.data;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  // Update organization status (active/inactive)
  static async updateStatus(id, isActive) {
    try {
      const response = await OrganizationsApi.patch(`/organizations/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error updating organization status:', error);
      throw error;
    }
  }

  // Get basic organization info (for other modules)
  static async getBasicInfo(id) {
    try {
      const response = await OrganizationsApi.get(`/organizations/${id}/basic`);
      return response.data;
    } catch (error) {
      console.error('Error fetching basic organization info:', error);
      throw error;
    }
  }

  // Get active organizations (for other modules)
  static async getActiveOrganizations() {
    try {
      const response = await OrganizationsApi.get('/organizations/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active organizations:', error);
      throw error;
    }
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