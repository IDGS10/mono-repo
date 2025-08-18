import { SwarmsApi } from '../../../Api';

/**
 * ApiService - HTTP client wrapper for Swarms API
 * Provides a clean interface for making API requests with proper error handling
 */
class ApiService {
  constructor() {
    this.api = SwarmsApi; // Use the pre-configured API instance
  }

  /**
   * Base method for making HTTP requests
   * @param {string} endpoint - API endpoint to call
   * @param {Object} config - Request configuration (method, data, headers, etc.)
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, config = {}) {
    const response = await this.api.request({
      url: endpoint,
      ...config,
    });
    return response.data;
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Additional request configuration
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, config = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...config,
    });
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} config - Additional request configuration
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data, config = {}) {
    return this.request(endpoint, {
      method: 'POST',
      data,
      ...config,
    });
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} config - Additional request configuration
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data, config = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      data,
      ...config,
    });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Additional request configuration
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, config = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * Check if user has a valid authentication token
   * @returns {boolean} True if token exists
   */
  hasToken() {
    const userData = JSON.parse(localStorage.getItem("monoRepoUserData"));
    return !!(userData && userData.token);
  }

  /**
   * Get the current authentication token
   * @returns {string|null} Current token or null if not found
   */
  getCurrentToken() {
    const userData = JSON.parse(localStorage.getItem("monoRepoUserData"));
    return userData ? userData.token : null;
  }

  /**
   * Get current user data from localStorage
   * @returns {Object|null} User data object or null if not found
   */
  getCurrentUser() {
    const userData = localStorage.getItem("monoRepoUserData");
    return userData ? JSON.parse(userData) : null;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;