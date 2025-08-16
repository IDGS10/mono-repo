import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Building2, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader,
  ArrowRight,
  Clock
} from 'lucide-react';
import { API_CONFIG } from '../../../config/api.js';


const API_BASE = API_CONFIG.BASE_API || "http://localhost:3001/api";


const VerifyInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/invitations/verify/${token}`);
        
        if (response.ok) {
          const data = await response.json();
          setInvitation(data.invitation);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Invitación no válida o expirada');
        }
      } catch (err) {
        setError('Error de conexión. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setError('Token de invitación no encontrado');
      setLoading(false);
    }
  }, [token]);

  const handleAcceptInvitation = () => {
    navigate(`/invitations/accept/${token}`);
  };

  const handleDeclineInvitation = () => {
    alert('Declinar proyecto pendiente en lo que integramos todos');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin h-8 w-8 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <XCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Invitación No Válida
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Posibles razones:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• La invitación ya expiró</li>
              <li>• El enlace ya fue usado</li>
              <li>• La invitación fue revocada</li>
              <li>• El enlace está dañado</li>
            </ul>
          </div>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Intentar Nuevamente
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar si la invitación está próxima a expirar
  const expirationDate = new Date(invitation.expires_at);
  const now = new Date();
  const timeUntilExpiration = expirationDate - now;
  const hoursUntilExpiration = Math.floor(timeUntilExpiration / (1000 * 60 * 60));
  const isExpiringSoon = hoursUntilExpiration <= 24 && hoursUntilExpiration > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        {/* Header de éxito */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ¡Invitación Válida!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Has sido invitado a formar parte de una organización
          </p>
        </div>

        {/* Información de la invitación */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            {/* Organización */}
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organización</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {invitation.organization_name}
                </p>
              </div>
            </div>

            {/* Datos del invitado */}
            <div className="flex items-center gap-3">
              <User size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Invitado como</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {invitation.invited_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {invitation.invited_email} • Rol: {invitation.invited_role}
                </p>
              </div>
            </div>

            {/* Expiración */}
            <div className="flex items-center gap-3">
              <Calendar size={20} className={`flex-shrink-0 ${
                isExpiringSoon ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
              }`} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Válida hasta</p>
                <p className={`font-semibold ${
                  isExpiringSoon ? 'text-orange-800 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {expirationDate.toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {isExpiringSoon && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={14} className="text-orange-600 dark:text-orange-400" />
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Expira en {hoursUntilExpiration} hora{hoursUntilExpiration !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de expiración próxima */}
        {isExpiringSoon && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-orange-600 dark:text-orange-400" />
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                ¡Atención! Esta invitación expira pronto
              </p>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              Te recomendamos aceptarla ahora para no perder el acceso a la organización.
            </p>
          </div>
        )}

        {/* Descripción de beneficios */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Al aceptar esta invitación podrás:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Acceder al dashboard de la organización</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Gestionar proyectos de monitoreo ambiental</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Colaborar con otros miembros del equipo</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Acceder a reportes y análisis de datos IoT</span>
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={handleAcceptInvitation}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={20} />
            Aceptar Invitación
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={handleDeclineInvitation}
            className="w-full px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Declinar Invitación
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Si no esperabas esta invitación o crees que es un error, puedes declinarla de forma segura.
            También puedes contactar al administrador de la organización para más información.
          </p>
        </div>

        {/* Link para ir al login si ya tiene cuenta */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline font-medium"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyInvitation;