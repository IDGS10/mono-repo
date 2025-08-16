import { useEffect, useState, useRef } from "react";
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical,
  Plus,
  Edit,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from '../../../config/api.js';


const API_BASE = API_CONFIG.BASE_API || "http://localhost:3001/api";


// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Component for when user has no organization
const NoOrganizationView = ({ onCreateOrganization }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
      <div className="mb-6">
        <Building2 size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          No tienes una organización
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Crea una nueva organización para comenzar a gestionar tu equipo y proyectos.
        </p>
      </div>
      
      <button
        onClick={onCreateOrganization}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Crear Nueva Organización
      </button>
    </div>
  </div>
);

// Component for organization stats card
const StatsCard = ({ icon: Icon, title, value, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

// Component for invitation item
const InvitationItem = ({ invitation, onAction }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div className="flex-1">
      <h4 className="font-medium text-gray-900 dark:text-gray-100">
        {invitation.invited_name}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {invitation.invited_email} • {invitation.invited_role}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Enviada: {new Date(invitation.created_at).toLocaleDateString()}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
        Pendiente
      </span>
      <button
        onClick={() => onAction(invitation.id_invitation, 'revoke')}
        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        title="Revocar invitación"
      >
        <XCircle size={16} />
      </button>
    </div>
  </div>
);

// Component for project approval item
const ProjectItem = ({ project, onAction }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div className="flex-1">
      <h4 className="font-medium text-gray-900 dark:text-gray-100">
        {project.project_data?.name || project.temporal_project_id}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {project.project_data?.description || 'Sin descripción'}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Solicitado: {new Date(project.created_at).toLocaleDateString()}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onAction(project.temporal_id, 'approve')}
        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full"
        title="Aprobar proyecto"
      >
        <CheckCircle size={16} />
      </button>
      <button
        onClick={() => onAction(project.temporal_id, 'reject')}
        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
        title="Rechazar proyecto"
      >
        <XCircle size={16} />
      </button>
      <button
        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
        title="Ver detalles"
      >
        <Eye size={16} />
      </button>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [hasOrganization, setHasOrganization] = useState(false);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/organizations/dashboard`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al cargar el dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
      setHasOrganization(data.hasOrganization);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateOrganization = () => {
    navigate('/organizations/create');
  };

  const handleEditOrganization = () => {
    if (dashboardData?.organization?.organization?.id_organization) {
      navigate(`/organizations/${dashboardData.organization.organization.id_organization}/edit`);
    }
  };

  const handleInvitationAction = async (invitationId, action) => {
    try {
      const response = await fetch(`${API_BASE}/invitations/${invitationId}/${action}`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        fetchDashboard(); // Refresh data
      }
    } catch (err) {
      console.error('Error handling invitation:', err);
    }
  };

  const handleProjectAction = async (projectId, action) => {
    try {
      const response = await fetch(`${API_BASE}/projects/approvals/${projectId}/${action}`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        fetchDashboard(); // Refresh data
      }
    } catch (err) {
      console.error('Error handling project:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
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
            onClick={fetchDashboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // If user doesn't have organization
  if (!hasOrganization) {
    return <NoOrganizationView onCreateOrganization={handleCreateOrganization} />;
  }

  const { organization, stats, pending_invitations, pending_projects } = dashboardData.organization;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
              <Building2 size={32} className="text-blue-600 dark:text-blue-400" />
              {organization.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Dashboard de Organización • {organization.organization_type_name}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEditOrganization}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Edit size={16} />
              Editar Información
            </button>
            <button
              onClick={() => navigate('/organizations/members')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Users size={16} />
              Gestionar Miembros
            </button>
          </div>
        </div>

        {/* Organization Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {organization.organization_email}
            </span>
          </div>
          {organization.phone_number && (
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {organization.phone_number}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Creada: {new Date(organization.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${organization.isactive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {organization.isactive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Users}
          title="Invitaciones Pendientes"
          value={stats.pending_invitations}
          color="yellow"
        />
        <StatsCard
          icon={Clock}
          title="Proyectos Pendientes"
          value={stats.pending_projects}
          color="blue"
        />
        <StatsCard
          icon={CheckCircle}
          title="Miembros Activos"
          value="0" // This would need to be added to the backend
          color="green"
        />
        <StatsCard
          icon={Building2}
          title="Proyectos Activos"
          value="0" // This would need to be added to the backend
          color="green"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Invitations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Mail size={20} className="text-blue-600 dark:text-blue-400" />
              Invitaciones Pendientes ({pending_invitations.length})
            </h2>
            <button
              onClick={() => navigate('/organizations/members')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todas
            </button>
          </div>
          
          <div className="space-y-3">
            {pending_invitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No hay invitaciones pendientes
                </p>
                <button
                  onClick={() => navigate('/organizations/members')}
                  className="mt-3 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Invitar nuevos miembros
                </button>
              </div>
            ) : (
              pending_invitations.map((invitation) => (
                <InvitationItem
                  key={invitation.id_invitation}
                  invitation={invitation}
                  onAction={handleInvitationAction}
                />
              ))
            )}
          </div>
        </div>

        {/* Pending Project Approvals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              Proyectos Pendientes ({pending_projects.length})
            </h2>
            <button
              onClick={() => navigate('/organizations/projects')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todos
            </button>
          </div>
          
          <div className="space-y-3">
            {pending_projects.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No hay proyectos pendientes de aprobación
                </p>
              </div>
            ) : (
              pending_projects.map((project) => (
                <ProjectItem
                  key={project.temporal_id}
                  project={project}
                  onAction={handleProjectAction}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;