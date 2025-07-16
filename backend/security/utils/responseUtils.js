/**
 * Clase para manejar respuestas HTTP con estandares
 */
class ResponseUtils {
  /**
   * Respuesta exitosa genérica
   * @param {Object} res - Response object de Express
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} message - Mensaje de éxito
   * @param {Object} data - Datos adicionales
   * @returns {Object} - Respuesta JSON
   */
  static success(res, statusCode = 200, message = 'Operación exitosa', data = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Respuesta de error genérica
   * @param {Object} res - Response object de Express
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} message - Mensaje de error
   * @param {Object} error - Detalles del error (opcional)
   * @param {Object} additionalData - Datos adicionales (opcional)
   * @returns {Object} - Respuesta JSON
   */
  static error(res, statusCode = 500, message = 'Error interno del servidor', error = null, additionalData = {}) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    // Solo incluir detalles del error en desarrollo
    if (process.env.NODE_ENV === 'development' && error) {
      response.error = error instanceof Error ? error.message : error;
      if (error instanceof Error && error.stack) {
        response.stack = error.stack;
      }
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Respuesta de validación fallida
   * @param {Object} res - Response object de Express
   * @param {string} message - Mensaje de error
   * @param {Array|Object} validationErrors - Errores de validación específicos
   * @returns {Object} - Respuesta JSON
   */
  static validationError(res, message = 'Datos de entrada inválidos', validationErrors = []) {
    return res.status(400).json({
      success: false,
      message,
      validationErrors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de no autorizado
   * @param {Object} res - Response object de Express
   * @param {string} message - Mensaje de error
   * @param {boolean} shouldLogout - Si debe cerrar sesión en el frontend
   * @returns {Object} - Respuesta JSON
   */
  static unauthorized(res, message = 'No autorizado', shouldLogout = true) {
    return res.status(401).json({
      success: false,
      message,
      shouldLogout,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de acceso prohibido
   * @param {Object} res - Response object de Express
   * @param {string} message - Mensaje de error
   * @returns {Object} - Respuesta JSON
   */
  static forbidden(res, message = 'Acceso denegado') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de recurso no encontrado
   * @param {Object} res - Response object de Express
   * @param {string} message - Mensaje de error
   * @returns {Object} - Respuesta JSON
   */
  static notFound(res, message = 'Recurso no encontrado') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de conflicto (duplicados, etc.)
   * @param {Object} res - Response object de Express
   * @param {string} message - Mensaje de error
   * @returns {Object} - Respuesta JSON
   */
  static conflict(res, message = 'Conflicto con el estado actual del recurso') {
    return res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de límite de velocidad excedido
   * @param {Object} res - Response object de Express
   * @param {string} message - Mensaje de error
   * @param {number} retryAfter - Segundos para reintentar
   * @returns {Object} - Respuesta JSON
   */
  static rateLimited(res, message = 'Demasiadas peticiones', retryAfter = 60) {
    return res.status(429).json({
      success: false,
      message,
      retryAfter,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de creación exitosa
   * @param {Object} res - Response object de Express
   * @param {string} message - Mensaje de éxito
   * @param {Object} data - Datos del recurso creado
   * @returns {Object} - Respuesta JSON
   */
  static created(res, message = 'Recurso creado exitosamente', data = {}) {
    return this.success(res, 201, message, data);
  }

  /**
   * Respuesta sin contenido (para deletes exitosos)
   * @param {Object} res - Response object de Express
   * @returns {Object} - Respuesta sin contenido
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Respuesta con paginación
   * @param {Object} res - Response object de Express
   * @param {Array} data - Datos paginados
   * @param {Object} pagination - Información de paginación
   * @param {string} message - Mensaje de éxito
   * @returns {Object} - Respuesta JSON
   */
  static paginated(res, data, pagination, message = 'Datos obtenidos exitosamente') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page || 1,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems || data.length,
        itemsPerPage: pagination.limit || data.length,
        hasNextPage: pagination.hasNextPage || false,
        hasPrevPage: pagination.hasPrevPage || false
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Middleware para capturar errores async y pasarlos al handler de errores
   * @param {Function} fn - Función async a wrappear
   * @returns {Function} - Middleware de Express
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handler global de errores para Express
   * @param {Error} err - Error capturado
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static globalErrorHandler(err, req, res, next) {
    console.error('Error no manejado:', err);

    // Error de validación de Joi o similar
    if (err.isJoi || err.name === 'ValidationError') {
      return ResponseUtils.validationError(res, 'Datos de entrada inválidos', err.details);
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
      return ResponseUtils.unauthorized(res, 'Token inválido');
    }

    if (err.name === 'TokenExpiredError') {
      return ResponseUtils.unauthorized(res, 'Token expirado');
    }

    // Error de base de datos
    if (err.code === '23505') { // Duplicate key error en PostgreSQL
      return ResponseUtils.conflict(res, 'El recurso ya existe');
    }

    if (err.code === '23503') { // Foreign key constraint error
      return ResponseUtils.validationError(res, 'Referencia inválida');
    }

    // Error por defecto
    return ResponseUtils.error(res, 500, 'Error interno del servidor', err);
  }
}

module.exports = ResponseUtils;