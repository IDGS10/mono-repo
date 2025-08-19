// Using axios instances with interceptors
import { ProjectsApi, OrganizationsApi, SwarmsApi, DeviceManagerApi } from '../../../Api.jsx'

console.log('🔧 Using configured API instances with interceptors')

// Configuration
const API_CONFIG = {
  timeout: 30000,
  retryAttempts: 3
}

// Get user info from JWT token (for localStorage compatibility)
const getUserFromToken = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("monoRepoUserData"));
    if (!userData || !userData.token) return null;
    
    const payload = JSON.parse(atob(userData.token.split('.')[1]));
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.rol || payload.role // Soportar ambos campos
    };
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

// Generic API call function using axios instances with retry logic
const apiCall = async (apiInstance, endpoint, options = {}) => {
  const config = {
    method: 'GET',
    ...options
  };

  console.log(`🔍 API Call: ${config.method} ${endpoint}`);
  console.log(`🔐 Using axios instance with interceptors`);

  let lastError;

  for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
    try {
      const response = await apiInstance.request({
        url: endpoint,
        ...config,
        timeout: API_CONFIG.timeout
      });
      
      console.log(`📡 Response: ${response.status} ${response.statusText}`);
      return response.data;

    } catch (error) {
      lastError = error;
      console.log(`❌ Attempt ${attempt} failed:`, error.response?.status || error.message);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('❌ Authorization failed - stopping retries');
        throw new Error('Access denied. Please login again.');
      }

      if (attempt === API_CONFIG.retryAttempts) {
        console.log(`❌ All ${API_CONFIG.retryAttempts} attempts failed`);
        break;
      }

      const delay = 1000 * attempt;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const errorMsg = lastError?.response?.data?.message || lastError?.message || 'Network error';
  const errorCode = lastError?.response?.status || 'NETWORK_ERROR';
  throw new Error(`HTTP ${errorCode}: ${JSON.stringify(lastError?.response?.data || errorMsg)}`);
}

// Transform project data from backend to frontend format
const transformProject = (project) => {
  return {
    id: project.projectId || project.id,
    name: project.projectName || project.name,
    description: project.description,
    status: project.status,
    ownerId: project.ownerId || project.owner_id,
    ownerName: project.ownerName || project.owner_name,
    organizationId: project.organizationId || project.organization_id,
    organizationName: project.organizationName || project.organization_name,
    createdAt: project.createdAt || project.created_at,
    updatedAt: project.updatedAt || project.updated_at,
    maxSwarms: project.maxSwarms || project.max_swarms || 5,
    currentSwarms: project.currentSwarms || project.current_swarms || 0,
    isActive: project.isActive || project.is_active || false
  };
};

// ========================
// EXPORTED FUNCTIONS
// ========================

// Get projects with pagination
export const getProjects = async (filters = {}) => {
  try {
    console.log('🔍 Fetching projects from Projects API...')
    
    const user = getUserFromToken()
    const params = new URLSearchParams({
      page: 1,
      limit: 20,
      ...(user?.userId && { owner_id: user.userId }),
      id_org: 1, // Esto puede ser dinámico según tu necesidad
      ...filters
    })

    const response = await apiCall(ProjectsApi, `/projects?${params}`)
    
    console.log('✅ Raw API Response:', response)

    let projects = []
    let pagination = null

    if (response.success && response.data) {
      projects = response.data.projects || []
      pagination = response.data.pagination || null
    } else if (response.data && Array.isArray(response.data)) {
      projects = response.data
    } else if (Array.isArray(response)) {
      projects = response
    }

    const transformedProjects = projects.map(transformProject)

    console.log('✅ Projects processed:', transformedProjects.length)
    console.log('📊 Pagination:', pagination)

    return {
      projects: transformedProjects,
      pagination: pagination,
      count: transformedProjects.length
    }
  } catch (error) {
    console.error('❌ Error fetching projects:', error.message)
    throw error
  }
}

// Get single project by ID
export const getProject = async (id) => {
  try {
    console.log(`🔍 Fetching project ${id}...`)
    const response = await apiCall(ProjectsApi, `/projects/${id}`)
    
    console.log('✅ Raw project response:', response)

    let project = null
    if (response.success && response.data) {
      project = response.data
    } else if (response.data) {
      project = response.data
    } else {
      project = response
    }

    return transformProject(project)
  } catch (error) {
    console.error(`❌ Error fetching project ${id}:`, error.message)
    throw error
  }
}

// Create new project
export const createProject = async (projectData) => {
  try {
    console.log('🔍 Creating new project...')
    
    const user = getUserFromToken()
    const payload = {
      ...projectData,
      owner_id: user?.userId || projectData.owner_id,
      status: 'pending_approval'
    }

    console.log('🔐 Create project payload:', payload)

    const response = await apiCall(ProjectsApi, '/projects', {
      method: 'POST',
      data: payload
    })
    
    console.log('✅ Raw create response:', response)

    let project = null
    if (response.success && response.data) {
      project = response.data
    } else if (response.data) {
      project = response.data
    } else {
      project = response
    }

    return transformProject(project)
  } catch (error) {
    console.error('❌ Error creating project:', error.message)
    throw error
  }
}

// Update project
export const updateProject = async (id, projectData) => {
  try {
    console.log(`🔍 Updating project ${id}...`)

    const response = await apiCall(ProjectsApi, `/projects/${id}`, {
      method: 'PUT',
      data: projectData
    })
    
    console.log('✅ Raw update response:', response)

    let project = null
    if (response.success && response.data) {
      project = response.data
    } else if (response.data) {
      project = response.data
    } else {
      project = response
    }

    return transformProject(project)
  } catch (error) {
    console.error(`❌ Error updating project ${id}:`, error.message)
    throw error
  }
}

// Delete project
export const deleteProject = async (id) => {
  try {
    console.log(`🔍 Deleting project ${id}...`)
    
    const response = await apiCall(ProjectsApi, `/projects/${id}`, {
      method: 'DELETE'
    })
    
    console.log('✅ Project deleted successfully')
    return response
  } catch (error) {
    console.error(`❌ Error deleting project ${id}:`, error.message)
    throw error
  }
}

// Get project swarms
export const getProjectSwarms = async (projectId) => {
  try {
    console.log(`🔍 Fetching swarms for project ${projectId}...`)
    
    const response = await apiCall(SwarmsApi, `/swarms?projectId=${projectId}`)
    
    let swarms = []
    if (response.success && response.data) {
      swarms = response.data.swarms || response.data || []
    } else if (Array.isArray(response)) {
      swarms = response
    } else if (response.data) {
      swarms = response.data
    }

    console.log('✅ Project swarms fetched:', swarms.length)
    return swarms
  } catch (error) {
    console.error(`❌ Error fetching project swarms:`, error.message)
    throw error
  }
}

// Request swarm for project
export const requestSwarm = async (projectId, swarmData) => {
  try {
    console.log(`🔍 Requesting swarm for project ${projectId}...`)
    
    const response = await apiCall(ProjectsApi, `/projects/${projectId}/request-swarm`, {
      method: 'POST',
      data: swarmData
    })
    
    console.log('✅ Swarm request sent successfully')
    return response
  } catch (error) {
    console.error(`❌ Error requesting swarm:`, error.message)
    throw error
  }
}

// Get available devices
export const getAvailableDevices = async () => {
  try {
    console.log('🔍 Fetching available devices...')
    
    const response = await apiCall(ProjectsApi, '/projects/devices/available')
    
    let devices = []
    if (response.success && response.data) {
      devices = response.data.devices || response.data || []
    } else if (Array.isArray(response)) {
      devices = response
    }

    console.log('✅ Available devices fetched:', devices.length)
    return devices
  } catch (error) {
    console.error('❌ Error fetching available devices:', error.message)
    throw error
  }
}

// Get project stats
export const getProjectStats = async () => {
  try {
    console.log('🔍 Fetching project stats...')
    
    const user = getUserFromToken()
    const params = new URLSearchParams({
      ...(user?.userId && { owner_id: user.userId })
    })

    const response = await apiCall(ProjectsApi, `/projects/stats?${params}`)
    
    console.log('✅ Project stats fetched')
    return response.data || response
  } catch (error) {
    console.error('❌ Error fetching project stats:', error.message)
    throw error
  }
}

// Search projects
export const searchProjects = async (query, filters = {}) => {
  try {
    console.log(`🔍 Searching projects: "${query}"...`)
    
    const params = new URLSearchParams({
      q: query,
      ...filters
    })

    const response = await apiCall(ProjectsApi, `/projects/search?${params}`)
    
    let projects = []
    if (response.success && response.data) {
      projects = response.data.projects || response.data || []
    } else if (Array.isArray(response)) {
      projects = response
    }

    const transformedProjects = projects.map(transformProject)
    
    console.log('✅ Search results:', transformedProjects.length)
    return transformedProjects
  } catch (error) {
    console.error('❌ Error searching projects:', error.message)
    throw error
  }
}

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectSwarms,
  requestSwarm,
  getAvailableDevices,
  getProjectStats,
  searchProjects
}
