import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowLeft, Save, Upload, X } from "lucide-react";
import OrganizationService from "../services/organizationService";

const CreateOrganization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organization_type_id: '',
    organization_email: '',
    phone_number: '',
    logo_url: ''
  });

  // Fetch organization types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await OrganizationService.getTypes();
        setOrganizationTypes(types);
      } catch (err) {
        console.error('Error loading organization types:', err);
      }
    };

    fetchTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.organization_email.trim()) {
      newErrors.organization_email = 'El email institucional es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organization_email)) {
      newErrors.organization_email = 'El email debe tener un formato válido';
    }

    if (!formData.organization_type_id) {
      newErrors.organization_type_id = 'El tipo de organización es requerido';
    }

    if (formData.phone_number && !/^[\+]?[0-9\-\(\)\s]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'El formato del teléfono no es válido';
    }

    if (formData.logo_url && !/^https?:\/\/.*\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(formData.logo_url)) {
      newErrors.logo_url = 'La URL del logo debe ser válida y apuntar a una imagen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await OrganizationService.create(formData);
      navigate('/organizations');
    } catch (err) {
      console.error('Error creating organization:', err);
      
      // Handle different types of errors
      if (err.response?.status === 409) {
        setErrors({ organization_email: 'El email institucional ya está registrado' });
      } else if (err.response?.data?.error) {
        setErrors({ submit: err.response.data.error });
      } else {
        setErrors({ submit: 'Error de conexión. Intenta nuevamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/organizations')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft size={20} />
            Volver al dashboard
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
              <Building2 size={28} className="text-blue-600 dark:text-blue-400" />
              Crear Nueva Organización
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete la información básica de su organización para comenzar.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Organización *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Nombre de su organización"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Organization Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Organización *
              </label>
              <select
                name="organization_type_id"
                value={formData.organization_type_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.organization_type_id 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Seleccione un tipo</option>
                {organizationTypes.map((type) => (
                  <option key={type.id_type} value={type.id_type}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.organization_type_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.organization_type_id}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Institucional *
              </label>
              <input
                type="email"
                name="organization_email"
                value={formData.organization_email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.organization_email 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="contacto@organizacion.com"
              />
              {errors.organization_email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.organization_email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono (Opcional)
              </label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.phone_number 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="+52 123 456 7890"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone_number}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción (Opcional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción de la organización"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL del Logo (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleInputChange}
                  className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.logo_url 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="https://sitio.com/logo.png"
                />
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                    className="px-3 py-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {errors.logo_url && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.logo_url}</p>
              )}
              {formData.logo_url && (
                <div className="mt-2">
                  <img
                    src={formData.logo_url}
                    alt="Vista previa del logo"
                    className="h-16 w-16 object-contain rounded border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      setErrors(prev => ({
                        ...prev,
                        logo_url: 'No se pudo cargar la imagen desde esta URL'
                      }));
                    }}
                    onLoad={() => {
                      if (errors.logo_url) {
                        setErrors(prev => ({
                          ...prev,
                          logo_url: null
                        }));
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Crear Organización
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Información importante
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Una vez creada la organización, podrás invitar miembros a tu equipo</li>
            <li>• El email institucional debe ser único y será usado para comunicaciones oficiales</li>
            <li>• Puedes editar toda la información después de crear la organización</li>
            <li>• Solo los propietarios pueden crear organizaciones</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganization;