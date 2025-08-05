const jwt = require("jsonwebtoken");

/**
 * Configuration object for authentication middleware
 */
class AuthConfig {
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    this.sessionTimeout = options.sessionTimeout || process.env.SESSION_TIMEOUT || "24h";
    this.databasePool = options.databasePool || null;
    this.serviceName = options.serviceName || 'unknown-service';
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is required for authentication middleware');
    }
  }
}

/**
 * Enhanced JWT authentication middleware factory
 * @param {Object} config - Configuration object
 * @param {Array} allowedTypes - Tipos de usuario permitidos (opcional)
 * @returns {Function} - Middleware de Express
 */
const authenticateToken = (config, allowedTypes = []) => {
  const authConfig = new AuthConfig(config);
  
  return async (req, res, next) => {
    try {
      const token = extractTokenFromHeader(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token de acceso requerido",
          code: "TOKEN_REQUIRED",
          timestamp: new Date().toISOString(),
          service: authConfig.serviceName
        });
      }

      // Verificar JWT
      let decoded;
      try {
        decoded = jwt.verify(token, authConfig.jwtSecret);
      } catch (jwtError) {
        return handleJWTError(res, jwtError, authConfig.serviceName);
      }

      // Check if user is active (if DB pool is provided)
      if (authConfig.databasePool && decoded.userId) {
        const isActive = await checkUserActive(decoded.userId, authConfig.databasePool);
        if (!isActive) {
          return res.status(401).json({
            success: false,
            message: "Usuario inactivo",
            code: "USER_INACTIVE",
            timestamp: new Date().toISOString(),
            service: authConfig.serviceName
          });
        }

        // Update last activity
        await updateLastActivity(decoded.userId, authConfig.databasePool);
      }

      // Verificar permisos si se especifican tipos permitidos
      if (allowedTypes.length > 0 && authConfig.databasePool) {
        const hasPermission = await checkUserPermissions(decoded.userId, allowedTypes, authConfig.databasePool);
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: "Acceso denegado - Permisos insuficientes",
            code: "INSUFFICIENT_PERMISSIONS",
            timestamp: new Date().toISOString(),
            service: authConfig.serviceName
          });
        }
      }

      // Add user information to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        sessionId: decoded.sessionId,
        iat: decoded.iat,
        exp: decoded.exp
      };

      next();
    } catch (error) {
      console.error(`[${authConfig.serviceName}] Error en authenticateToken:`, error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
        service: authConfig.serviceName
      });
    }
  };
};

/**
 * Extrae el token del header Authorization
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) return null;
  
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  return authHeader;
}

/**
 * Handle JWT-specific errors
 */
function handleJWTError(res, jwtError, serviceName) {
  let message = "Token inválido";
  let code = "INVALID_TOKEN";

  switch (jwtError.name) {
    case 'TokenExpiredError':
      message = "Token expirado";
      code = "TOKEN_EXPIRED";
      break;
    case 'JsonWebTokenError':
      message = "Token malformado";
      code = "MALFORMED_TOKEN";
      break;
    case 'NotBeforeError':
      message = "Token no válido aún";
      code = "TOKEN_NOT_ACTIVE";
      break;
  }

  return res.status(401).json({
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    service: serviceName,
    shouldLogout: true
  });
}

/**
 * Check if user is active
 */
async function checkUserActive(userId, pool) {
  try {
    const result = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows.length > 0 && result.rows[0].is_active;
  } catch (error) {
    console.error('Error checking user active status:', error);
    return false;
  }
}

/**
 * Update user's last activity
 */
async function updateLastActivity(userId, pool) {
  try {
    await pool.query(
      'UPDATE users SET last_activity = NOW() WHERE id = $1',
      [userId]
    );
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
}

/**
 * Check user permissions
 */
async function checkUserPermissions(userId, allowedTypes, pool) {
  try {
    const result = await pool.query(
      'SELECT rol FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) return false;
    
    const userRole = result.rows[0].rol;
    return allowedTypes.includes(userRole);
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
}

module.exports = {
  authenticateToken,
  checkUserActive,
  updateLastActivity,
  AuthConfig
};
