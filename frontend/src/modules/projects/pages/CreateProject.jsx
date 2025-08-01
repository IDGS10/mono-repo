import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      setSubmitError(null);
      
      const result = await createProject(formData);
      
      if (result.success) {
        // Navigate to the project dashboard with success message
        navigate('/projects', { 
          state: { 
            successMessage: 'Project request submitted successfully! It is pending approval.' 
          } 
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Creating project..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Create New Project
        </h1>
        
        {submitError && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg mb-6">
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="name">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
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
              placeholder="Enter project description"
              rows="4"
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="location">
              Coordinate Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="e.g., 40.7128,-74.0060"
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Enter coordinates in latitude,longitude format (optional)
            </p>
          </div>
          
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Submit Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;