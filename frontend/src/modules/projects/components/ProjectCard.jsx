import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{project.name}</h2>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
          {statusDisplay[project.status] || project.status}
        </span>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {project.description || 'No description provided'}
      </p>

      {project.location && (
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          Location: <span className="text-gray-700 dark:text-gray-300">{project.location}</span>
        </p>
      )}

      {project.startDate && (
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          Start date: <span className="text-gray-700 dark:text-gray-300">{project.startDate}</span>
        </p>
      )}

      <button
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors w-full"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        View Details
      </button>
    </div>
  );
};

export default ProjectCard;