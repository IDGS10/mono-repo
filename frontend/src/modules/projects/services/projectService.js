// Base URLs from environment variables
const PROJECTS_API_URL = import.meta.env.VITE_PROJECTS_API_URL || 'http://localhost:3001'
const SWARMS_API_URL = import.meta.env.VITE_SWARMS_API_URL || 'http://localhost:3000'
const ORGANIZATIONS_API_URL = import.meta.env.VITE_ORGANIZATIONS_API_URL || 'http://localhost:3002'

// Configuration
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000
const RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'

// Get user token from localStorage
const getToken = () => {
  const tokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY || 'userToken'
  return localStorage.getItem(tokenKey)
}

// Get user ID - adjust this based on how you store user info
const getUserId = () => {
  const token = getToken()
  if (!token) return 'user-123' // Fallback for development
  
  try {
    // In a real app, you'd decode the JWT token to get user ID
    // For now, return a mock user ID
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.userId || payload.sub || 'user-123'
  } catch (error) {
    console.warn('Error parsing token, using fallback user ID')
    return 'user-123'
  }
}

// Get organization ID - you might want to get this from user context
const getOrgId = () => {
  // This should come from your user session/context
  // For now, return a default org ID
  return 1
}

// Get numeric user ID for database operations
const getNumericUserId = () => {
  // Convert string user ID to numeric if needed
  // This depends on how you handle user IDs in your system
  return 1 // Change this based on your user management
}

// Generic API call with retry logic
const apiCall = async (url, options = {}, retries = RETRY_ATTEMPTS) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() && { 'Authorization': `Bearer ${getToken()}` })
    },
    signal: controller.signal,
    ...options
  }

  try {
    const response = await fetch(url, defaultOptions)
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (retries > 0 && !error.name === 'AbortError') {
      console.warn(`API call failed, retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return apiCall(url, options, retries - 1)
    }
    
    throw error
  }
}

// Mock data for fallback (updated to match your DB schema)
const mockProjects = [
  {
    id_project: 1,
    id: 1, // For frontend compatibility
    name: 'Smart City Initiative',
    description: 'Urban monitoring and management',
    location: '40.7128,-74.0060',
    status: 'pending_approval',
    created_by: 'user-123',
    modified_by: 'user-123',
    owner_id: 1,
    id_org: 1,
    created_at: '2024-07-01T10:00:00Z',
    updated_at: '2024-07-01T10:00:00Z',
    createdAt: '2024-07-01T10:00:00Z', // Frontend compatibility
    updatedAt: '2024-07-01T10:00:00Z'
  },
  {
    id_project: 2,
    id: 2, // For frontend compatibility
    name: 'Agricultural Monitoring',
    description: 'Crop health and irrigation optimization',
    location: '34.0522,-118.2437',
    status: 'approved',
    created_by: 'user-123',
    modified_by: 'user-123',
    owner_id: 1,
    id_org: 1,
    created_at: '2024-07-15T14:30:00Z',
    updated_at: '2024-07-15T14:30:00Z',
    createdAt: '2024-07-15T14:30:00Z', // Frontend compatibility
    updatedAt: '2024-07-15T14:30:00Z'
  }
]

// Get all projects
export const getProjects = async () => {
  try {
    console.log('🔍 Fetching projects from API...')
    const ownerId = getNumericUserId()
    const orgId = getOrgId()
    
    const response = await apiCall(
      `${PROJECTS_API_URL}/projects?owner_id=${ownerId}&id_org=${orgId}`
    )
    
    if (response.success && response.data) {
      console.log('✅ Projects fetched successfully:', response.data.length)
      return response.data
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('❌ Error fetching projects from API:', error.message)
    
    if (ENABLE_MOCK_DATA) {
      console.warn('📝 Using mock data for projects')
      return mockProjects
    }
    
    throw new Error('Failed to fetch projects. Please check your connection and try again.')
  }
}

// Get a specific project
export const getProject = async (id) => {
  try {
    console.log(`🔍 Fetching project ${id} from API...`)
    const response = await apiCall(`${PROJECTS_API_URL}/projects/${id}`)
    
    if (response.success && response.data) {
      console.log('✅ Project fetched successfully')
      return response.data
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error(`❌ Error fetching project ${id}:`, error.message)
    
    if (ENABLE_MOCK_DATA) {
      console.warn('📝 Using mock data for project')
      const mockProject = mockProjects.find(p => p.id_project == id || p.id == id) || {
        id_project: parseInt(id),
        id: parseInt(id),
        name: 'Smart City Initiative',
        description: 'Urban monitoring and management',
        location: '40.7128,-74.0060',
        status: 'approved', // Changed to approved for testing swarm creation
        created_by: getUserId(),
        owner_id: getNumericUserId(),
        id_org: getOrgId(),
        created_at: '2024-07-01T10:00:00Z',
        createdAt: '2024-07-01T10:00:00Z'
      }
      return mockProject
    }
    
    throw new Error('Failed to fetch project details. Please try again.')
  }
}

// Create a new project
export const createProject = async (projectData) => {
  try {
    const projectPayload = {
      name: projectData.name,
      description: projectData.description,
      location: projectData.location,
      created_by: getUserId(),
      modified_by: getUserId(),
      owner_id: getNumericUserId(),
      id_org: getOrgId()
    }
    
    console.log('📤 Creating project:', projectPayload)
    
    // Try to send to projects API first
    try {
      const response = await apiCall(`${PROJECTS_API_URL}/projects`, {
        method: 'POST',
        body: JSON.stringify(projectPayload)
      })
      
      if (response.success) {
        console.log('✅ Project created via Projects API')
        return { success: true, project: response.data }
      }
    } catch (apiError) {
      console.warn('⚠️ Projects API failed, trying Organizations API...')
    }
    
    // Fallback to organizations API
    try {
      const response = await apiCall(`${ORGANIZATIONS_API_URL}/projects`, {
        method: 'POST',
        body: JSON.stringify(projectPayload)
      })
      
      console.log('✅ Project created via Organizations API')
      return { success: true, project: response }
    } catch (orgError) {
      console.error('❌ Both APIs failed:', orgError.message)
      
      if (ENABLE_MOCK_DATA) {
        console.warn('📝 Using mock success response')
        return {
          success: true,
          project: {
            ...projectPayload,
            id_project: Math.floor(Math.random() * 1000),
            id: Math.floor(Math.random() * 1000),
            status: 'pending_approval',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
      
      throw orgError
    }
  } catch (error) {
    console.error('💥 Error creating project:', error)
    throw new Error('Failed to create project. Please try again.')
  }
}

// Request a new swarm
export const requestSwarm = async (projectId, swarmData) => {
  try {
    const swarmPayload = {
      name: swarmData.swarmName,
      description: swarmData.description,
      maxDevices: parseInt(swarmData.deviceCount, 10),
      requesterId: getUserId(),
      projectId: projectId
    }
    
    console.log('📤 Creating swarm:', swarmPayload)
    
    const response = await apiCall(`${SWARMS_API_URL}/swarms`, {
      method: 'POST',
      body: JSON.stringify(swarmPayload)
    })
    
    console.log('✅ Swarm created successfully')
    return { success: true, swarmRequest: response }
  } catch (error) {
    console.error('❌ Error creating swarm:', error.message)
    
    if (ENABLE_MOCK_DATA) {
      console.warn('📝 Using mock success response for swarm')
      return {
        success: true,
        swarmRequest: {
          ...swarmData,
          id: `mock-swarm-${Date.now()}`,
          projectId,
          requesterId: getUserId(),
          status: 'requested',
          createdAt: new Date().toISOString()
        }
      }
    }
    
    throw new Error('Failed to create swarm. Please try again.')
  }
}

// Get project statistics
export const getProjectStats = async () => {
  try {
    console.log('📊 Fetching project statistics...')
    const ownerId = getNumericUserId()
    const orgId = getOrgId()
    
    const response = await apiCall(
      `${PROJECTS_API_URL}/projects/stats?owner_id=${ownerId}&id_org=${orgId}`
    )
    
    if (response.success && response.data) {
      return response.data
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('❌ Error fetching project stats:', error.message)
    
    if (ENABLE_MOCK_DATA) {
      return {
        total: 2,
        pending_approval: 1,
        approved: 1,
        rejected: 0,
        completed: 0
      }
    }
    
    throw error
  }
}

// Approve project (admin function)
export const approveProject = async (projectId) => {
  try {
    console.log(`📋 Approving project ${projectId}...`)
    const response = await apiCall(`${PROJECTS_API_URL}/projects/${projectId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({
        modified_by: getUserId()
      })
    })
    
    if (response.success) {
      console.log('✅ Project approved successfully')
      return response.data
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('❌ Error approving project:', error.message)
    throw new Error('Failed to approve project. Please try again.')
  }
}

// Test API connections
export const testConnections = async () => {
  const results = {
    projects: false,
    swarms: false,
    organizations: false
  }
  
  try {
    console.log('🔍 Testing API connections...')
    
    // Test Projects API
    try {
      await apiCall(`${PROJECTS_API_URL}/health`)
      results.projects = true
      console.log('✅ Projects API: Connected')
    } catch (error) {
      console.log('❌ Projects API: Failed')
    }
    
    // Test Swarms API
    try {
      await apiCall(`${SWARMS_API_URL}/health`)
      results.swarms = true
      console.log('✅ Swarms API: Connected')
    } catch (error) {
      console.log('❌ Swarms API: Failed')
    }
    
    // Test Organizations API
    try {
      await apiCall(`${ORGANIZATIONS_API_URL}/health`)
      results.organizations = true
      console.log('✅ Organizations API: Connected')
    } catch (error) {
      console.log('❌ Organizations API: Failed')
    }
    
    return results
  } catch (error) {
    console.error('💥 Connection test failed:', error)
    return results
  }
}