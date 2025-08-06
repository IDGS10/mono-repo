// Service to interact with the Swarm API

// Base URL for the swarms API
const SWARM_API_URL = 'http://localhost:3000/swarms';

// Get user token from localStorage
const getToken = () => localStorage.getItem('userToken');

// Get all swarms
export const getSwarms = async () => {
  try {
    // For now, we'll use mock data
    return [
      {
        id: '1',
        name: 'Traffic Monitors',
        description: 'Monitors traffic flow at intersections',
        status: 'active',
        devices: 25,
        maxDevices: 50
      },
      {
        id: '2',
        name: 'Air Quality Sensors',
        description: 'Measures air pollution levels',
        status: 'assigned',
        devices: 10,
        maxDevices: 30
      }
    ];
    
    // Actual implementation:
    // const response = await fetch(SWARM_API_URL, {
    //   headers: {
    //     'Authorization': `Bearer ${getToken()}`
    //   }
    // });
    // if (!response.ok) throw new Error('Failed to fetch swarms');
    // return await response.json();
  } catch (error) {
    console.error('Error fetching swarms:', error);
    throw error;
  }
};

// Get swarms for a specific project
export const getProjectSwarms = async (projectId) => {
  try {
    // Mock data for now
    return [
      {
        id: '1',
        name: 'Traffic Monitors',
        description: 'Monitors traffic flow at intersections',
        status: 'active',
        devices: 25,
        maxDevices: 50
      }
    ];
    
    // Actual implementation would call a specific endpoint
    // that returns swarms associated with a project
  } catch (error) {
    console.error(`Error fetching swarms for project ${projectId}:`, error);
    throw error;
  }
};