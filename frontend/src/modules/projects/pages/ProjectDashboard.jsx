import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProjects } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);

  // CORRECCIÓN: Mostrar mensaje de éxito si viene del state de navegación
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Limpiar el state para evitar que se muestre al refrescar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Dashboard: Fetching projects...');
        const response = await getProjects();
        
        console.log('✅ Dashboard: Raw response:', response);

        // CORRECCIÓN: Manejar diferentes estructuras de respuesta
        if (response && response.projects) {
          setProjects(response.projects);
          setPagination(response.pagination);
          console.log('✅ Dashboard: Projects set:', response.projects.length);
        } else if (Array.isArray(response)) {
          setProjects(response);
          console.log('✅ Dashboard: Projects set (array):', response.length);
        } else {
          console.warn('⚠️ Dashboard: Unexpected response structure:', response);
          setProjects([]);
        }
        
      } catch (err) {
        console.error('❌ Dashboard: Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
        setProjects([]); // Asegurar que projects sea un array
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // CORRECCIÓN: Filtrado seguro de proyectos
  const filteredProjects = React.useMemo(() => {
    if (!Array.isArray(projects)) {
      console.warn('⚠️ Projects is not an array:', projects);
      return [];
    }

    return projects.filter(project => {
      if (!project) return false;
      
      const matchesSearch = !search || 
        (project.name && project.name.toLowerCase().includes(search.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(search.toLowerCase()));
        
      const matchesStatus = !statusFilter || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  // Retry function
  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await getProjects();
      if (response && response.projects) {
        setProjects(response.projects);
        setPagination(response.pagination);
      } else if (Array.isArray(response)) {
        setProjects(response);
      }
    } catch (err) {
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-lg">
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

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
          {projects.length === 0 ? (
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              onClick={() => navigate('/projects/create')}
            >
              Create New Project
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id_project || project.id} 
                project={project} 
              />
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
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {pagination.currentPage}
                </span>
                <button
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Debug info en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p>Total projects: {projects.length}</p>
          <p>Filtered projects: {filteredProjects.length}</p>
          <p>Has pagination: {pagination ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;