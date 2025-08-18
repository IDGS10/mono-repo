import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../../../config/api.js';

import { 
  Mail, 
  Building2, 
  User, 
  Key, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

const API_BASE = API_CONFIG.BASE_API || "http://localhost:8200/api";


const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/invitations/verify/${token}`);
        
        if (response.ok) {
          const data = await response.json();
          setInvitation(data.invitation);
          
          // data invitation
          setFormData(prev => ({
            ...prev,
            name: data.invitation.invited_name,
            email: data.invitation.invited_email
          }));
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar errores al escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El formato del email no es válido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const response = await fetch(`${API_BASE}/invitations/accept/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userData: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show message ok
        alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
        navigate('/login'); 
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear la cuenta');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
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
            Error con la Invitación
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Mail size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Aceptar Invitación
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea tu cuenta para unirte a la organización
          </p>
        </div>

        {/* Invitation Info */}
        {invitation && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {invitation.organization_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rol: {invitation.invited_role}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Expira: {new Date(invitation.expires_at).toLocaleDateString('es-MX')}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre completo *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  formErrors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Tu nombre completo"
              />
            </div>
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-700 text-gray-400 ${
                  formErrors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="tu@email.com"
                readOnly
              />
            </div>
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña *
            </label>
            <div className="relative">
              <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  formErrors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>

          {/* Pass Confirm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar contraseña *
            </label>
            <div className="relative">
              <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+52 123 456 7890"
            />
          </div>

          {/* Conditions and terms */}
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Acepto los{' '}
                <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                  política de privacidad
                </a>
              </span>
            </label>
            {formErrors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">{formErrors.acceptTerms}</p>
            )}
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin h-4 w-4" />
                Creando cuenta...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Crear Cuenta y Unirse
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;