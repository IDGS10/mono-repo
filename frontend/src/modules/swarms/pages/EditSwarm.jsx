import { useEffect, useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import DeviceListItem from '../components/DeviceListItem'
import ConfirmationModal from '../components/ConfirmationModal'
import SuccessToast from '../components/SuccessToast'
import Breadcrumb from '../components/Breadcrumb'

// Mock data for available devices (not assigned to any swarm)
const mockAvailableDevices = [
  {
    id: 'ESP32-008',
    name: 'Motion Sensor Alpha',
    type: 'Motion Detector',
    status: 'online',
    batteryLevel: 78,
    wifiSignal: -55,
  },
  {
    id: 'ESP32-009',
    name: 'Air Quality Monitor',
    type: 'Environmental Sensor',
    status: 'online',
    batteryLevel: 65,
    wifiSignal: -42,
  },
  {
    id: 'ESP32-010',
    name: 'Light Sensor Beta',
    type: 'Light Detector',
    status: 'offline',
    batteryLevel: 34,
    wifiSignal: -72,
  },
  {
    id: 'ESP32-011',
    name: 'Vibration Monitor',
    type: 'Vibration Sensor',
    status: 'online',
    batteryLevel: 89,
    wifiSignal: -48,
  },
  {
    id: 'ESP32-012',
    name: 'Sound Level Meter',
    type: 'Audio Sensor',
    status: 'error',
    batteryLevel: 12,
    wifiSignal: -85,
  },
]

// Mock swarm data (same as SwarmDetail)
const mockSwarmDetails = {
  1: {
    id: 1,
    name: 'Alpha Swarm',
    description:
      'Monitoreo de temperatura y humedad en invernaderos automatizados para optimizar condiciones de cultivo.',
    status: 'active',
    maxDevices: 10,
    createdAt: '2024-06-01',
    requestedBy: 'Juan Pérez',
    devices: [
      {
        id: 'ESP32-001',
        name: 'Temperature Sensor Alpha',
        type: 'Environmental Sensor',
        status: 'online',
        batteryLevel: 87,
        wifiSignal: -45,
      },
      {
        id: 'ESP32-002',
        name: 'Humidity Monitor Beta',
        type: 'Environmental Sensor',
        status: 'online',
        batteryLevel: 92,
        wifiSignal: -52,
      },
      {
        id: 'ESP32-003',
        name: 'Pressure Gauge Gamma',
        type: 'Pressure Sensor',
        status: 'offline',
        batteryLevel: 23,
        wifiSignal: -68,
      },
    ],
  },
}

// Simulate API calls
const fetchSwarmForEdit = async (swarmId) => {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const swarm = mockSwarmDetails[swarmId]
      if (swarm) {
        resolve(swarm)
      } else {
        reject(new Error('Swarm not found'))
      }
    }, 800)
  )
}

const fetchAvailableDevices = async () => {
  return new Promise((resolve) =>
    setTimeout(() => resolve(mockAvailableDevices), 600)
  )
}

const saveSwarmChanges = async (swarmData) => {
  return new Promise((resolve) =>
    setTimeout(() => {
      console.log('Saving swarm changes:', swarmData)
      resolve({ success: true })
    }, 1500)
  )
}

const deleteSwarm = async (swarmId) => {
  return new Promise((resolve) =>
    setTimeout(() => {
      console.log('Deleting swarm:', swarmId)
      resolve({ success: true })
    }, 1000)
  )
}

export default function EditSwarm() {
  const [currentView, setCurrentView] = useState('edit') // "catalog", "detail", "edit"
  const [selectedSwarmId, setSelectedSwarmId] = useState(1) // Default for demo
  const [swarm, setSwarm] = useState(null)
  const [availableDevices, setAvailableDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxDevices: 10,
    devices: [],
  })

  // Filters
  const [availableFilter, setAvailableFilter] = useState('')
  const [availableTypeFilter, setAvailableTypeFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')

  // Validation and confirmation
  const [validationErrors, setValidationErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load swarm data and available devices
  useEffect(() => {
    if (currentView === 'edit' && selectedSwarmId) {
      setLoading(true)
      setError(false)

      Promise.all([fetchSwarmForEdit(selectedSwarmId), fetchAvailableDevices()])
        .then(([swarmData, devicesData]) => {
          setSwarm(swarmData)
          setAvailableDevices(devicesData)
          setFormData({
            name: swarmData.name,
            description: swarmData.description,
            maxDevices: swarmData.maxDevices,
            devices: [...swarmData.devices],
          })
          setLoading(false)
        })
        .catch(() => {
          setError(true)
          setLoading(false)
        })
    }
  }, [currentView, selectedSwarmId])

  // Real-time validation
  useEffect(() => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido'
    }

    if (formData.maxDevices < formData.devices.length) {
      errors.maxDevices = `El límite debe ser mayor o igual a ${formData.devices.length} (dispositivos actuales)`
    }

    if (formData.maxDevices < 1) {
      errors.maxDevices = 'El límite debe ser al menos 1'
    }

    setValidationErrors(errors)
  }, [formData])

  // Handle form changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Device management
  const handleAddDevice = (device) => {
    if (formData.devices.length >= formData.maxDevices) {
      alert(
        `No se pueden agregar más dispositivos. Límite: ${formData.maxDevices}`
      )
      return
    }

    setFormData((prev) => ({
      ...prev,
      devices: [...prev.devices, device],
    }))
  }

  const handleRemoveDevice = (deviceToRemove) => {
    setFormData((prev) => ({
      ...prev,
      devices: prev.devices.filter((d) => d.id !== deviceToRemove.id),
    }))
  }

  // Filter devices
  const filteredAvailableDevices = availableDevices.filter((device) => {
    // Exclude devices already assigned
    if (formData.devices.some((d) => d.id === device.id)) return false

    // Apply filters
    const matchesSearch =
      !availableFilter ||
      device.name.toLowerCase().includes(availableFilter.toLowerCase()) ||
      device.id.toLowerCase().includes(availableFilter.toLowerCase())

    const matchesType =
      !availableTypeFilter || device.type === availableTypeFilter

    return matchesSearch && matchesType
  })

  const filteredAssignedDevices = formData.devices.filter((device) => {
    if (!assignedFilter) return true
    return device.status === assignedFilter
  })

  // Get unique device types for filter
  const deviceTypes = [...new Set(availableDevices.map((d) => d.type))]

  // Save changes
  const handleSave = async () => {
    if (Object.keys(validationErrors).length > 0) {
      alert('Por favor corrige los errores antes de guardar')
      return
    }

    setSaving(true)
    try {
      await saveSwarmChanges({
        id: selectedSwarmId,
        ...formData,
      })
      setSuccessMessage('Cambios guardados exitosamente')
      setTimeout(() => {
        setCurrentView('detail')
        setSuccessMessage('')
      }, 2000)
    } catch (error) {
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  // Delete swarm
  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteSwarm(selectedSwarmId)
      setSuccessMessage('Enjambre eliminado exitosamente')
      setTimeout(() => {
        setCurrentView('catalog')
        setSuccessMessage('')
      }, 2000)
    } catch (error) {
      alert('Error al eliminar el enjambre')
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  // Navigation handlers
  const handleBackToCatalog = () => {
    setCurrentView('catalog')
  }

  const handleBackToDetail = () => {
    setCurrentView('detail')
  }

  // Render catalog view for demo
  if (currentView === 'catalog') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Mi Catálogo de Enjambres
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Selecciona un enjambre para editarlo
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(mockSwarmDetails).map((swarmOption) => (
              <div
                key={swarmOption.id}
                className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                onClick={() => {
                  setSelectedSwarmId(swarmOption.id)
                  setCurrentView('edit')
                }}
              >
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {swarmOption.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {swarmOption.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {swarmOption.devices.length}/{swarmOption.maxDevices}{' '}
                  dispositivos
                </p>
                <button className="mt-3 px-3 py-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded text-sm transition-colors">
                  Editar →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render detail view placeholder
  if (currentView === 'detail') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Detalle del Enjambre
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Esta es la vista de detalle (SwarmDetail.jsx)
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('catalog')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              ← Volver al Catálogo
            </button>
            <button
              onClick={() => setCurrentView('edit')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              ✏️ Editar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner message="Cargando datos del enjambre..." />
  }

  if (error) {
    return (
      <ErrorMessage
        error="Error al cargar los datos del enjambre."
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!swarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Enjambre no encontrado
        </p>
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          onClick={handleBackToCatalog}
        >
          Volver al Catálogo
        </button>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: 'Mi Catálogo', onClick: handleBackToCatalog },
    { label: swarm.name, onClick: handleBackToDetail },
    { label: 'Editar' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Editar Enjambre
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Modifica la configuración y gestiona dispositivos
            </p>
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="text-sm">Guardando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Información Básica
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Describe el propósito del enjambre"
              />
            </div>
          </div>
        </div>

        {/* Read-only information */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Solicitado por:
              </span>
              <span className="ml-2 text-gray-900 dark:text-gray-100">
                {swarm.requestedBy}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Fecha de creación:
              </span>
              <span className="ml-2 text-gray-900 dark:text-gray-100">
                {new Date(swarm.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Gestión de Dispositivos ({formData.devices.length}/
          {formData.maxDevices})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Devices Panel */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Dispositivos Disponibles
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                ({filteredAvailableDevices.length})
              </span>
            </div>

            {/* Filters for available devices */}
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={availableFilter}
                onChange={(e) => setAvailableFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <select
                value={availableTypeFilter}
                onChange={(e) => setAvailableTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Todos los tipos</option>
                {deviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
              {filteredAvailableDevices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No hay dispositivos disponibles
                  </p>
                </div>
              ) : (
                filteredAvailableDevices.map((device) => (
                  <DeviceListItem
                    key={device.id}
                    device={device}
                    onAdd={handleAddDevice}
                    isAssigned={false}
                    disabled={formData.devices.length >= formData.maxDevices}
                  />
                ))
              )}
            </div>
          </div>

          {/* Assigned Devices Panel */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Dispositivos del Enjambre
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                ({filteredAssignedDevices.length})
              </span>
            </div>

            {/* Filter for assigned devices */}
            <div className="mb-4">
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Todos los estados</option>
                <option value="online">Solo conectados</option>
                <option value="offline">Solo desconectados</option>
                <option value="error">Solo en error</option>
              </select>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border dark:border-gray-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/30">
              {filteredAssignedDevices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {assignedFilter
                      ? 'No hay dispositivos con este estado'
                      : 'No hay dispositivos asignados'}
                  </p>
                </div>
              ) : (
                filteredAssignedDevices.map((device) => (
                  <DeviceListItem
                    key={device.id}
                    device={device}
                    onRemove={handleRemoveDevice}
                    isAssigned={true}
                    disabled={false}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex gap-3 order-2 lg:order-1">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🗑️ Eliminar Enjambre
            </button>
          </div>

          <div className="flex gap-3 order-1 lg:order-2">
            <button
              onClick={handleBackToDetail}
              disabled={saving}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(validationErrors).length > 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`¿Eliminar "${formData.name}"?`}
        message="Esta acción no se puede deshacer. Se eliminarán todos los datos del enjambre y se liberarán los dispositivos asignados."
        confirmText={saving ? 'Eliminando...' : 'Eliminar'}
        cancelText="Cancelar"
        variant="danger"
        isLoading={saving}
      />

      {/* Success Message */}
      <SuccessToast
        message={successMessage}
        isVisible={!!successMessage}
        onClose={() => setSuccessMessage('')}
      />
    </div>
  )
}