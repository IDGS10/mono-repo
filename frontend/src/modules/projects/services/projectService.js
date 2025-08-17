// TEMPORAL - Para desarrollo en monorepo (HASTA que funcione el .env)
import { API} from '../config.js'

const PROJECTS_API_URL = API.PROJECTS_API_URL
const SWARMS_API_URL = API.SWARMS_API_URL

// Comentar estas líneas temporalmente:
// const PROJECTS_API_URL = import.meta.env.VITE_PROJECTS_API_URL 
// const SWARMS_API_URL = import.meta.env.VITE_SWARMS_API_URL 
// const ORGANIZATIONS_API_URL = import.meta.env.VITE_ORGANIZATIONS_API_URL 

console.log('🔧 HARDCODED URLs - PROJECTS_API_URL:', PROJECTS_API_URL)
console.log('🔧 HARDCODED URLs - SWARMS_API_URL:', SWARMS_API_URL)

// Configuration
const API_CONFIG = {
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3
}

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('userToken')

// Get user info from JWT token
const getUserFromToken = () => {
  try {
    const token = getToken()
    if (!token) return null
    
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role
    }
  } catch (error) {
    console.error('Error parsing JWT token:', error)
    return null
  }
}

// Generic API call function with retry logic
const apiCall = async (url, options = {}, useSwarmAPI = false) => {
  const token = getToken()
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
  
  const config = {
    method: 'GET',
    headers: defaultHeaders,
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }

  console.log(`🔍 Fetching from ${useSwarmAPI ? 'Swarms' : 'Projects'} API...`)
  console.log(`🔐 API Call: ${config.method} ${url}`)
  if (token) console.log(`🔒 JWT included for ${useSwarmAPI ? 'Swarms' : 'Projects'} API`)

  let lastError

  for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log(`📡 Response: ${response.status} ${response.statusText}`)

      if (response.status === 401) {
        console.log('❌ JWT Authorization failed - insufficient permissions')
        throw new Error('Access denied. Insufficient permissions.')
      }

      if (response.status === 403) {
        console.log('❌ JWT Authorization failed - forbidden')
        throw new Error('Access denied. Insufficient permissions.')
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error(`API call failed, retrying... (${API_CONFIG.retryAttempts - attempt + 1} attempts left)`)
      lastError = error
      
      if (attempt < API_CONFIG.retryAttempts) {
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// ========== PROJECT FUNCTIONS ==========

// Get projects with pagination
export const getProjects = async (filters = {}) => {
  try {
    console.log('🔍 Fetching projects from Projects API...')
    
    const params = new URLSearchParams({
      page: 1,
      limit: 10,
      owner_id: getUserFromToken()?.userId || 1,
      id_org: 1,
      ...filters
    })

    const response = await apiCall(`${PROJECTS_API_URL}/projects?${params}`)
    
    console.log('✅ Projects fetched successfully:', response.data?.length || response.count || 0)
    console.log('📊 Pagination:', response.pagination)

    return {
      projects: response.data || [],
      pagination: response.pagination,
      count: response.count || 0
    }
  } catch (error) {
    console.error('❌ Error fetching projects:', error.message)
    throw new Error('Failed to fetch projects. Please check your connection and try again.')
  }
}

// Get single project by ID
export const getProject = async (id) => {
  try {
    console.log(`🔍 Fetching project ${id}...`)
    const response = await apiCall(`${PROJECTS_API_URL}/projects/${id}`)
    
    console.log(`✅ Project ${id} fetched successfully`)
    return response.data
  } catch (error) {
    console.error(`❌ Error fetching project ${id}:`, error.message)
    throw new Error('Failed to fetch project details. Please try again.')
  }
}

// Create new project
export const createProject = async (projectData) => {
  try {
    console.log('🔍 Creating new project...')
    
    const user = getUserFromToken()
    const payload = {
      ...projectData,
      created_by: user?.userId || 1,
      owner_id: user?.userId || 1,
      id_org: projectData.id_org || 1,
      status: 'pending_approval'
    }

    const response = await apiCall(`${PROJECTS_API_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    console.log('✅ Project created successfully:', response.data?.id_project)
    return response.data
  } catch (error) {
    console.error('❌ Error creating project:', error.message)
    throw new Error('Failed to create project. Please try again.')
  }
}

// Update project
export const updateProject = async (id, updates) => {
  try {
    console.log(`🔍 Updating project ${id}...`)
    
    const user = getUserFromToken()
    const payload = {
      ...updates,
      modified_by: user?.userId || 1
    }

    const response = await apiCall(`${PROJECTS_API_URL}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    
    console.log(`✅ Project ${id} updated successfully`)
    return response.data
  } catch (error) {
    console.error(`❌ Error updating project ${id}:`, error.message)
    throw new Error('Failed to update project. Please try again.')
  }
}

// Delete project
export const deleteProject = async (id) => {
  try {
    console.log(`🔍 Deleting project ${id}...`)
    const response = await apiCall(`${PROJECTS_API_URL}/projects/${id}`, {
      method: 'DELETE'
    })
    
    console.log(`✅ Project ${id} deleted successfully`)
    return response.data
  } catch (error) {
    console.error(`❌ Error deleting project ${id}:`, error.message)
    throw new Error('Failed to delete project. Please try again.')
  }
}

// ========== SWARM FUNCTIONS ==========
// En tu projectService.js, agregar al final:

// Función requestSwarm (alias para createSwarm)
export const requestSwarm = async (projectId, swarmData) => {
  try {
    console.log(`🔍 Requesting swarm for project ${projectId}...`)
    
    const user = getUserFromToken()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const payload = {
      name: swarmData.name,
      description: swarmData.description,
      maxDevices: parseInt(swarmData.maxDevices) || 100,
      requesterId: user.userId, // ID del usuario JWT
      projectId: parseInt(projectId) // ID del proyecto
    }

    console.log('🔐 Swarm request payload:', payload)

    const response = await apiCall(`${SWARMS_API_URL}/swarms`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true)
    
    console.log(`✅ Swarm requested successfully for project ${projectId}:`, response.data?.id)
    return response.data
  } catch (error) {
    console.error(`❌ Error requesting swarm for project ${projectId}:`, error.message)
    throw new Error('Failed to request swarm. Please try again.')
  }
}
// Get all swarms
export const getSwarms = async () => {
  try {
    console.log('🔍 Fetching swarms from Swarms API...')
    const response = await apiCall(`${SWARMS_API_URL}/swarms`, {}, true)
    
    console.log('✅ Swarms fetched successfully:', response.data?.swarms?.length || 0)
    return response.data?.swarms || []
  } catch (error) {
    console.error('❌ Error fetching swarms:', error.message)
    throw new Error('Failed to fetch swarms. Please check your connection and try again.')
  }
}

// Get swarms for a specific project
export const getProjectSwarms = async (projectId) => {
  try {
    console.log(`🔍 Fetching swarms for project ${projectId}...`)
    const response = await apiCall(`${SWARMS_API_URL}/swarms?projectId=${projectId}`, {}, true)
    
    console.log(`✅ Project swarms fetched successfully for project ${projectId}:`, response.data?.swarms?.length || 0)
    return response.data?.swarms || []
  } catch (error) {
    console.error(`❌ Error fetching swarms for project ${projectId}:`, error.message)
    throw new Error('Failed to fetch project swarms. Please try again.')
  }
}

// Create new swarm for a project
export const createSwarm = async (projectId, swarmData) => {
  try {
    console.log(`🔍 Creating swarm for project ${projectId}...`)
    
    const user = getUserFromToken()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const payload = {
      name: swarmData.name,
      description: swarmData.description,
      maxDevices: parseInt(swarmData.maxDevices) || 100,
      requesterId: user.userId, // ID del usuario JWT
      projectId: parseInt(projectId), // ID del proyecto
      status: 'requested'
    }

    console.log('🔐 Swarm payload:', payload)

    const response = await apiCall(`${SWARMS_API_URL}/swarms`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true)
    
    console.log(`✅ Swarm created successfully for project ${projectId}:`, response.data?.id)
    return response.data
  } catch (error) {
    console.error(`❌ Error creating swarm for project ${projectId}:`, error.message)
    throw new Error('Failed to create swarm. Please try again.')
  }
}

// Update swarm
export const updateSwarm = async (swarmId, updates) => {
  try {
    console.log(`🔍 Updating swarm ${swarmId}...`)
    
    const response = await apiCall(`${SWARMS_API_URL}/swarms/${swarmId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, true)
    
    console.log(`✅ Swarm ${swarmId} updated successfully`)
    return response.data
  } catch (error) {
    console.error(`❌ Error updating swarm ${swarmId}:`, error.message)
    throw new Error('Failed to update swarm. Please try again.')
  }
}

// Delete swarm
export const deleteSwarm = async (swarmId) => {
  try {
    console.log(`🔍 Deleting swarm ${swarmId}...`)
    
    const response = await apiCall(`${SWARMS_API_URL}/swarms/${swarmId}`, {
      method: 'DELETE'
    }, true)
    
    console.log(`✅ Swarm ${swarmId} deleted successfully`)
    return response.data
  } catch (error) {
    console.error(`❌ Error deleting swarm ${swarmId}:`, error.message)
    throw new Error('Failed to delete swarm. Please try again.')
  }
}

// ========== UTILITY FUNCTIONS ==========

// Get project statistics
export const getProjectStats = async () => {
  try {
    console.log('🔍 Fetching project statistics...')
    const user = getUserFromToken()
    const params = new URLSearchParams({
      owner_id: user?.userId || 1,
      id_org: 1
    })

    const response = await apiCall(`${PROJECTS_API_URL}/projects/stats?${params}`)
    
    console.log('✅ Project statistics fetched successfully')
    return response.data
  } catch (error) {
    console.error('❌ Error fetching project statistics:', error.message)
    throw new Error('Failed to fetch project statistics. Please try again.')
  }
}

// Search projects
export const searchProjects = async (searchParams) => {
  try {
    console.log('🔍 Searching projects...')
    const params = new URLSearchParams({
      page: 1,
      limit: 10,
      ...searchParams
    })

    const response = await apiCall(`${PROJECTS_API_URL}/projects/search?${params}`)
    
    console.log('✅ Project search completed:', response.data?.length || 0, 'results')
    return {
      projects: response.data || [],
      pagination: response.pagination,
      count: response.count || 0
    }
  } catch (error) {
    console.error('❌ Error searching projects:', error.message)
    throw new Error('Failed to search projects. Please try again.')
  }
}