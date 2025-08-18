import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, requestSwarmSimple, getAvailableDevicesInfo } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const AddSwarm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [devicesInfo, setDevicesInfo] = useState({ devices: [], summary: {} });
  const [formData, setFormData] = useState({
    swarmName: '',
    description: '',
    deviceCount: 10,
    location: '',
    autoSelectDevices: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 AddSwarm: Fetching project ${id}...`);
        const projectData = await getProject(id);
        console.log('✅ AddSwarm: Project data:', projectData);
        
        if (!projectData) {
          setError('Project not found.');
          return;
        }

        setProject(projectData);
        
        // Check if project is approved
        if (projectData.status !== 'approved') {
          setError('Project must be approved before adding swarms.');
          return;
        }

        // Load available devices info
        await loadDevicesInfo();
        
      } catch (err) {
        console.error('❌ AddSwarm: Error fetching data:', err);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setError('Invalid project ID.');
      setLoading(false);
    }
  }, [id]);

  const loadDevicesInfo = async () => {
    try {
      setLoadingDevices(true);
      console.log('🔍 Loading devices info...');
      
      const info = await getAvailableDevicesInfo();
      setDevicesInfo(info);
      
      console.log('✅ Devices info loaded:', info.summary);
    } catch (error) {
      console.error('❌ Error loading devices info:', error);
      setDevicesInfo({ devices: [], summary: {} });
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'deviceCount') {
      const numValue = parseInt(value, 10);
      setFormData(prev => ({ 
        ...prev, 
        [name]: isNaN(numValue) || numValue < 1 ? 1 : numValue 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.swarmName || !formData.swarmName.trim()) {
      newErrors.swarmName = 'Swarm name is required';
    } else if (formData.swarmName.trim().length < 3) {
      newErrors.swarmName = 'Swarm name must be at least 3 characters';
    } else if (formData.swarmName.trim().length > 100) {
      newErrors.swarmName = 'Swarm name must be less than 100 characters';
    }
    
    if (!formData.deviceCount) {
      newErrors.deviceCount = 'Number of devices is required';
    } else if (formData.deviceCount < 1) {
      newErrors.deviceCount = 'Number of devices must be at least 1';
    } else if (formData.deviceCount > 1000) {
      newErrors.deviceCount = 'Number of devices cannot exceed 1000';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.autoSelectDevices && formData.deviceCount > devicesInfo.summary.totalAvailable) {
      newErrors.deviceCount = `Only ${devicesInfo.summary.totalAvailable} devices are available`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      console.log('❌ AddSwarm: Validation failed:', errors);
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      console.log('🔍 AddSwarm: Submitting swarm request...');
      console.log('📝 AddSwarm: Form data:', formData);
      
      const result = await requestSwarmSimple(id, {
        swarmName: formData.swarmName.trim(),
        description: formData.description.trim(),
        deviceCount: formData.deviceCount,
        location: formData.location.trim(),
        autoSelectDevices: formData.autoSelectDevices
      });
      
      console.log('✅ AddSwarm: Swarm request result:', result);
      
      if (result && (result.success !== false)) {
        const devicesMessage = formData.autoSelectDevices 
          ? `${result.data?.summary?.devicesAssigned || 0} devices were automatically assigned.`
          : 'No devices were pre-assigned.';
          
        navigate(`/projects/${id}`, { 
          state: { 
            successMessage: `Swarm "${formData.swarmName}" requested successfully! ${devicesMessage} It will be reviewed and assigned soon.`
          } 
        });
      } else {
        throw new Error('Failed to submit swarm request');
      }
    } catch (error) {
      console.error('❌ AddSwarm: Error requesting swarm:', error);
      setSubmitError(error.message || 'Failed to request swarm. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || submitting) {
    return <LoadingSpinner message={loading ? "Loading project details..." : "Submitting swarm request..."} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <ErrorMessage error={error} />
        <div className="mt-6">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => navigate(`/projects/${id}`)}
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <ErrorMessage error="Project not found." />
        <div className="mt-6">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Request Swarm for Project
        </h1>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Project:</span> {project.name}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {project.description || 'No description provided'}
          </p>
        </div>

        {/* Devices Info */}
        {!loadingDevices && devicesInfo.summary.totalAvailable !== undefined && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">Available Devices</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {devicesInfo.summary.availableDevices || 0}
                </span>
                <p className="text-green-700 dark:text-green-300">Available</p>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {devicesInfo.summary.totalDevices || 0}
                </span>
                <p className="text-green-700 dark:text-green-300">Total</p>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  {devicesInfo.summary.assignedDevices || 0}
                </span>
                <p className="text-yellow-700 dark:text-yellow-300">Assigned</p>
              </div>
              <div>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {devicesInfo.summary.offlineDevices || 0}
                </span>
                <p className="text-red-700 dark:text-red-300">Offline</p>
              </div>
            </div>
          </div>
        )}
        
        {submitError && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{submitError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Swarm Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="swarmName">
                Swarm Name *
              </label>
              <input
                type="text"
                id="swarmName"
                name="swarmName"
                value={formData.swarmName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.swarmName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="e.g., Traffic Sensors West Wing"
                maxLength={100}
              />
              {errors.swarmName && (
                <p className="text-red-500 text-sm mt-1">{errors.swarmName}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="deviceCount">
                Maximum Devices *
              </label>
              <input
                type="number"
                id="deviceCount"
                name="deviceCount"
                value={formData.deviceCount}
                onChange={handleChange}
                min="1"
                max="1000"
                className={`w-full px-3 py-2 border ${errors.deviceCount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {errors.deviceCount && (
                <p className="text-red-500 text-sm mt-1">{errors.deviceCount}</p>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Available: {devicesInfo.summary.availableDevices || 0} devices
              </p>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="location">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="e.g., Building A, Floor 2, Downtown Area"
              maxLength={200}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Describe the purpose and functionality of this swarm"
              rows="3"
              maxLength={500}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Auto-assign devices option */}
          <div className="border-t pt-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="autoSelectDevices"
                name="autoSelectDevices"
                checked={formData.autoSelectDevices}
                onChange={handleChange}
                className="mt-1 rounded text-blue-600"
                disabled={devicesInfo.summary.availableDevices === 0}
              />
              <div className="flex-1">
                <label htmlFor="autoSelectDevices" className="block text-gray-700 dark:text-gray-300 font-medium">
                  Auto-assign available devices
                </label>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {devicesInfo.summary.availableDevices > 0 
                    ? `Automatically assign up to ${Math.min(formData.deviceCount, devicesInfo.summary.availableDevices)} available devices to this swarm.`
                    : 'No devices available for auto-assignment.'
                  }
                </p>
                {formData.autoSelectDevices && devicesInfo.summary.availableDevices > 0 && (
                  <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                    ✓ {Math.min(formData.deviceCount, devicesInfo.summary.availableDevices)} devices will be pre-assigned
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-end pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Request Swarm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSwarm;