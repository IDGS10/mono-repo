import apiService from './ApiService';

class DeviceService {
  
  // Get devices from a specific swarm
  async getSwarmDevices(swarmId) {
    const response = await apiService.get(`/swarms/${swarmId}/devices`);
    return response.data?.devices || [];
  }

  // Get detail of a specific device
  async getDeviceDetail(deviceId) {
    const response = await apiService.get(`/devices/${deviceId}`);
    return response.data?.device;
  }

  // Get logs from a device
  async getDeviceLogs(deviceId, filters = {}) {
    let endpoint = `/devices/${deviceId}/logs`;
    
    const queryParams = new URLSearchParams();
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.since) queryParams.append('since', filters.since);
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    const response = await apiService.get(endpoint);
    return response.data?.logs || [];
  }

  // Get sensor data from a device
  async getDeviceSensorData(deviceId) {
    const response = await apiService.get(`/devices/${deviceId}/sensors`);
    return response.data?.sensors || {};
  }

  // Update device configuration
  async updateDeviceConfig(deviceId, config) {
    const response = await apiService.put(`/devices/${deviceId}/config`, config);
    return response.data?.device;
  }

  // Restart a device
  async restartDevice(deviceId) {
    const response = await apiService.post(`/devices/${deviceId}/restart`);
    return response.data?.success;
  }

  // Assign device to a swarm
  async assignDeviceToSwarm(deviceId, swarmId) {
    const response = await apiService.post(`/devices/${deviceId}/assign`, {
      swarmId: swarmId
    });
    return response.data?.device;
  }

  // Remove device from a swarm
  async removeDeviceFromSwarm(deviceId) {
    const response = await apiService.post(`/devices/${deviceId}/unassign`);
    return response.data?.device;
  }

  // Get device statistics
  async getDeviceStats(deviceId, timeRange = '24h') {
    const response = await apiService.get(`/devices/${deviceId}/stats?range=${timeRange}`);
    return response.data?.stats || {};
  }
}

// Create a unique instance
const deviceService = new DeviceService();

export default deviceService;