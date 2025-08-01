import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getProjects();
        
        // POLÍTICA DE SEGURIDAD: getProjects ahora retorna objeto con paginación
        if (response.projects) {
          setProjects(response.projects); // Array de proyectos
          setPagination(response.pagination); // Info de paginación
        } else {
          // Fallback para compatibilidad
          setProjects(Array.isArray(response) ? response : []);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load projects. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on search and status
  const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            My Projects ({filteredProjects.length})
            {pagination && pagination.totalItems > filteredProjects.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                of {pagination.totalItems} total
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage and monitor all your IoT projects in one place.
          </p>
          {pagination && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          
          <input
            type="text"
            placeholder="Search projects..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            onClick={() => navigate('/projects/create')}
          >
            Create New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {projects.length === 0 
              ? "No projects found. Create your first project to get started."
              : "No projects match your current filters."
            }
          </p>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            onClick={() => navigate('/projects/create')}
          >
            Create New Project
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          
          {/* Pagination Info */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {projects.length} of {pagination.totalItems} projects
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {pagination.currentPage}
                </span>
                <button
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectDashboard;