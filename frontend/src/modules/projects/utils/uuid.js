// utils/uuid.js - UUID generator for compatibility with Swarms API

// Generate a valid UUID v4
export const generateUUID = () => {
  // Simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Generate project-specific UUID (deterministic based on project ID)
export const generateProjectUUID = (projectId) => {
  // Create a consistent UUID for a project
  const seed = `project-${projectId}-${Date.now()}`
  let hash = 0
  
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert hash to UUID format
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,3)}${hex.slice(0,1)}-a${hex.slice(0,3)}-${hex.slice(0,12).padEnd(12, '0')}`
}

// Validate UUID format
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Default UUIDs for development
export const DEFAULT_UUIDS = {
  user: '550e8400-e29b-41d4-a716-446655440000',
  admin: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  system: '6ba7b814-9dad-11d1-80b4-00c04fd430c8'
}