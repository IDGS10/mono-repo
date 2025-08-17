import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmationModal from '../components/ConfirmationModal'
import SuccessToast from '../components/SuccessToast'
import Breadcrumb from '../components/Breadcrumb'

const API_BASE = 'http://localhost:5052'

// API calls
const fetchSwarmForEdit = async (swarmId) => {
  const res = await fetch(`${API_BASE}/swarms/${swarmId}`)
  if (!res.ok) throw new Error('Swarm not found')
  const json = await res.json()
  return json.data?.swarm
}

const saveSwarmChanges = async (swarmId, swarmData) => {
  const res = await fetch(`${API_BASE}/swarms/${swarmId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(swarmData),
  })
  if (!res.ok) throw new Error('Error saving swarm changes')
  return await res.json()
}

const deleteSwarm = async (swarmId) => {
  const res = await fetch(`${API_BASE}/swarms/${swarmId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error deleting swarm')
  return await res.json()
}

export default function EditSwarm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState('edit')
  const [swarm, setSwarm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxDevices: 10,
  })

  // Validation and confirmation
  const [validationErrors, setValidationErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load swarm data
  useEffect(() => {
    if (currentView === 'edit' && id) {
      setLoading(true)
      setError(false)
      fetchSwarmForEdit(id)
        .then((swarmData) => {
          setSwarm(swarmData)
          setFormData({
            name: swarmData.name,
            description: swarmData.description,
            maxDevices: swarmData.maxDevices,
          })
          setLoading(false)
        })
        .catch(() => {
          setError(true)
          setLoading(false)
        })
    }
  }, [currentView, id])

  // Real-time validation
  useEffect(() => {
    const errors = {}
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido'
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

  // Save changes
  const handleSave = async () => {
    if (Object.keys(validationErrors).length > 0) {
      alert('Por favor corrige los errores antes de guardar')
      return
    }
    setSaving(true)
    try {
      await saveSwarmChanges(id, {
        name: formData.name,
        description: formData.description,
        maxDevices: formData.maxDevices,
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
      await deleteSwarm(id)
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
    navigate('/swarm');
  }

  const handleBackToDetail = () => {
    navigate(`/swarm/SwarmDetail/${id}`)
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
  ]

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
              Modifica la configuración del enjambre
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
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Nombre del enjambre"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Límite de dispositivos
              </label>
              <input
                type="number"
                min={1}
                value={formData.maxDevices}
                onChange={(e) => handleInputChange('maxDevices', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Máximo de dispositivos"
              />
              {validationErrors.maxDevices && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.maxDevices}</p>
              )}
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
        message="Esta acción no se puede deshacer. Se eliminarán todos los datos del enjambre."
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