import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../services/projectService';
import { requestSwarm } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const AddSwarm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({
    swarmName: '',
    description: '',
    deviceCount: 10
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
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
        }
        
      } catch (err) {
        console.error('❌ AddSwarm: Error fetching project:', err);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    } else {
      setError('Invalid project ID.');
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric input for deviceCount
    if (name === 'deviceCount') {
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
      
      const result = await requestSwarm(id, {
        swarmName: formData.swarmName.trim(),
        description: formData.description.trim(),
        deviceCount: formData.deviceCount
      });
      
      console.log('✅ AddSwarm: Swarm request result:', result);
      
      if (result && (result.success !== false)) {
        // Navigate back to project detail with success message
        navigate(`/projects/${id}`, { 
          state: { 
            successMessage: 'Swarm request submitted successfully! It will be reviewed and assigned soon.' 
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

  // Show loading spinner while fetching project or submitting
  if (loading || submitting) {
    return <LoadingSpinner message={loading ? "Loading project details..." : "Submitting swarm request..."} />;
  }

  // Show error if project fetch failed or project is not approved
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

  // Show error if no project found
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
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Add Swarm to Project
        </h1>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Project:</span> {project.name}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {project.description || 'No description provided'}
          </p>
        </div>
        
        {submitError && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{submitError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="swarmName">
              Swarm Name *
            </label>
            <input
              type="text"
              id="swarmName"
              name="swarmName"
              value={formData.swarmName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.swarmName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              placeholder="Enter swarm name (e.g., Traffic Sensors West Wing)"
              maxLength={100}
            />
            {errors.swarmName && (
              <p className="text-red-500 text-sm mt-1">{errors.swarmName}</p>
            )}
          </div>
          
          <div className="mb-4">
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
              rows="4"
              maxLength={500}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="deviceCount">
              Number of Devices Needed *
            </label>
            <input
              type="number"
              id="deviceCount"
              name="deviceCount"
              value={formData.deviceCount}
              onChange={handleChange}
              min="1"
              max="1000"
              className={`w-full px-3 py-2 border ${errors.deviceCount ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            />
            {errors.deviceCount && (
              <p className="text-red-500 text-sm mt-1">{errors.deviceCount}</p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Specify how many devices you need for this swarm (1-1000)
            </p>
          </div>
          
          <div className="flex gap-4 justify-end">
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
              {submitting ? 'Submitting...' : 'Submit Swarm Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSwarm;