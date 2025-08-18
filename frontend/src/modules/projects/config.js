
export const API = {
  PROJECTS_API_URL: 'http://localhost:3001',
  SWARMS_API_URL: 'http://74.208.137.35:5052',
  ORGANIZATIONS_API_URL: 'http://localhost:3002',
  DEVICES_API_URL: 'http://74.208.137.35:5057'  
}

export const CONFIG = {
  API_TIMEOUT: 30000,
  API_RETRY_ATTEMPTS: 3,
  JWT_STORAGE_KEY: 'userToken',
  

  ENDPOINTS: {
    // Projects API
    PROJECTS: '/projects',
    PROJECT_BY_ID: '/projects',
    PROJECT_SWARMS: '/projects',
    PROJECT_REQUEST_SWARM: '/request-swarm',
    AVAILABLE_DEVICES: '/projects/devices/available',
    
    // Swarms/Devices API  
    DEVICES: '/api/devices',
    SWARMS: '/api/swarms',
    SWARM_DEVICES: '/devices'
  }
}

// Environment detection
export const ENV = {
  isDevelopment: window.location.hostname === 'localhost',
  isProduction: window.location.hostname !== 'localhost'
}

// Debug mode
export const DEBUG = ENV.isDevelopment

// Export default
export default {
  API,
  CONFIG,
  ENV,
  DEBUG
}