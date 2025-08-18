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
        const projectData = await getProject(id);
        setProject(projectData);
        
        // Check if project is approved
        if (projectData.status !== 'approved') {
          setError('Project must be approved before adding swarms.');
        }
        
      } catch (err) {
        setError('Failed to load project details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric input for deviceCount
    if (name === 'deviceCount') {
      const numValue = parseInt(value, 10);
      setFormData(prev => ({ 
        ...prev, 
        [name]: isNaN(numValue) ? '' : numValue 
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
    
    if (!formData.swarmName.trim()) {
      newErrors.swarmName = 'Swarm name is required';
    }
    
    if (!formData.deviceCount) {
      newErrors.deviceCount = 'Number of devices is required';
    } else if (formData.deviceCount < 1) {
      newErrors.deviceCount = 'Number of devices must be at least 1';
    } else if (formData.deviceCount > 1000) {
      newErrors.deviceCount = 'Number of devices cannot exceed 1000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const result = await requestSwarm(id, {
        swarmName: formData.swarmName,
        description: formData.description,
        deviceCount: formData.deviceCount
      });
      
      if (result.success) {
        // Navigate back to project detail with success message
        navigate(`/projects/${id}`, { 
          state: { 
            successMessage: 'Swarm request submitted successfully!' 
          } 
        });
      }
    } catch (error) {
      console.error('Error requesting swarm:', error);
      setSubmitError('Failed to request swarm. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading project details..." />;
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

  if (submitting) {
    return <LoadingSpinner message="Submitting swarm request..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Add Swarm to Project
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Project: {project?.name}
        </p>
        
        {submitError && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg mb-6">
            {submitError}
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
              placeholder="Enter swarm name"
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
              placeholder="Enter swarm description"
              rows="4"
            ></textarea>
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Submit Swarm Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSwarm;