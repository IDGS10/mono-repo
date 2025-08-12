import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Clock,
  Thermometer,
  MoreVertical,
  RefreshCw,
  FileText,
  X
} from 'lucide-react';
import ProjectApprovalService from '../services/projectApprovalService';

const API_BASE = "http://localhost:3001/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const ReviewModal = ({ isOpen, onClose, onSubmit, action, projectName, loading }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (action === 'reject' && (!reviewNotes || reviewNotes.trim().length === 0)) {
      setError('Las notas de revisión son obligatorias para rechazar un proyecto');
      return;
    }
    
    onSubmit(reviewNotes.trim());
  };

  const handleClose = () => {
    setReviewNotes('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const isApprove = action === 'approve';
  const title = isApprove ? 'Aprobar Proyecto' : 'Rechazar Proyecto';
  const buttonText = isApprove ? 'Aprobar' : 'Rechazar';
  const buttonColor = isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Proyecto: <span className="font-medium">{projectName}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {isApprove 
                ? 'Agrega comentarios sobre la aprobación (opcional):'
                : 'Agrega las razones del rechazo (obligatorio):'
              }
            </p>
          </div>

          <div className="mb-4">
            <textarea
              value={reviewNotes}
              onChange={(e) => {
                setReviewNotes(e.target.value);
                setError('');
              }}
              placeholder={isApprove 
                ? 'Comentarios de aprobación...'
                : 'Razones del rechazo...'
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              rows={4}
              disabled={loading}
            />
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${buttonColor}`}
            >
              {loading ? 'Procesando...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuccessModal = ({ isOpen, onClose, success, message }) => {
  if (!isOpen) return null;

  const isSuccess = success;
  const title = isSuccess ? '¡Éxito!' : 'Error';
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';
  const bgColor = isSuccess ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mb-4`}>
            <Icon size={32} className={iconColor} />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

const parseProjectData = (projectData) => {
  try {
    if (typeof projectData === 'string') {
      return JSON.parse(projectData);
    }
    return projectData;
  } catch (error) {
    console.error('Error parsing project data:', error);
    return null;
  }
};

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'Pendiente',
    'approved': 'Aprobado',
    'rejected': 'Rechazado'
  };
  return statusTexts[status] || status;
};

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'yellow',
    'approved': 'green',
    'rejected': 'red'
  };
  return statusColors[status] || 'gray';
};

const getProjectSummary = (projectData) => {
  const data = parseProjectData(projectData);
  if (!data) return null;

  return {
    name: data.name || 'Sin nombre',
    description: data.description || 'Sin descripción',
    location: data.location || 'No especificada',
    duration: data.duration || 'No especificada',
    sensors: Array.isArray(data.sensors) ? data.sensors.join(', ') : 'No especificados',
    startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('es-MX') : 'No especificada'
  };
};

const ProjectApprovalCard = ({ approval, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const projectData = parseProjectData(approval.project_data);
  const summary = getProjectSummary(approval.project_data);
  const statusColor = getStatusColor(approval.status);
  const statusText = getStatusText(approval.status);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              {summary?.name || 'Sin nombre'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organización ID: {approval.organization_id} • Proyecto: {approval.temporal_project_id}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Temporal ID: {approval.temporal_id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
            statusColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
            statusColor === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {statusText}
          </span>
          
          {approval.status === 'pending' && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={() => {
                      onAction(approval.temporal_id, 'approve');
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400 text-sm"
                  >
                    <CheckCircle size={14} className="inline mr-2" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      onAction(approval.temporal_id, 'reject');
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm"
                  >
                    <XCircle size={14} className="inline mr-2" />
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {summary?.description || 'Sin descripción disponible'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin size={14} />
          <span>{summary?.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock size={14} />
          <span>{summary?.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Thermometer size={14} />
          <span>{summary?.sensors}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={14} />
          <span>Inicio: {summary?.startDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={14} />
          <span>Enviado: {formatDate(approval.created_at)}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
        >
          <Eye size={14} />
          {showDetails ? 'Ocultar' : 'Ver'} Detalles
        </button>
        
        {approval.status === 'pending' && (
          <>
            <button
              onClick={() => onAction(approval.temporal_id, 'approve')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg"
            >
              <CheckCircle size={14} />
              Aprobar
            </button>
            <button
              onClick={() => onAction(approval.temporal_id, 'reject')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg"
            >
              <XCircle size={14} />
              Rechazar
            </button>
          </>
        )}
      </div>

      {showDetails && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <FileText size={16} />
            Datos Completos del Proyecto
          </h4>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify(projectData, null, 2)}
          </pre>
          
          {approval.review_notes && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Notas de Revisión:</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{approval.review_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PendingOrganization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [filteredApprovals, setFilteredApprovals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/project-approvals`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos obtenidos:', data);
        setApprovals(data.approvals || []);
      } else {
        throw new Error('Error al cargar los proyectos');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = approvals;

    if (searchTerm) {
      filtered = ProjectApprovalService.filterBySearch(filtered, searchTerm);
    }

    if (statusFilter) {
      filtered = ProjectApprovalService.filterByStatus(filtered, statusFilter);
    }

    setFilteredApprovals(filtered);
  }, [approvals, searchTerm, statusFilter]);

  const handleProjectAction = (temporalId, action) => {
    const approval = approvals.find(a => a.temporal_id === temporalId);
    const projectData = ProjectApprovalService.parseProjectData(approval?.project_data);
    
    setCurrentProject({
      temporalId,
      name: projectData?.name || 'Sin nombre'
    });
    setCurrentAction(action);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (reviewNotes) => {
    if (!currentProject || !currentAction) return;
    
    try {
      setActionLoading(true);
      
      console.log('🔍 Acción:', currentAction, 'para temporal_id:', currentProject.temporalId);
      
      if (currentAction === 'approve') {
        await ProjectApprovalService.approve(currentProject.temporalId, reviewNotes);
        setSuccessMessage('¡Proyecto aprobado exitosamente!');
        setIsSuccess(true);
      } else if (currentAction === 'reject') {
        await ProjectApprovalService.reject(currentProject.temporalId, reviewNotes);
        setSuccessMessage('Proyecto rechazado correctamente.');
        setIsSuccess(true);
      }
      
      fetchData();
      setShowReviewModal(false);
      setShowSuccessModal(true);
      setCurrentProject(null);
      setCurrentAction(null);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setSuccessMessage(error.message || 'Error de conexión. Intenta nuevamente.');
      setIsSuccess(false);
      setShowReviewModal(false);
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const stats = ProjectApprovalService.getStats(approvals);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft size={20} />
          Volver al dashboard
        </button>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
              <Building2 size={32} className="text-blue-600 dark:text-blue-400" />
              Proyectos Pendientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Gestiona las solicitudes de aprobación de proyectos de organizaciones
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Proyectos</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{stats.pending}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendientes</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{stats.approved}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Aprobados</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-800 dark:text-red-300">{stats.rejected}</p>
            <p className="text-sm text-red-600 dark:text-red-400">Rechazados</p>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de proyecto, descripción, organización..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Building2 size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {approvals.length === 0 ? 'No hay proyectos' : 'No se encontraron proyectos'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {approvals.length === 0 
                ? 'Aún no hay proyectos enviados por las organizaciones'
                : 'Intenta cambiar los filtros de búsqueda'
              }
            </p>
          </div>
        ) : (
          filteredApprovals.map((approval) => (
            <ProjectApprovalCard
              key={approval.temporal_id}
              approval={approval}
              onAction={handleProjectAction}
            />
          ))
        )}
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setCurrentProject(null);
          setCurrentAction(null);
        }}
        onSubmit={handleReviewSubmit}
        action={currentAction}
        projectName={currentProject?.name}
        loading={actionLoading}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        success={isSuccess}
        message={successMessage}
      />
    </div>
  );
};

export default PendingOrganization;