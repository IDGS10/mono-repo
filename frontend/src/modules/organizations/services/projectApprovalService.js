import { API_CONFIG } from '../../../config/api.js';

const API_BASE = API_CONFIG.BASE_API || "http://localhost:8200/api";


const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

class ProjectApprovalService {
  static async getAll() {
    const response = await fetch(`${API_BASE}/project-approvals`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  static async getById(temporalId) {
    const response = await fetch(`${API_BASE}/project-approvals/${temporalId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  static async approve(temporalId, reviewNotes = '') {
    const response = await fetch(`${API_BASE}/project-approvals/${temporalId}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        review_notes: reviewNotes 
      })
    });
    return handleResponse(response);
  }

  static async reject(temporalId, reviewNotes = '') {
    const response = await fetch(`${API_BASE}/project-approvals/${temporalId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        review_notes: reviewNotes 
      })
    });
    return handleResponse(response);
  }

  static async getByStatus(status) {
    const response = await fetch(`${API_BASE}/project-approvals?status=${status}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  static async getByOrganization(organizationId) {
    const response = await fetch(`${API_BASE}/project-approvals?organization_id=${organizationId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  static getStatusText(status) {
    const statusTexts = {
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'under_review': 'En Revisión'
    };
    return statusTexts[status] || status;
  }

  static getStatusColor(status) {
    const statusColors = {
      'pending': 'yellow',
      'approved': 'green',
      'rejected': 'red',
      'under_review': 'blue'
    };
    return statusColors[status] || 'gray';
  }

  static parseProjectData(projectData) {
    try {
      if (typeof projectData === 'string') {
        return JSON.parse(projectData);
      }
      return projectData;
    } catch (error) {
      console.error('Error parsing project data:', error);
      return null;
    }
  }

  static formatDuration(duration) {
    if (!duration) return 'No especificada';
    return duration;
  }

  static formatSensors(sensors) {
    if (!Array.isArray(sensors)) return 'No especificados';
    return sensors.join(', ');
  }

  static formatDate(dateString) {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static validateApprovalData(data) {
    const errors = {};

    if (!data.review_notes?.trim()) {
      errors.review_notes = 'Las notas de revisión son requeridas';
    } else if (data.review_notes.length < 10) {
      errors.review_notes = 'Las notas deben tener al menos 10 caracteres';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static filterByStatus(approvals, status) {
    if (!status) return approvals;
    return approvals.filter(approval => approval.status === status);
  }

  static filterByOrganization(approvals, organizationName) {
    if (!organizationName) return approvals;
    const searchTerm = organizationName.toLowerCase();
    return approvals.filter(approval => 
      approval.organization_name?.toLowerCase().includes(searchTerm)
    );
  }

  static filterBySearch(approvals, searchTerm) {
    if (!searchTerm) return approvals;
    const term = searchTerm.toLowerCase();
    
    return approvals.filter(approval => {
      const projectData = this.parseProjectData(approval.project_data);
      const projectName = projectData?.name || '';
      const projectDescription = projectData?.description || '';
      
      return projectName.toLowerCase().includes(term) ||
             projectDescription.toLowerCase().includes(term) ||
             approval.temporal_project_id.toLowerCase().includes(term);
    });
  }

  static getStats(approvals) {
    return {
      total: approvals.length,
      pending: approvals.filter(approval => approval.status === 'pending').length,
      approved: approvals.filter(approval => approval.status === 'approved').length,
      rejected: approvals.filter(approval => approval.status === 'rejected').length,
      under_review: approvals.filter(approval => approval.status === 'under_review').length
    };
  }

  static getProjectSummary(projectData) {
    const data = this.parseProjectData(projectData);
    if (!data) return null;

    return {
      name: data.name || 'Sin nombre',
      description: data.description || 'Sin descripción',
      location: data.location || 'No especificada',
      duration: this.formatDuration(data.duration),
      sensors: this.formatSensors(data.sensors),
      startDate: this.formatDate(data.startDate),
      userId: data.userId || null
    };
  }
}

export default ProjectApprovalService;