// TEMPORAL - Para desarrollo en monorepo (HASTA que funcione el .env)
import { API} from '../config.js'

const PROJECTS_API_URL = API.PROJECTS_API_URL
const SWARMS_API_URL = API.SWARMS_API_URL
const DEVICES_API_URL = API.DEVICES_API_URL

console.log('🔧 HARDCODED URLs - PROJECTS_API_URL:', PROJECTS_API_URL)
console.log('🔧 HARDCODED URLs - SWARMS_API_URL:', SWARMS_API_URL)
console.log('🔧 HARDCODED URLs - DEVICES_API_URL:', DEVICES_API_URL)

// Configuration
const API_CONFIG = {
  timeout: 30000,
  retryAttempts: 3
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
      role: payload.rol || payload.role // Soportar ambos campos
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
        throw new Error('Access denied. Please login again.')
      }

      if (response.status === 403) {
        console.log('❌ JWT Authorization failed - forbidden')
        throw new Error('Access denied. Insufficient permissions.')
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message)
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

// Transform project data to ensure compatibility
const transformProject = (project) => {
  if (!project) return null
  
  return {
    ...project,
    // Asegurar que tanto id como id_project estén disponibles
    id: project.id_project || project.id,
    id_project: project.id_project || project.id,
    // Transformar fechas si es necesario
    createdAt: project.created_at || project.createdAt,
    updatedAt: project.updated_at || project.updatedAt
  }
}

// Get projects with pagination
export const getProjects = async (filters = {}) => {
  try {
    console.log('🔍 Fetching projects from Projects API...')
    
    const user = getUserFromToken()
    const params = new URLSearchParams({
      page: 1,
      limit: 20, // Aumentar límite para obtener más proyectos
      ...(user?.userId && { owner_id: user.userId }),
      id_org: 1, // Esto puede ser dinámico según tu necesidad
      ...filters
    })

    const response = await apiCall(`${PROJECTS_API_URL}/projects?${params}`)
    
    // CORRECCIÓN: Adaptar estructura de respuesta del backend
    console.log('✅ Raw API Response:', response)

    let projects = []
    let pagination = null

    if (response.success && response.data) {
      // El backend retorna { success: true, data: { projects: [...], pagination: {...} } }
      projects = response.data.projects || []
      pagination = response.data.pagination || null
    } else if (response.data && Array.isArray(response.data)) {
      // Fallback si viene directamente como array
      projects = response.data
    } else if (Array.isArray(response)) {
      // Otro posible formato
      projects = response
    }

    // Transformar proyectos para compatibilidad
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
    throw new Error('Failed to fetch projects. Please check your connection and try again.')
  }
}

// Get single project by ID
export const getProject = async (id) => {
  try {
    console.log(`🔍 Fetching project ${id}...`)
    const response = await apiCall(`${PROJECTS_API_URL}/projects/${id}`)
    
    console.log('✅ Raw project response:', response)

    let project = null
    if (response.success && response.data) {
      project = response.data
    } else if (response.data) {
      project = response.data
    } else {
      project = response
    }

    const transformedProject = transformProject(project)
    console.log(`✅ Project ${id} processed:`, transformedProject)
    
    return transformedProject
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
    if (!user) {
      throw new Error('User not authenticated. Please login again.')
    }

    const payload = {
      name: projectData.name,
      description: projectData.description || '',
      location: projectData.location || '',
      created_by: user.userId,
      owner_id: user.userId,
      id_org: 1, // Esto puede ser dinámico
      status: 'pending_approval'
    }

    console.log('🔐 Create project payload:', payload)

    const response = await apiCall(`${PROJECTS_API_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    console.log('✅ Raw create response:', response)

    let createdProject = null
    if (response.success && response.data) {
      createdProject = response.data
    } else {
      createdProject = response
    }

    const transformedProject = transformProject(createdProject)
    console.log('✅ Project created successfully:', transformedProject?.id_project)
    
    return {
      success: true,
      data: transformedProject
    }
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
    
    let updatedProject = null
    if (response.success && response.data) {
      updatedProject = response.data
    } else {
      updatedProject = response
    }

    const transformedProject = transformProject(updatedProject)
    console.log(`✅ Project ${id} updated successfully`)
    
    return transformedProject
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
    
    let deletedProject = null
    if (response.success && response.data) {
      deletedProject = response.data
    } else {
      deletedProject = response
    }

    console.log(`✅ Project ${id} deleted successfully`)
    return transformProject(deletedProject)
  } catch (error) {
    console.error(`❌ Error deleting project ${id}:`, error.message)
    throw new Error('Failed to delete project. Please try again.')
  }
}

// ========== SWARM FUNCTIONS ==========

// Request swarm for project (integración con Swarms API)
export const requestSwarm = async (projectId, swarmData) => {
  try {
    console.log(`🔍 Requesting swarm for project ${projectId}...`)
    
    const user = getUserFromToken()
    if (!user) {
      throw new Error('User not authenticated. Please login again.')
    }

    // CORRECCIÓN: Mapear campos del frontend al formato esperado por Swarms API
    const payload = {
      name: swarmData.swarmName, // Frontend envía 'swarmName'
      description: swarmData.description || '',
      maxDevices: parseInt(swarmData.deviceCount) || 10, // Frontend envía 'deviceCount'
      requesterId: user.userId,
      projectId: parseInt(projectId),
      status: 'requested'
    }

    console.log('🔐 Swarm request payload:', payload)

    const response = await apiCall(`${SWARMS_API_URL}/swarms`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true)
    
    console.log(`✅ Swarm requested successfully:`, response)
    
    return {
      success: true,
      data: response.data || response
    }
  } catch (error) {
    console.error(`❌ Error requesting swarm for project ${projectId}:`, error.message)
    throw new Error('Failed to request swarm. Please try again.')
  }
}

// Get swarms for a specific project
export const getProjectSwarms = async (projectId) => {
  try {
    console.log(`🔍 Fetching swarms for project ${projectId}...`)
    
    // OPCIÓN 1: Si tu API de Swarms soporta filtrar por projectId
    const response = await apiCall(`${SWARMS_API_URL}/swarms?projectId=${projectId}`, {}, true)
    
    let swarms = []
    if (response.success && response.data) {
      swarms = response.data.swarms || response.data || []
    } else if (Array.isArray(response)) {
      swarms = response
    }

    console.log(`✅ Project swarms fetched:`, swarms.length)
    return swarms
    
  } catch (error) {
    console.error(`❌ Error fetching swarms for project ${projectId}:`, error.message)
    
    // FALLBACK: Retornar array vacío en lugar de fallar
    console.log('📝 Returning empty swarms array as fallback')
    return []
  }
}

// Get all swarms
export const getSwarms = async () => {
  try {
    console.log('🔍 Fetching swarms from Swarms API...')
    const response = await apiCall(`${SWARMS_API_URL}/swarms`, {}, true)
    
    let swarms = []
    if (response.success && response.data) {
      swarms = response.data.swarms || response.data || []
    } else if (Array.isArray(response)) {
      swarms = response
    }

    console.log('✅ Swarms fetched successfully:', swarms.length)
    return swarms
  } catch (error) {
    console.error('❌ Error fetching swarms:', error.message)
    return [] // Fallback
  }
}

export const requestSwarmSimple = async (projectId, swarmData) => {
  try {
    console.log(`🔍 Requesting swarm for project ${projectId}...`)
    
    const user = getUserFromToken()
    if (!user) {
      throw new Error('User not authenticated. Please login again.')
    }

    const payload = {
      swarmName: swarmData.swarmName,
      description: swarmData.description || '',
      deviceCount: parseInt(swarmData.deviceCount) || 10,
      location: swarmData.location || '',
      autoSelectDevices: swarmData.autoSelectDevices || false
    }

    console.log('🔐 Swarm request payload:', payload)

    const response = await apiCall(`${PROJECTS_API_URL}/projects/${projectId}/request-swarm`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    console.log(`✅ Swarm requested successfully:`, response)
    
    return {
      success: true,
      data: response.data || response
    }
  } catch (error) {
    console.error(`❌ Error requesting swarm:`, error.message)
    throw new Error('Failed to request swarm. Please try again.')
  }
}

export const getProjectSwarmsSimple = async (projectId) => {
  try {
    console.log(`🔍 Fetching swarms for project ${projectId}...`)
    const response = await apiCall(`${PROJECTS_API_URL}/projects/${projectId}/swarms`)
    
    let swarms = []
    if (response.success && response.data) {
      swarms = response.data.swarms || []
    }

    console.log(`✅ Project swarms fetched:`, swarms.length)
    return swarms
    
  } catch (error) {
    console.error(`❌ Error fetching swarms for project ${projectId}:`, error.message)
    return [] // Fallback to empty array
  }
}

export const getAvailableDevicesInfo = async () => {
  try {
    console.log('🔍 Fetching available devices info...')
    const response = await apiCall(`${PROJECTS_API_URL}/projects/devices/available`)
    
    let devices = []
    let summary = {}
    if (response.success && response.data) {
      devices = response.data.devices || []
      summary = response.data.summary || {}
    }

    console.log('✅ Available devices info fetched:', devices.length)
    return { devices, summary }
    
  } catch (error) {
    console.error('❌ Error fetching devices info:', error.message)
    return { devices: [], summary: {} }
  }
}


export const getProjectStats = async () => {
  try {
    console.log('🔍 Fetching project statistics...')
    const user = getUserFromToken()
    const params = new URLSearchParams({
      ...(user?.userId && { owner_id: user.userId }),
      id_org: 1
    })

    const response = await apiCall(`${PROJECTS_API_URL}/projects/stats?${params}`)
    
    let stats = {}
    if (response.success && response.data) {
      stats = response.data
    } else {
      stats = response
    }

    console.log('✅ Project statistics fetched successfully')
    return stats
  } catch (error) {
    console.error('❌ Error fetching project statistics:', error.message)
    throw new Error('Failed to fetch project statistics. Please try again.')
  }
}

export const searchProjects = async (searchParams) => {
  try {
    console.log('🔍 Searching projects...')
    const params = new URLSearchParams({
      page: 1,
      limit: 20,
      ...searchParams
    })

    const response = await apiCall(`${PROJECTS_API_URL}/projects/search?${params}`)
    
    let projects = []
    let pagination = null

    if (response.success && response.data) {
      projects = response.data.projects || response.data || []
      pagination = response.data.pagination
    } else if (Array.isArray(response)) {
      projects = response
    }

    const transformedProjects = projects.map(transformProject)

    console.log('✅ Project search completed:', transformedProjects.length, 'results')
    return {
      projects: transformedProjects,
      pagination: pagination,
      count: transformedProjects.length
    }
  } catch (error) {
    console.error('❌ Error searching projects:', error.message)
    throw new Error('Failed to search projects. Please try again.')
  }
}