import { useEffect, useState, useRef } from "react";
import { 
  Users, 
  Mail, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  UserPlus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from '../../../config/api.js';


const API_BASE = API_CONFIG.BASE_API || "http://localhost:3001/api";


const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'yellow', text: 'Pendiente', icon: Clock },
    accepted: { color: 'green', text: 'Aceptada', icon: CheckCircle },
    expired: { color: 'red', text: 'Expirada', icon: XCircle },
    revoked: { color: 'gray', text: 'Revocada', icon: XCircle }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const colorClasses = {
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colorClasses[config.color]}`}>
      <Icon size={12} />
      {config.text}
    </span>
  );
};

// Invitation modal component
const InvitationModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    invited_name: '',
    invited_email: '',
    invited_role: 'encargado'
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.invited_name.trim()) {
      newErrors.invited_name = 'El nombre es requerido';
    }

    if (!formData.invited_email.trim()) {
      newErrors.invited_email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.invited_email)) {
      newErrors.invited_email = 'El email debe tener un formato válido';
    }

    if (!formData.invited_role) {
      newErrors.invited_role = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        invited_name: '',
        invited_email: '',
        invited_role: 'encargado'
      });
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Invitar Nuevo Miembro
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Envía una invitación para unirse a tu organización
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              name="invited_name"
              value={formData.invited_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.invited_name 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Juan Pérez"
            />
            {errors.invited_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.invited_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="invited_email"
              value={formData.invited_email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.invited_email 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="juan@empresa.com"
            />
            {errors.invited_email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.invited_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rol *
            </label>
            <select
              name="invited_role"
              value={formData.invited_role}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.invited_role 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="encargado">Encargado</option>
              <option value="líder">Líder</option>
            </select>
            {errors.invited_role && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.invited_role}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Los líderes tienen más permisos que los encargados
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Enviar Invitación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invitation item component
const InvitationItem = ({ invitation, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const isExpired = new Date(invitation.expires_at) < new Date();
  const canResend = invitation.status === 'pending' && !isExpired;
  const canRevoke = invitation.status === 'pending';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Users size={18} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {invitation.invited_name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invitation.invited_email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Rol: {invitation.invited_role}</span>
            <span>•</span>
            <span>Enviada: {new Date(invitation.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Expira: {new Date(invitation.expires_at).toLocaleDateString()}</span>
            {isExpired && <span className="text-red-500">• ¡Expirada!</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={invitation.status} />
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-lg z-10"
              >
                {canResend && (
                  <button
                    onClick={() => {
                      onAction(invitation.id_invitation, 'resend');
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <RefreshCw size={14} className="inline mr-2" />
                    Reenviar
                  </button>
                )}
                {canRevoke && (
                  <button
                    onClick={() => {
                      onAction(invitation.id_invitation, 'revoke');
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm"
                  >
                    <XCircle size={14} className="inline mr-2" />
                    Revocar
                  </button>
                )}
                <button
                  onClick={() => {
                    onAction(invitation.id_invitation, 'delete');
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm"
                >
                  <Trash2 size={14} className="inline mr-2" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Members = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [filteredInvitations, setFilteredInvitations] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get organization dashboard to get basic info
      const dashboardResponse = await fetch(`${API_BASE}/organizations/dashboard`, {
        headers: getAuthHeaders()
      });
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        if (dashboardData.hasOrganization) {
          setOrganization(dashboardData.organization.organization);
          
          // Fetch invitations for this organization
          const invitationsResponse = await fetch(
            `${API_BASE}/invitations/organization/${dashboardData.organization.organization.id_organization}`,
            { headers: getAuthHeaders() }
          );
          
          if (invitationsResponse.ok) {
            const invitationsData = await invitationsResponse.json();
            setInvitations(invitationsData.invitations || []);
          }
        } else {
          navigate('/organizations');
        }
      } else {
        throw new Error('Error al cargar los datos');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Filter invitations
  useEffect(() => {
    let filtered = invitations;

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.invited_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invited_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter(inv => inv.invited_role === roleFilter);
    }

    setFilteredInvitations(filtered);
  }, [invitations, searchTerm, statusFilter, roleFilter]);

  const handleInviteSubmit = async (formData) => {
    if (!organization) return;

    setInviteLoading(true);
    try {
      const response = await fetch(`${API_BASE}/invitations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          organization_id: organization.id_organization
        })
      });

      if (response.ok) {
        setShowInviteModal(false);
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al enviar la invitación');
      }
    } catch (err) {
      alert('Error de conexión. Intenta nuevamente.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInvitationAction = async (invitationId, action) => {
    try {
      let response;
      
      switch (action) {
        case 'resend':
          response = await fetch(`${API_BASE}/invitations/${invitationId}/resend`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          break;
        case 'revoke':
          response = await fetch(`${API_BASE}/invitations/${invitationId}/revoke`, {
            method: 'PATCH',
            headers: getAuthHeaders()
          });
          break;
        case 'delete':
          response = await fetch(`${API_BASE}/invitations/${invitationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          break;
        default:
          return;
      }

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al realizar la acción');
      }
    } catch (err) {
      alert('Error de conexión. Intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando miembros...</p>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
  const expiredCount = invitations.filter(inv => inv.status === 'expired').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <button
          onClick={() => navigate('/organizations')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft size={20} />
          Volver al dashboard
        </button>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
              <Users size={32} className="text-blue-600 dark:text-blue-400" />
              Gestión de Miembros
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {organization?.name} • Invita y gestiona los miembros de tu organización
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <UserPlus size={16} />
            Invitar Miembro
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{invitations.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Invitaciones</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{pendingCount}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendientes</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{acceptedCount}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Aceptadas</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-800 dark:text-red-300">{expiredCount}</p>
            <p className="text-sm text-red-600 dark:text-red-400">Expiradas</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="accepted">Aceptadas</option>
            <option value="expired">Expiradas</option>
            <option value="revoked">Revocadas</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los roles</option>
            <option value="líder">Líder</option>
            <option value="encargado">Encargado</option>
          </select>
        </div>
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {filteredInvitations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Users size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {invitations.length === 0 ? 'No hay invitaciones' : 'No se encontraron invitaciones'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {invitations.length === 0 
                ? 'Comienza invitando miembros a tu organización'
                : 'Intenta cambiar los filtros de búsqueda'
              }
            </p>
            {invitations.length === 0 && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Invitar Primer Miembro
              </button>
            )}
          </div>
        ) : (
          filteredInvitations.map((invitation) => (
            <InvitationItem
              key={invitation.id_invitation}
              invitation={invitation}
              onAction={handleInvitationAction}
            />
          ))
        )}
      </div>

      {/* Invitation Modal */}
      <InvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleInviteSubmit}
        loading={inviteLoading}
      />
    </div>
  );
};

export default Members;