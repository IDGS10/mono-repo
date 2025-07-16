// utils/validationUtils.js
// Utilidades para validación de datos

/**
 * Clase para manejar validaciones comunes
 */
class ValidationUtils {
    /**
     * Valida formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} - true si es válido
     */
    static isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof email === 'string' && emailRegex.test(email.trim());
    }
  
    /**
     * Valida contraseña según criterios de seguridad
     * @param {string} password - Contraseña a validar
     * @param {Object} options - Opciones de validación
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
        errors.push('La contraseña es requerida');
        return { isValid: false, errors };
      }
  
      if (password.length < minLength) {
        errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
      }
  
      if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra mayúscula');
      }
  
      if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula');
      }
  
      if (requireNumbers && !/\d/.test(password)) {
        errors.push('La contraseña debe contener al menos un número');
      }
  
      if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('La contraseña debe contener al menos un carácter especial');
      }
  
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Valida que los campos requeridos estén presentes
     * @param {Object} data - Datos a validar
     * @param {Array} requiredFields - Campos requeridos
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
     * Valida longitud de strings
     * @param {string} value - Valor a validar
     * @param {number} minLength - Longitud mínima
     * @param {number} maxLength - Longitud máxima
     * @returns {boolean} - true si es válido
     */
    static validateStringLength(value, minLength = 0, maxLength = Infinity) {
      if (typeof value !== 'string') return false;
      return value.length >= minLength && value.length <= maxLength;
    }
  
    /**
     * Valida formato de teléfono (básico)
     * @param {string} phone - Número de teléfono
     * @returns {boolean} - true si es válido
     */
    static isValidPhone(phone) {
      if (!phone || typeof phone !== 'string') return false;
      // Permite números, espacios, guiones, paréntesis y el símbolo +
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
      return phoneRegex.test(phone.trim());
    }
  
    /**
     * Valida que un valor sea un número positivo
     * @param {*} value - Valor a validar
     * @returns {boolean} - true si es válido
     */
    static isPositiveNumber(value) {
      const num = Number(value);
      return !isNaN(num) && num > 0;
    }
  
    /**
     * Valida que un valor sea un entero positivo
     * @param {*} value - Valor a validar
     * @returns {boolean} - true si es válido
     */
    static isPositiveInteger(value) {
      const num = Number(value);
      return Number.isInteger(num) && num > 0;
    }
  
    /**
     * Valida formato de fecha
     * @param {*} date - Fecha a validar
     * @returns {boolean} - true si es válido
     */
    static isValidDate(date) {
      if (!date) return false;
      const dateObj = new Date(date);
      return dateObj instanceof Date && !isNaN(dateObj.getTime());
    }
  
    /**
     * Valida que una fecha esté en el futuro
     * @param {*} date - Fecha a validar
     * @returns {boolean} - true si es válido
     */
    static isFutureDate(date) {
      if (!this.isValidDate(date)) return false;
      return new Date(date) > new Date();
    }
  
    /**
     * Valida que una fecha esté en el pasado
     * @param {*} date - Fecha a validar
     * @returns {boolean} - true si es válido
     */
    static isPastDate(date) {
      if (!this.isValidDate(date)) return false;
      return new Date(date) < new Date();
    }
  
    /**
     * Sanitiza un string removiendo caracteres peligrosos
     * @param {string} input - String a sanitizar
     * @returns {string} - String sanitizado
     */
    static sanitizeString(input) {
      if (typeof input !== 'string') return '';
      return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
        .replace(/[<>]/g, '') // Remover < y >
        .substring(0, 1000); // Limitar longitud
    }
  
    /**
     * Valida datos de registro de usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Object} - {isValid: boolean, errors: []}
     */
    static validateUserRegistration(userData) {
      const errors = [];
      const { email, password, firstName, lastName } = userData;
  
      // Campos requeridos
      const requiredValidation = ValidationUtils.validateRequiredFields(userData, ['email', 'password', 'firstName', 'lastName']);
      if (!requiredValidation.isValid) {
        errors.push(`Campos requeridos faltantes: ${requiredValidation.missingFields.join(', ')}`);
      }
  
      // Validar email
      if (email && !ValidationUtils.isValidEmail(email)) {
        errors.push('Formato de email inválido');
      }
  
      // Validar contraseña
      if (password) {
        const passwordValidation = ValidationUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors);
        }
      }
  
      // Validar nombres
      if (firstName && !ValidationUtils.validateStringLength(firstName, 2, 50)) {
        errors.push('El nombre debe tener entre 2 y 50 caracteres');
      }
  
      if (lastName && !ValidationUtils.validateStringLength(lastName, 2, 50)) {
        errors.push('El apellido debe tener entre 2 y 50 caracteres');
      }
  
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Valida datos de login
     * @param {Object} loginData - Datos de login
     * @returns {Object} - {isValid: boolean, errors: []}
     */
    static validateLogin(loginData) {
      const errors = [];
      const { email, password } = loginData;
  
      // Campos requeridos
      const requiredValidation = ValidationUtils.validateRequiredFields(loginData, ['email', 'password']);
      if (!requiredValidation.isValid) {
        errors.push('Email y contraseña son requeridos');
      }
  
      // Validar email
      if (email && !ValidationUtils.isValidEmail(email)) {
        errors.push('Formato de email inválido');
      }
  
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Valida datos de actualización de perfil
     * @param {Object} profileData - Datos del perfil
     * @returns {Object} - {isValid: boolean, errors: []}
     */
    static validateProfileUpdate(profileData) {
      const errors = [];
      const { firstName, lastName, phone } = profileData;
  
      // Validar nombres si están presentes
      if (firstName !== undefined && !ValidationUtils.validateStringLength(firstName, 2, 50)) {
        errors.push('El nombre debe tener entre 2 y 50 caracteres');
      }
  
      if (lastName !== undefined && !ValidationUtils.validateStringLength(lastName, 2, 50)) {
        errors.push('El apellido debe tener entre 2 y 50 caracteres');
      }
  
      // Validar teléfono si está presente
      if (phone !== undefined && phone !== '' && !ValidationUtils.isValidPhone(phone)) {
        errors.push('Formato de teléfono inválido');
      }
  
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Valida parámetros de paginación
     * @param {Object} params - Parámetros de paginación
     * @returns {Object} - {page: number, limit: number, errors: []}
     */
    static validatePaginationParams(params) {
      const errors = [];
      let { page = 1, limit = 10 } = params;
  
      // Convertir a números
      page = Number(page);
      limit = Number(limit);
  
      // Validar página
      if (!ValidationUtils.isPositiveInteger(page)) {
        errors.push('La página debe ser un número entero positivo');
        page = 1;
      }
  
      // Validar límite
      if (!ValidationUtils.isPositiveInteger(limit) || limit > 100) {
        errors.push('El límite debe ser un número entero positivo menor a 100');
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