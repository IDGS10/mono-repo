import { NODE_ENV } from './environment.js'
import process from 'process'

// Get CORS origins from environment variables
const getCorsOrigins = () => {
  // Use ALLOWED_ORIGINS for consistency with other modules
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  }
  
  // Fallback to old environment variables or defaults
  const origins = []

  // Production/main origins
  if (process.env.CORS_ORIGIN) {
    origins.push(...process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()))
  }

  // Development origins (only in development)
  if (NODE_ENV === 'development' && process.env.CORS_ORIGIN_DEV) {
    origins.push(...process.env.CORS_ORIGIN_DEV.split(',').map(origin => origin.trim()))
  }

  // Default origins if no environment variables are set
  if (origins.length === 0) {
    origins.push(
      'http://localhost:5173',  // Vite dev server
      'http://127.0.0.1:5173',  // Alternative localhost
      'http://127.0.0.1:3000',
      'https://mono-repo-fawn.vercel.app',
      'https://server-uteq.nrsoftware.online'
    )
  }

  // Filter out empty values
  return origins.filter(Boolean)
}

// Configuration for shared middleware
export const getCorsConfig = () => ({
  corsOrigin: getCorsOrigins()
})

// Fallback CORS handler (if middleware doesn't have corsHandler)
export const getFallbackCorsHandler = () => (req, res, next) => {
  const allowedOrigins = getCorsOrigins()
  const origin = req.headers.origin

  // Debug logging for development
  if (NODE_ENV === 'development') {
    console.log(`🌐 Swarms - Request from origin: ${origin || 'No origin'}`)
    console.log(`🔄 Method: ${req.method}`)
    console.log(`📍 Path: ${req.path}`)
    console.log(`✅ Allowed origins:`, allowedOrigins)
  }

  // Check if origin is allowed (including wildcard matching)
  let isAllowed = false
  if (!origin) {
    isAllowed = true // Allow requests without origin (like Postman)
  } else if (allowedOrigins.includes(origin)) {
    isAllowed = true
  } else if (origin.includes('.vercel.app') || origin.includes('.nrsoftware.online')) {
    isAllowed = true // Allow wildcard domains
  }

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*')
    if (NODE_ENV === 'development') {
      console.log(`✅ Origin allowed: ${origin}`)
    }
  } else {
    if (NODE_ENV === 'development') {
      console.log(`❌ Origin rejected: ${origin}`)
    }
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    if (NODE_ENV === 'development') {
      console.log(`🔍 Swarms OPTIONS request handled for origin: ${origin}`)
    }
    res.sendStatus(200)
  } else {
    next()
  }
}

export default getCorsOrigins