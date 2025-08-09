import { NODE_ENV } from './environment.js'
import process from 'process'

// Get CORS origins from environment variables
const getCorsOrigins = () => {
  const origins = []

  // Production/main origins
  if (process.env.CORS_ORIGIN) {
    origins.push(...process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()))
  }

  // Development origins (only in development)
  if (NODE_ENV === 'development' && process.env.CORS_ORIGIN_DEV) {
    origins.push(...process.env.CORS_ORIGIN_DEV.split(',').map(origin => origin.trim()))
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

  // Check if origin is allowed
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*')
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
}

export default getCorsOrigins