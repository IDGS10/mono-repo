import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StatusBadge from '../components/StatusBadge'
import MetricCard from '../components/MetricCard'
import DeviceCard from '../components/DeviceCard'
import Breadcrumb from '../components/Breadcrumb'
import DeviceDetailModal from './DeviceDetailModal'
// Import our services
import swarmService from '../services/SwarmService'

export default function SwarmDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState('detail')
  const [swarm, setSwarm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deviceFilter, setDeviceFilter] = useState('')
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)

  // Function to load swarm detail using the service
  const loadSwarmDetail = async () => {
    setLoading(true)
    setError(false)

    try {
      console.log("HOLAAAA")
      const data = await swarmService.getSwarmDetailWithDevices(id)
      console.log(data)
      setSwarm(data)
    } catch (error) {
      console.error('Error loading swarm detail:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentView === 'detail' && id) {
      loadSwarmDetail()
    }
  }, [currentView, id])

  const handleBackToCatalog = () => {
    navigate('/swarm')
  }

  const handleEditSwarm = () => {
    navigate(`/swarm/EditSwarm/${id}`)
  }

  const handleViewDeviceDetail = (device) => {
    setSelectedDevice(device) // Pasar el objeto completo
    setIsDeviceModalOpen(true)
  }

  const handleCloseDeviceModal = () => {
    setIsDeviceModalOpen(false)
    setSelectedDevice(null)
  }

  const handleRetry = () => {
    loadSwarmDetail()
  }

  if (loading) {
    return <LoadingSpinner message="Loading swarm details..." />
  }

  if (error) {
    return (
      <ErrorMessage
        error="Error loading swarm details."
        onRetry={handleRetry}
      />
    )
  }

  if (!swarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Swarm not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The swarm you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            onClick={handleBackToCatalog}
          >
            Back to Catalog
          </button>
        </div>
      </div>
    )
  }

  const totalDevices = swarm.devices?.length || 0
  const connectedDevices =
    swarm.devices?.filter((d) => d.status === 'online').length || 0
  const disconnectedDevices =
    swarm.devices?.filter((d) => d.status === 'offline').length || 0
  const errorDevices =
    swarm.devices?.filter((d) => d.status === 'error').length || 0

  const filteredDevices =
    swarm.devices?.filter((device) => {
      if (!deviceFilter) return true
      return device.status === deviceFilter
    }) || []

  const breadcrumbItems = [
    { label: 'My Catalog', onClick: handleBackToCatalog },
    { label: swarm.name },
  ]

  const utilizationPercentage = Math.round(
    (totalDevices / swarm.maxDevices) * 100
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full transform translate-x-20 -translate-y-20"></div>
          </div>

          <Breadcrumb items={breadcrumbItems} />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mt-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                🚀
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {swarm.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  Swarm management and monitoring
                </p>
                <div className="flex items-center gap-4">
                  <StatusBadge status={swarm.status} variant="large" />
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>📅</span>
                    <span>
                      Created {new Date(swarm.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Utilization Progress */}
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Capacity
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        utilizationPercentage > 80
                          ? 'bg-red-500'
                          : utilizationPercentage > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(utilizationPercentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {utilizationPercentage}%
                  </span>
                </div>
              </div>

              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                onClick={handleEditSwarm}
              >
                <span>✏️</span>
                Edit Swarm
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalDevices}
                  <span className="text-lg text-gray-500">
                    /{swarm.maxDevices}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Devices
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {connectedDevices}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Connected
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚫</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {disconnectedDevices}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Disconnected
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {errorDevices}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Error
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Devices Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400">📡</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Connected Devices
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredDevices.length} of {totalDevices} devices{' '}
                  {deviceFilter && `(filtered by ${deviceFilter})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  className="appearance-none px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={deviceFilter}
                  onChange={(e) => setDeviceFilter(e.target.value)}
                >
                  <option value="">All status</option>
                  <option value="online">🟢 Connected only</option>
                  <option value="offline">⚫ Disconnected only</option>
                  <option value="error">🔴 Error only</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <span className="text-gray-400">▼</span>
                </div>
              </div>

              <button
                onClick={loadSwarmDetail}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                title="Refresh devices"
              >
                🔄
              </button>
            </div>
          </div>

          {filteredDevices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-3xl text-gray-400">📱</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {deviceFilter
                  ? 'No devices with this status'
                  : 'No devices assigned'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {deviceFilter
                  ? `There are currently no devices with "${deviceFilter}" status in this swarm.`
                  : "This swarm doesn't have any devices assigned yet."}
              </p>
              {deviceFilter && (
                <button
                  onClick={() => setDeviceFilter('')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Show All Devices
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  className="group cursor-pointer"
                  onClick={() => handleViewDeviceDetail(device.id)}
                >
                  <DeviceCard
                    device={device}
                    onViewDetail={handleViewDeviceDetail}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swarm Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-400">ℹ️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Swarm Information
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <span>📝</span> Description
                </h3>
                <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                  {swarm.description ||
                    'No description provided for this swarm.'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <span>👤</span> Requested by
                </h3>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  User ID: {swarm.requestedBy}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <span>📅</span> Creation date
                </h3>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {swarm.created_at
                    ? new Date(swarm.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Unknown'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <span>⚙️</span> Configuration
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Maximum devices:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {swarm.maxDevices}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Current utilization:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {utilizationPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Available slots:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {swarm.maxDevices - totalDevices}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Detail Modal */}
      {isDeviceModalOpen && selectedDevice && (
        <DeviceDetailModal
          isOpen={isDeviceModalOpen}
          device={selectedDevice} // 👈 Objeto completo, no solo ID
          swarmName={swarm.name}
          onClose={handleCloseDeviceModal}
        />
      )}
    </div>
  )
}
