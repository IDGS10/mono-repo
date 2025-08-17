import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../services/projectService';
import { getProjectSwarms } from '../services/swarmService';
import SwarmCard from '../components/SwarmCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [swarms, setSwarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const projectData = await getProject(id);
        setProject(projectData);
        
        const swarmsData = await getProjectSwarms(id);
        setSwarms(swarmsData);
        
        setError(null);
      } catch (err) {
        setError('Failed to load project details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading project details..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => window.location.reload()} />;
  }

  if (!project) {
    return <ErrorMessage error="Project not found" />;
  }

  const statusColors = {
    pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  };
  
  const statusDisplay = {
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 md:mb-0">
            {project.name}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
            {statusDisplay[project.status] || project.status}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {project.description || 'No description provided'}

        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {project.location && (
            <div>
              <span className="text-gray-500 dark:text-gray-500">Location: </span>
              <span className="text-gray-700 dark:text-gray-300">{project.location}</span>
            </div>
          )}
          
          {project.startDate && (
            <div>
              <span className="text-gray-500 dark:text-gray-500">Start Date: </span>
              <span className="text-gray-700 dark:text-gray-300">{project.startDate}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Swarms Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Project Swarms
          </h2>
          
          {project.status === 'approved' && (
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              onClick={() => navigate(`/projects/${id}/add-swarm`)}
            >
              Add Swarm
            </button>
          )}
        </div>
        
        {swarms.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {project.status === 'approved' 
                ? 'No swarms added to this project yet. Add a swarm to get started.'
                : 'No swarms available. Project must be approved before adding swarms.'}
            </p>
            
            {project.status === 'approved' && (
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                onClick={() => navigate(`/projects/${id}/add-swarm`)}
              >
                Add Swarm
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {swarms.map(swarm => (
              <SwarmCard key={swarm.id} swarm={swarm} />
            ))}
          </div>
        )}
      </div>
      
      {/* Back Button */}
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
};

export default ProjectDetail;
