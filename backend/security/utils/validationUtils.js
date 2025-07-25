/**
 * Class to handle common validations
 */
class ValidationUtils {
  /**
   * Sanitizes text input to prevent XSS
   * @param {string} input - Text to sanitize
   * @returns {string} - Sanitized text
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} - true if valid
   */
  static isValidEmail(email) {
    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Check for consecutive dots
    const hasConsecutiveDots = /\.\./.test(email);
    // Check for dots at start or end of local part
    const hasInvalidDots = /^\.|\.$|@\.|\.\@/.test(email);

    return typeof email === 'string' &&
      emailRegex.test(email.trim()) &&
      !hasConsecutiveDots &&
      !hasInvalidDots;
  }

  /**
   * Validates password according to security criteria
   * @param {string} password - Password to validate
   * @param {Object} options - Validation options
   * @returns {Object} - {isValid: boolean, errors: []}
   */
  static validatePassword(password, options = {}) {
    const {
      minLength = 6,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSpecialChars = false
    } = options;

    const errors = [];

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < minLength) {
      errors.push(`Password must have at least ${minLength} characters`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates that required fields are present
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Required fields
   * @returns {Object} - {isValid: boolean, missingFields: []}
   */
  static validateRequiredFields(data, requiredFields) {
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!data || !data.hasOwnProperty(field) || data[field] === null || data[field] === undefined || data[field] === '') {
        missingFields.push(field);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validates string length
   * @param {string} value - Value to validate
   * @param {number} minLength - Minimum length
   * @param {number} maxLength - Maximum length
   * @returns {boolean} - true if valid
   */
  static validateStringLength(value, minLength = 0, maxLength = Infinity) {
    if (typeof value !== 'string') return false;
    return value.length >= minLength && value.length <= maxLength;
  }

  /**
   * Validates phone format (basic)
   * @param {string} phone - Phone number
   * @returns {boolean} - true if valid
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    // Allows numbers, spaces, hyphens, parentheses and the + symbol
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone.trim());
  }

  /**
   * Validates that a value is a positive number
   * @param {*} value - Value to validate
   * @returns {boolean} - true if valid
   */
  static isPositiveNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }

  /**
   * Validates that a value is a positive integer
   * @param {*} value - Value to validate
   * @returns {boolean} - true if valid
   */
  static isPositiveInteger(value) {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * Validates date format
   * @param {*} date - Date to validate
   * @returns {boolean} - true if valid
   */
  static isValidDate(date) {
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  }

  /**
   * Validates that a date is in the future
   * @param {*} date - Date to validate
   * @returns {boolean} - true if valid
   */
  static isFutureDate(date) {
    if (!this.isValidDate(date)) return false;
    return new Date(date) > new Date();
  }

  /**
   * Validates that a date is in the past
   * @param {*} date - Date to validate
   * @returns {boolean} - true if valid
   */
  static isPastDate(date) {
    if (!this.isValidDate(date)) return false;
    return new Date(date) < new Date();
  }

  /**
   * Sanitizes a string removing dangerous characters
   * @param {string} input - String to sanitize
   * @returns {string} - Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/[<>]/g, '') // Remove < and >
      .substring(0, 1000); // Limit length
  }

  /**
   * Validates user registration data
   * @param {Object} userData - User data
   * @returns {Object} - {isValid: boolean, errors: []}
   */
  static validateUserRegistration(userData) {
    const errors = [];
    let { email, password, firstName, lastName } = userData;

    // Sanitize text inputs
    if (firstName) firstName = ValidationUtils.sanitizeInput(firstName).trim();
    if (lastName) lastName = ValidationUtils.sanitizeInput(lastName).trim();
    if (email) email = email.toLowerCase().trim();

    // Required fields
    const requiredValidation = ValidationUtils.validateRequiredFields(userData, ['email', 'password', 'firstName', 'lastName']);
    if (!requiredValidation.isValid) {
      errors.push(`Missing required fields: ${requiredValidation.missingFields.join(', ')}`);
    }

    // Validate email
    if (email && !ValidationUtils.isValidEmail(email)) {
      errors.push('Invalid email format');
    }

    // Validate password
    if (password) {
      const passwordValidation = ValidationUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    // Validate names
    if (firstName && !ValidationUtils.validateStringLength(firstName, 2, 50)) {
      errors.push('First name must be between 2 and 50 characters');
    }

    if (lastName && !ValidationUtils.validateStringLength(lastName, 2, 50)) {
      errors.push('Last name must be between 2 and 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: {
        email,
        firstName,
        lastName,
        password
      }
    };
  }

  /**
   * Validates login data
   * @param {Object} loginData - Login data
   * @returns {Object} - {isValid: boolean, errors: []}
   */
  static validateLogin(loginData) {
    const errors = [];
    const { email, password } = loginData;

    // Required fields
    const requiredValidation = ValidationUtils.validateRequiredFields(loginData, ['email', 'password']);
    if (!requiredValidation.isValid) {
      errors.push('Email and password are required');
    }

    // Validate email
    if (email && !ValidationUtils.isValidEmail(email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates profile update data
   * @param {Object} profileData - Profile data
   * @returns {Object} - {isValid: boolean, errors: []}
   */
  static validateProfileUpdate(profileData) {
    const errors = [];
    const { firstName, lastName, phone } = profileData;

    // Validate names if present
    if (firstName !== undefined && !ValidationUtils.validateStringLength(firstName, 2, 50)) {
      errors.push('First name must be between 2 and 50 characters');
    }

    if (lastName !== undefined && !ValidationUtils.validateStringLength(lastName, 2, 50)) {
      errors.push('Last name must be between 2 and 50 characters');
    }

    // Validate phone if present
    if (phone !== undefined && phone !== '' && !ValidationUtils.isValidPhone(phone)) {
      errors.push('Invalid phone format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates pagination parameters
   * @param {Object} params - Pagination parameters
   * @returns {Object} - {page: number, limit: number, errors: []}
   */
  static validatePaginationParams(params) {
    const errors = [];
    let { page = 1, limit = 10 } = params;

    // Convert to numbers
    page = Number(page);
    limit = Number(limit);

    // Validate page
    if (!ValidationUtils.isPositiveInteger(page)) {
      errors.push('Page must be a positive integer');
      page = 1;
    }

    // Validate limit
    if (!ValidationUtils.isPositiveInteger(limit) || limit > 100) {
      errors.push('Limit must be a positive integer less than 100');
      limit = 10;
    }

    return {
      page,
      limit,
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ValidationUtils;