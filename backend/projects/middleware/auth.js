import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// JWT Authentication Middleware - POLÍTICA DE SEGURIDAD OBLIGATORIA
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.header('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'JWT token required - Access denied',
      error: 'AUTHENTICATION_REQUIRED'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    console.log('✅ JWT validated for user:', decoded.userId || decoded.sub)
    next()
  } catch (error) {
    console.error('❌ JWT validation failed:', error.message)
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'JWT token expired',
        error: 'TOKEN_EXPIRED'
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid JWT token',
        error: 'INVALID_TOKEN'
      })
    }
    
    return res.status(403).json({
      success: false,
      message: 'JWT token verification failed',
      error: 'TOKEN_VERIFICATION_FAILED'
    })
  }
}
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const userRole = req.user.role
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: roles,
        current: userRole
      })
    }

    next()
  }
}
export const generateTestJWT = (payload = {}) => {
  const defaultPayload = {
    userId: payload.userId || 1,
    username: payload.username || 'testuser',
    role: payload.role || 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }

  return jwt.sign(defaultPayload, process.env.JWT_SECRET)
}

export default { authenticateJWT, requireRole, generateTestJWT }