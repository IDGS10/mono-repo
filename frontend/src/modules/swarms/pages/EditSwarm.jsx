import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmationModal from '../components/ConfirmationModal'
import SuccessToast from '../components/SuccessToast'
import Breadcrumb from '../components/Breadcrumb'
import swarmService from '../services/SwarmService'

/**
 * EditSwarm Component
 * Allows users to edit swarm configuration including name, description, and device limits
 * Includes validation, change tracking, and delete functionality
 */
export default function EditSwarm() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Component state
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

  // UI state
  const [validationErrors, setValidationErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  /**
   * Load swarm data for editing
   */
  const loadSwarmForEdit = async () => {
    setLoading(true)
    setError(false)
    
    try {
      const swarmData = await swarmService.getSwarmDetail(id)
      setSwarm(swarmData)
      setFormData({
        name: swarmData.name,
        description: swarmData.description,
        maxDevices: swarmData.maxDevices,
      })
    } catch (error) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Load swarm data on component mount
  useEffect(() => {
    if (currentView === 'edit' && id) {
      loadSwarmForEdit()
    }
  }, [currentView, id])

  // Real-time form validation
  useEffect(() => {
    const errors = {}
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    if (formData.maxDevices < 1) {
      errors.maxDevices = 'Limit must be at least 1'
    }
    if (formData.maxDevices > 1000) {
      errors.maxDevices = 'Limit cannot exceed 1000'
    }
    setValidationErrors(errors)
  }, [formData])

  /**
   * Handle form input changes
   * @param {string} field - Field name to update
   * @param {any} value - New value for the field
   */
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  /**
   * Save swarm changes
   */
  const handleSave = async () => {
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    
    setSaving(true)
    try {
      await swarmService.updateSwarm(id, {
        name: formData.name,
        description: formData.description,
        maxDevices: formData.maxDevices,
      })
      
      setSuccessMessage('Changes saved successfully')
      setTimeout(() => {
        navigate(`/swarm/SwarmDetail/${id}`)
        setSuccessMessage('')
      }, 2000)
    } catch (error) {
      setSuccessMessage('Error saving changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Delete swarm with confirmation
   */
  const handleDelete = async () => {
    setSaving(true)
    try {
      await swarmService.deleteSwarm(id)
      setSuccessMessage('Swarm deleted successfully')
      setTimeout(() => {
        navigate('/swarm')
        setSuccessMessage('')
      }, 2000)
    } catch (error) {
      setSuccessMessage('Error deleting swarm. Please try again.')
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  // Navigation handlers
  const handleBackToCatalog = () => {
    navigate('/swarm')
  }

  const handleBackToDetail = () => {
    navigate(`/swarm/SwarmDetail/${id}`)
  }

  const handleRetry = () => {
    loadSwarmForEdit()
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading swarm data..." />
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        error="Error loading swarm data."
        onRetry={handleRetry}
      />
    )
  }

  // Swarm not found state
  if (!swarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Swarm not found
          </p>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            onClick={handleBackToCatalog}
          >
            Back to Catalog
          </button>
        </div>
      </div>
    )
  }

  // Breadcrumb navigation
  const breadcrumbItems = [
    { label: 'My Catalog', onClick: handleBackToCatalog },
    { label: swarm.name, onClick: handleBackToDetail },
    { label: 'Edit' }
  ]

  // Check if form has unsaved changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: swarm.name,
    description: swarm.description,
    maxDevices: swarm.maxDevices,
  })

  // Form validation status
  const isFormValid = Object.keys(validationErrors).length === 0
  const canSave = isFormValid && hasChanges && !saving

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                ✏️
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Edit Swarm
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Modify swarm configuration and settings
                </p>
              </div>
            </div>
            {saving && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Saving changes...</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">📝</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Basic Information
                </h2>
              </div>

              <div className="space-y-6">
                {/* Swarm Name Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Swarm Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 ${
                      validationErrors.name 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    placeholder="Enter a descriptive name for your swarm"
                    maxLength={100}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <span>⚠️</span> {validationErrors.name}
                    </p>
                  )}
                </div>

                {/* Description Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-none"
                    placeholder="Describe the purpose and goals of this swarm..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Device Limit Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Limit *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={formData.maxDevices}
                      onChange={(e) => handleInputChange('maxDevices', Number(e.target.value))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                        validationErrors.maxDevices 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      placeholder="Maximum number of devices"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">devices</span>
                    </div>
                  </div>
                  {validationErrors.maxDevices && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <span>⚠️</span> {validationErrors.maxDevices}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Set the maximum number of devices that can join this swarm (1-1000)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Swarm Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm">ℹ️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Swarm Details
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Requested by
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    User ID: {swarm.requestedBy}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Creation date
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(swarm.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Current status
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      swarm.status === 'active' ? 'bg-green-500' :
                      swarm.status === 'assigned' ? 'bg-blue-500' :
                      swarm.status === 'requested' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {swarm.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unsaved Changes Warning */}
            {hasChanges && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-600 dark:text-amber-400">⚡</span>
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Unsaved Changes
                  </h4>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You have unsaved changes. Don't forget to save them before leaving.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Danger Zone */}
            <div className="flex gap-3 order-2 lg:order-1">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              >
                🗑️ Delete Swarm
              </button>
            </div>
            
            {/* Primary Actions */}
            <div className="flex gap-3 order-1 lg:order-2">
              <button
                onClick={handleBackToDetail}
                disabled={saving}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    💾 Save Changes
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Delete "${formData.name}"?`}
        message="This action cannot be undone. All swarm data will be permanently deleted."
        confirmText={saving ? 'Deleting...' : 'Delete Forever'}
        cancelText="Keep Swarm"
        variant="danger"
        isLoading={saving}
      />

      {/* Success/Error Toast */}
      <SuccessToast
        message={successMessage}
        isVisible={!!successMessage}
        onClose={() => setSuccessMessage('')}
      />
    </div>
  )
}