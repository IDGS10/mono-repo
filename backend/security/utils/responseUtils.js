/**
 * Class to handle HTTP responses with standards
 */
class ResponseUtils {
  /**
   * Generic success response
   * @param {Object} res - Express Response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {Object} data - Additional data
   * @returns {Object} - JSON response
   */
  static success(res, statusCode = 200, message = 'Operation successful', data = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Generic error response
   * @param {Object} res - Express Response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} error - Error details (optional)
   * @param {Object} additionalData - Additional data (optional)
   * @returns {Object} - JSON response
   */
  static error(res, statusCode = 500, message = 'Internal server error', error = null, additionalData = {}) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    // Only include error details in development
    if (process.env.NODE_ENV === 'development' && error) {
      response.error = error instanceof Error ? error.message : error;
      if (error instanceof Error && error.stack) {
        response.stack = error.stack;
      }
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Validation failed response
   * @param {Object} res - Express Response object
   * @param {string} message - Error message
   * @param {Array|Object} validationErrors - Specific validation errors
   * @returns {Object} - JSON response
   */
  static validationError(res, message = 'Invalid input data', validationErrors = []) {
    return res.status(400).json({
      success: false,
      message,
      validationErrors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express Response object
   * @param {string} message - Error message
   * @param {boolean} shouldLogout - Whether to logout on frontend
   * @returns {Object} - JSON response
   */
  static unauthorized(res, message = 'Unauthorized', shouldLogout = true) {
    return res.status(401).json({
      success: false,
      message,
      shouldLogout,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Forbidden access response
   * @param {Object} res - Express Response object
   * @param {string} message - Error message
   * @returns {Object} - JSON response
   */
  static forbidden(res, message = 'Access denied') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resource not found response
   * @param {Object} res - Express Response object
   * @param {string} message - Error message
   * @returns {Object} - JSON response
   */
  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Conflict response (duplicates, etc.)
   * @param {Object} res - Express Response object
   * @param {string} message - Error message
   * @returns {Object} - JSON response
   */
  static conflict(res, message = 'Conflict with current resource state') {
    return res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Rate limit exceeded response
   * @param {Object} res - Express Response object
   * @param {string} message - Error message
   * @param {number} retryAfter - Seconds to retry
   * @returns {Object} - JSON response
   */
  static rateLimited(res, message = 'Too many requests', retryAfter = 60) {
    return res.status(429).json({
      success: false,
      message,
      retryAfter,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Successful creation response
   * @param {Object} res - Express Response object
   * @param {string} message - Success message
   * @param {Object} data - Created resource data
   * @returns {Object} - JSON response
   */
  static created(res, message = 'Resource created successfully', data = {}) {
    return this.success(res, 201, message, data);
  }

  /**
   * No content response (for successful deletes)
   * @param {Object} res - Express Response object
   * @returns {Object} - No content response
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Paginated response
   * @param {Object} res - Express Response object
   * @param {Array} data - Paginated data
   * @param {Object} pagination - Pagination information
   * @param {string} message - Success message
   * @returns {Object} - JSON response
   */
  static paginated(res, data, pagination, message = 'Data retrieved successfully') {
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
   * Middleware to catch async errors and pass them to error handler
   * @param {Function} fn - Async function to wrap
   * @returns {Function} - Express middleware
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Global error handler for Express
   * @param {Error} err - Caught error
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static globalErrorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);

    // Joi validation error or similar
    if (err.isJoi || err.name === 'ValidationError') {
      return ResponseUtils.validationError(res, 'Invalid input data', err.details);
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
      return ResponseUtils.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
      return ResponseUtils.unauthorized(res, 'Expired token');
    }

    // Database error
    if (err.code === '23505') { // Duplicate key error in PostgreSQL
      return ResponseUtils.conflict(res, 'Resource already exists');
    }

    if (err.code === '23503') { // Foreign key constraint error
      return ResponseUtils.validationError(res, 'Invalid reference');
    }

    // Default error
    return ResponseUtils.error(res, 500, 'Internal server error', err);
  }
}

module.exports = ResponseUtils;