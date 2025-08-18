// src/services/SwarmService.js
import apiService from './ApiService';

/**
 * SwarmService - Handles all swarm-related API operations
 * Provides methods for CRUD operations, device management, and state transitions
 */
class SwarmService {
  
  /**
   * Get all swarms with optional filters
   * @param {Object} filters - Optional filters (status, search, limit, offset)
   * @returns {Promise<Array>} Array of swarms formatted for frontend
   */
  async getSwarms(filters = {}) {
    let endpoint = '/swarms';
    
    // Build query parameters if filters are provided
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    const response = await apiService.get(endpoint);
    
    // Transform backend data to frontend format
    return (response.data?.swarms?.map((s) => ({
      id: s.swarmId,
      name: s.swarmName,
      status: s.status,
      devices: Array.isArray(s.devices) ? s.devices.length : 0,
      maxDevices: s.maxDevices || 0,
      createdAt: s.created_at ? s.created_at.substring(0, 10) : "",
      lastActivity: s.lastActivity ? s.lastActivity.substring(0, 10) : "",
      description: s.description,
      requestedBy: s.requesterId,
      // Additional backend fields
      requesterId: s.requesterId,
      projectId: s.projectId,
      clusterManagerId: s.clusterManagerId,
      assignedAt: s.assignedAt,
      activatedAt: s.activatedAt,
      location: s.location,
      isActive: s.isActive,
    })) || []);
  }

  /**
   * Get swarms assigned to current user (status: 'assigned')
   * Used for the user's catalog
   * @returns {Promise<Array>} Array of assigned swarms
   */
  async getMySwarms() {
    return this.getSwarms({ status: 'assigned' });
  }

  /**
   * Get pending swarm requests (status: 'requested')
   * Used for the requests page where users can assign swarms to themselves
   * @returns {Promise<Array>} Array of pending requests
   */
  async getSwarmRequests() {
    return this.getSwarms({ status: 'requested' });
  }

  /**
   * Get detailed information of a specific swarm
   * @param {string} swarmId - The swarm ID to fetch
   * @returns {Promise<Object>} Swarm details
   */
  async getSwarmDetail(swarmId) {
    try {
      // Try direct endpoint first
      const response = await apiService.get(`/swarms/${swarmId}`);
      
      // Transform single swarm response to match frontend format
      const swarm = response.data?.swarm;
      if (swarm) {
        return {
          id: swarm.swarmId,
          name: swarm.swarmName,
          status: swarm.status,
          devices: Array.isArray(swarm.devices) ? swarm.devices : [],
          maxDevices: swarm.maxDevices || 0,
          createdAt: swarm.created_at,
          created_at: swarm.created_at,
          lastActivity: swarm.lastActivity,
          description: swarm.description,
          requestedBy: swarm.requesterId,
          requesterId: swarm.requesterId,
          projectId: swarm.projectId,
          clusterManagerId: swarm.clusterManagerId,
          assignedAt: swarm.assignedAt,
          activatedAt: swarm.activatedAt,
          location: swarm.location,
          isActive: swarm.isActive,
        };
      }
      
      return swarm;
    } catch (error) {
      // Log the initial error before trying fallback
      console.error('Failed to fetch swarm directly:', error);
      // Fallback: Get all swarms and find the specific one
      try {
        const allSwarms = await this.getSwarms();
        const targetSwarm = allSwarms.find(s => s.id === swarmId);
        
        if (targetSwarm) {
          // Ensure the swarm has all required fields
          return {
            ...targetSwarm,
            devices: [], // Empty array for consistency
            created_at: targetSwarm.createdAt || targetSwarm.created_at,
            description: targetSwarm.description || '',
            requestedBy: targetSwarm.requestedBy || targetSwarm.requesterId || 'Unknown',
          };
        } else {
          throw new Error('Swarm not found in user\'s accessible swarms');
        }
      } catch (fallbackError) {
        throw new Error(`Swarm ${swarmId} not found or access denied: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Get detailed information of a swarm including its devices
   * @param {string} swarmId - The swarm ID to fetch
   * @returns {Promise<Object>} Swarm details with devices array
   */
  async getSwarmDetailWithDevices(swarmId) {
    // Get basic swarm information
    const swarm = await this.getSwarmDetail(swarmId);
    
    // Get devices for this swarm
    try {
      const devicesResponse = await apiService.get(`/swarms/${swarmId}/devices`);
      const devices = devicesResponse.data?.devices || [];
      
      // Map devices to expected frontend format
      const mappedDevices = devices.map(device => ({
        id: device.deviceId,
        name: device.deviceName,
        type: device.deviceType,
        status: device.isOnline ? 'online' : 'offline',
        batteryLevel: device.batteryLevel,
        lastSeen: device.lastSeen,
        macAddress: device.macAddress,
        location: device.location,
      }));
      
      return {
        ...swarm,
        devices: mappedDevices,
      };
    } catch (error) {
      // Return swarm without devices rather than failing completely
      console.error('Failed to fetch devices:', error);
      return {
        ...swarm,
        devices: [],
      };
    }
  }

  /**
   * Create a new swarm
   * @param {Object} swarmData - Swarm data to create
   * @param {string} swarmData.name - Swarm name
   * @param {string} swarmData.description - Swarm description
   * @param {number} swarmData.maxDevices - Maximum number of devices
   * @param {number} swarmData.requesterId - ID of the requesting user
   * @returns {Promise<Object>} Created swarm data
   */
  async createSwarm(swarmData) {
    const response = await apiService.post('/swarms', {
      name: swarmData.name,
      description: swarmData.description || "",
      maxDevices: swarmData.maxDevices,
      requesterId: swarmData.requesterId,
    });
    return response.data?.swarm;
  }

  /**
   * Update an existing swarm
   * @param {string} swarmId - ID of the swarm to update
   * @param {Object} swarmData - Updated swarm data
   * @returns {Promise<Object>} Updated swarm data
   */
  async updateSwarm(swarmId, swarmData) {
    try {
      const response = await apiService.put(`/swarms/${swarmId}`, {
        name: swarmData.name,
        description: swarmData.description,
        maxDevices: swarmData.maxDevices,
      });
      
      return response.data?.swarm || response.data;
    } catch (error) {
      throw new Error(`Failed to update swarm: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete a swarm
   * @param {string} swarmId - ID of the swarm to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteSwarm(swarmId) {
    try {
      await apiService.delete(`/swarms/${swarmId}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete swarm: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a duplicate of an existing swarm
   * @param {Object} swarm - Original swarm object to duplicate
   * @returns {Promise<Object>} New duplicated swarm data
   */
  async duplicateSwarm(swarm) {
    const duplicatedData = {
      name: `${swarm.name} (Copy)`,
      description: swarm.description || "",
      maxDevices: swarm.maxDevices,
      requesterId: swarm.requesterId,
    };
    
    const response = await apiService.post('/swarms', duplicatedData);
    return response.data?.swarm;
  }

  /**
   * Assign a swarm request to the current user
   * Changes swarm status from 'requested' to 'assigned'
   * @param {string} swarmId - ID of the swarm to assign
   * @returns {Promise<Object>} Updated swarm data
   */
  async assignSwarmToMe(swarmId) {
    try {
      const response = await apiService.post(`/swarms/${swarmId}/assign`, {
        clusterManagerId: 1 // TODO: Get this from user context
      });
      return response.data?.swarm || response.data;
    } catch (error) {
      throw new Error(`Unable to assign swarm ${swarmId}. ${error.response?.data?.message || error.message}`);
    }
  }
}

// Create and export a singleton instance
const swarmService = new SwarmService();

export default swarmService;