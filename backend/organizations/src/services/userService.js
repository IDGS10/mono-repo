const axios = require('axios');

class UserService {
  constructor() {
    // URL del servicio de seguridad
    this.securityServiceURL = process.env.SECURITY_SERVICE_URL || 'http://localhost:8010';
  }

  /**
   * Crear usuario desde invitación de organización
   * @param {Object} userData - Datos del usuario y la invitación
   * @returns {Object} Usuario creado
   */
  async createFromInvitation(userData) {
    try {
      console.log('🔄 Creando usuario desde invitación:', userData);

      // Los datos ya vienen preparados desde el controller
      const userPayload = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        password_hash: userData.password_hash,
        phone: userData.phone,
        rol: userData.role,
        org_id: userData.organization_id,
        is_active: true,
        accepted: 1
      };

      console.log('📤 Enviando datos al servicio de seguridad:', userPayload);

      // Llamar al endpoint de registro del servicio de seguridad
      const response = await axios.post(`${this.securityServiceURL}/api/auth/register-from-invitation`, userPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos timeout
      });

      console.log('✅ Usuario creado exitosamente:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Error creando usuario desde invitación:', error);
      
      if (error.response) {
        // El servidor respondió con un error
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Error del servidor de seguridad';
        throw new Error(`Error al crear usuario: ${errorMessage}`);
      } else if (error.request) {
        // No hubo respuesta del servidor
        throw new Error('No se pudo conectar con el servicio de seguridad');
      } else {
        // Error en la configuración de la petición
        throw new Error(`Error de configuración: ${error.message}`);
      }
    }
  }

  /**
   * Verificar si un usuario ya existe en el sistema de seguridad
   * @param {string} email - Email del usuario
   * @returns {boolean} True si existe, false si no
   */
  async userExists(email) {
    try {
      const response = await axios.get(`${this.securityServiceURL}/api/auth/check-user/${encodeURIComponent(email)}`, {
        timeout: 5000
      });
      
      return response.data.exists;
    } catch (error) {
      console.warn('⚠️ Error verificando existencia de usuario:', error.message);
      return false; // En caso de error, asumimos que no existe
    }
  }

  /**
   * Obtener información de un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Object|null} Datos del usuario o null si no existe
   */
  async getUserByEmail(email) {
    try {
      const response = await axios.get(`${this.securityServiceURL}/api/auth/user/${encodeURIComponent(email)}`, {
        timeout: 5000
      });
      
      return response.data.user;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Usuario no encontrado
      }
      
      console.error('❌ Error obteniendo usuario:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
