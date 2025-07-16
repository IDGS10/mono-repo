// middleware/middleware.js
// Middleware refactorizado con mejor estructura y uso de utilidades

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constats");
const AuthService = require("../services/auth.service");
const ResponseUtils = require("../utils/responseUtils");

/**
 * Middleware para autenticación de tokens JWT
 * @param {Array} allowedTypes - Tipos de usuario permitidos (opcional)
 * @returns {Function} - Middleware de Express
 */
const authenticateToken = (allowedTypes = []) => {
  return ResponseUtils.asyncHandler(async (req, res, next) => {
    try {
      // Extraer token del header Authorization
      const token = extractTokenFromHeader(req);

      if (!token) {
        return ResponseUtils.unauthorized(res, "Token de acceso requerido");
      }

      // Verificar JWT
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, JWT_SECRET);
        console.log("[Auth] JWT válido para usuario:", decodedToken.email);
      } catch (jwtError) {
        console.error("[Auth] Error verificando JWT:", jwtError.message);
        return handleJWTError(res, jwtError);
      }

      // Validar sesión en base de datos
      const sessionData = await AuthService.validateSession(token);
      if (!sessionData) {
        return ResponseUtils.unauthorized(res, "Token inválido o expirado");
      }

      // Verificar permisos de usuario si se especificaron tipos permitidos
      if (allowedTypes.length > 0) {
        const hasPermission = await checkUserPermissions(sessionData.user_id, allowedTypes);
        if (!hasPermission) {
          return ResponseUtils.forbidden(res, "Acceso denegado. Permisos insuficientes");
        }
      }

      // Agregar información del usuario al request
      req.user = {
        userId: sessionData.user_id,
        email: sessionData.email,
        firstName: sessionData.first_name,
        lastName: sessionData.last_name,
        token: token
      };

      next();
    } catch (error) {
      console.error("Error en middleware de autenticación:", error);
      return ResponseUtils.error(res, 500, "Error interno del servidor al verificar el token");
    }
  });
};

/**
 * Extrae el token del header Authorization
 * @param {Object} req - Request object
 * @returns {string|null} - Token o null si no existe
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return null;
  }

  // Formato: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Maneja errores específicos de JWT
 * @param {Object} res - Response object
 * @param {Error} jwtError - Error de JWT
 * @returns {Object} - Respuesta HTTP
 */
function handleJWTError(res, jwtError) {
  let errorMessage = "Token inválido";
  
  switch (jwtError.name) {
    case "TokenExpiredError":
      errorMessage = "Token ha expirado";
      break;
    case "JsonWebTokenError":
      errorMessage = "Token malformado o inválido";
      break;
    case "NotBeforeError":
      errorMessage = "Token no es válido aún";
      break;
  }

  return ResponseUtils.unauthorized(res, errorMessage);
}

/**
 * Verifica permisos de usuario basado en tipos permitidos
 * @param {number} userId - ID del usuario
 * @param {Array} allowedTypes - Tipos de usuario permitidos
 * @returns {boolean} - true si tiene permisos
 */
async function checkUserPermissions(userId, allowedTypes) {
  try {
    const { pool } = require("../config/database");
    const userTypeResult = await pool.query(
      "SELECT type FROM users WHERE id = $1",
      [userId]
    );

    if (userTypeResult.rows.length === 0) {
      return false;
    }

    const userType = userTypeResult.rows[0].type;
    return allowedTypes.includes(userType);
  } catch (error) {
    console.error("Error verificando permisos de usuario:", error);
    return false;
  }
}

/**
 * Middleware para validar datos de entrada
 * @param {Function} validationFunction - Función de validación a usar
 * @returns {Function} - Middleware de Express
 */
const validateInput = (validationFunction) => {
  return (req, res, next) => {
    const validation = validationFunction(req.body);
    
    if (!validation.isValid) {
      return ResponseUtils.validationError(res, "Datos de entrada inválidos", validation.errors);
    }
    
    next();
  };
};

/**
 * Middleware para validar parámetros de paginación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const validatePagination = (req, res, next) => {
  const ValidationUtils = require("../utils/validationUtils");
  const validation = ValidationUtils.validatePaginationParams(req.query);
  
  if (!validation.isValid) {
    return ResponseUtils.validationError(res, "Parámetros de paginación inválidos", validation.errors);
  }
  
  // Agregar parámetros validados al request
  req.pagination = {
    page: validation.page,
    limit: validation.limit
  };
  
  next();
};

/**
 * Middleware para sanitizar datos de entrada
 * @param {Array} fields - Campos a sanitizar
 * @returns {Function} - Middleware de Express
 */
const sanitizeInput = (fields = []) => {
  return (req, res, next) => {
    const ValidationUtils = require("../utils/validationUtils");
    
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = ValidationUtils.sanitizeString(req.body[field]);
        }
      });
    }
    
    next();
  };
};

/**
 * Middleware para logging de requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log del request
  console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  // Override de res.json para loggear respuestas
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Middleware para verificar estado de la base de datos
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const checkDatabaseConnection = ResponseUtils.asyncHandler(async (req, res, next) => {
  try {
    const { pool } = require("../config/database");
    await pool.query('SELECT 1');
    next();
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
    return ResponseUtils.error(res, 503, "Servicio no disponible temporalmente. Problemas con la base de datos");
  }
});

/**
 * Middleware para limitar el tamaño de archivos
 * @param {number} maxSize - Tamaño máximo en bytes
 * @returns {Function} - Middleware de Express
 */
const limitFileSize = (maxSize = 10 * 1024 * 1024) => { // 10MB por defecto
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return ResponseUtils.validationError(res, `El archivo es demasiado grande. Máximo permitido: ${maxSize / 1024 / 1024}MB`);
    }
    
    next();
  };
};

/**
 * Middleware para verificar si el usuario está activo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const checkUserActive = ResponseUtils.asyncHandler(async (req, res, next) => {
  try {
    const { pool } = require("../config/database");
    const result = await pool.query(
      "SELECT is_active FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return ResponseUtils.forbidden(res, "Cuenta desactivada. Contacte al administrador");
    }

    next();
  } catch (error) {
    console.error("Error verificando estado del usuario:", error);
    return ResponseUtils.error(res, 500, "Error verificando estado del usuario");
  }
});

/**
 * Middleware para agregar headers de seguridad personalizados
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const securityHeaders = (req, res, next) => {
  // Agregar headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remover header que expone información del servidor
  res.removeHeader('X-Powered-By');
  
  next();
};

module.exports = {
  authenticateToken,
  validateInput,
  validatePagination,
  sanitizeInput,
  requestLogger,
  checkDatabaseConnection,
  limitFileSize,
  checkUserActive,
  securityHeaders
};