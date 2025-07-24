import { NODE_ENV } from './environment.js'
import process from 'process'

const getCorsOptions = () => {
  // Get allowed origins from environment variable
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : []

  // In development, add common localhost origins to the allowed list
  if (NODE_ENV === 'development') {
    const developmentOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173', // Vite default
      'http://localhost:5174', // Vite alternative
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ]
    
    // Only add development origins that aren't already in the list
    developmentOrigins.forEach(origin => {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin)
      }
    })
  }

  return {
    origin: (origin, callback) => {
      // Allow requests without origin (e.g., mobile apps, Postman)
      if (!origin) return callback(null, true)

      // In development, allow any origin if no specific origins are configured
      if (NODE_ENV === 'development' && process.env.CORS_ORIGIN === undefined) {
        return callback(null, true)
      }

      // Check if the origin is in the allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      // Reject the origin
      callback(new Error(`Origin ${origin} not allowed by CORS policy`))
    },
    credentials: true, // Allow cookies and authentication headers
    optionsSuccessStatus: 200, // For compatibility with legacy browsers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'] // Headers that the client can read
  }
}

export default getCorsOptions