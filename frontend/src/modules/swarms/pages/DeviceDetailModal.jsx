import { useEffect, useState, useRef } from 'react'
import deviceService from '../services/DeviceService'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StatusBadge from '../components/StatusBadge'
import MetricCard from '../components/MetricCard'

// ==============================================
// CONSTANTS AND CONFIGURATION
// ==============================================

const LOG_TYPES = [
  { value: '', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

const TABS = [
  { id: 'info', label: 'Information' },
  { id: 'sensors', label: 'Sensor Data' },
  { id: 'logs', label: 'Logs & Events' },
]

// ==============================================
// INTERNAL COMPONENTS
// ==============================================

/**
 * Reusable Modal Component
 * Handles modal behavior, overlay, and close functionality
 */
const Modal = ({ isOpen, onClose, children, size = 'max-w-4xl' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900/30 dark:bg-gray-900/50 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />
        <div className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full ${size} relative border border-gray-200 dark:border-gray-700`}>
          <div className="absolute top-4 right-4 z-[70]">
            <button
              onClick={onClose}
              className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors shadow-lg border border-gray-200 dark:border-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Device Header Component
 * Displays device name, ID, status, and action buttons
 */
const DeviceHeader = ({ device, swarmName, onRestart }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 p-6">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {device.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Device ID: {device.id} | Swarm: {swarmName}
        </p>
        {device.location && (
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            📍 {device.location}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={device.status} variant="large" />
        <button
          onClick={onRestart}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          🔄 Restart
        </button>
      </div>
    </div>
  </div>
)

/**
 * Tab Navigation Component
 * Renders tab buttons for switching between different views
 */
const TabNavigation = ({ activeTab, onTabChange }) => (
  <div className="border-b border-gray-200 dark:border-gray-700">
    <nav className="flex space-x-8 px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
)

// ==============================================
// TAB CONTENT COMPONENTS
// ==============================================

/**
 * Information Tab Component
 * Displays device technical information and metrics
 */
const InfoTab = ({ device }) => {
  const getBatteryIcon = (level) => {
    if (level > 50) return '🔋'
    if (level > 20) return '🪫'
    return '🔋❗'
  }

  return (
    <div className="space-y-8">
      {/* Technical Information */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Technical Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Device Type
            </h4>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {device.type || 'ESP32'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Status
            </h4>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              MAC Address
            </h4>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
              {device.macAddress || 'Not available'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Battery
            </h4>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {device.batteryLevel || 0}% {getBatteryIcon(device.batteryLevel)}
            </p>
          </div>
        </div>
      </section>

      {/* Device Metrics */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Device Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Battery Level"
            value={Math.round(device.batteryLevel || 0)}
            unit="%"
            color={
              (device.batteryLevel || 0) > 50 ? 'green'
              : (device.batteryLevel || 0) > 20 ? 'yellow' 
              : 'red'
            }
          />
          <MetricCard
            title="Status"
            value={device.status === 'online' ? 'Online' : 'Offline'}
            color={device.status === 'online' ? 'green' : 'red'}
          />
          <MetricCard
            title="Type"
            value={device.type || 'ESP32'}
            color="blue"
          />
        </div>
      </section>

      {/* Connection Status */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Connection Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Last Seen
            </h4>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Unknown'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Location
            </h4>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {device.location || 'Not specified'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Sensors Tab Component
 * Displays real-time sensor data with refresh capability
 */
const SensorsTab = ({ device, sensorData, sensorLoading, onLoadSensorData }) => {
  // Default sensor structure if no data available
  const sensors = Object.keys(sensorData).length > 0 ? sensorData : {
    temperature: { value: 0, unit: '°C', lastUpdate: device.lastSeen },
    humidity: { value: 0, unit: '%', lastUpdate: device.lastSeen },
    pressure: { value: 0, unit: 'hPa', lastUpdate: device.lastSeen }
  }

  const getSensorStatus = () => {
    if (Object.keys(sensorData).length === 0) {
      return "📊 No sensor data available"
    }
    return Object.values(sensors).every(sensor => (sensor.value || 0) > 0)
      ? "✅ All sensors working correctly"
      : "⚠️ Some sensors are not reporting data"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Current Sensor Data
        </h3>
        <button
          onClick={onLoadSensorData}
          disabled={sensorLoading}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors text-sm"
        >
          {sensorLoading ? '🔄 Loading...' : '🔃 Refresh'}
        </button>
      </div>

      {sensorLoading ? (
        <LoadingSpinner message="Loading sensor data..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(sensors).map(([key, sensor]) => (
              <div
                key={key}
                className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-6 rounded-lg"
              >
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 capitalize">
                  {key}
                </h4>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {sensor.value || 0} {sensor.unit || ''}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Last update:{' '}
                  {sensor.lastUpdate ? new Date(sensor.lastUpdate).toLocaleString() : 'Unknown'}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Sensor Status
            </h4>
            <p className="text-gray-900 dark:text-gray-100">
              {getSensorStatus()}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Logs Tab Component
 * Displays device logs with filtering and real-time updates
 */
const LogsTab = ({ 
  logs, 
  logsLoading, 
  logFilter, 
  autoScroll, 
  onLoadLogs, 
  onFilterChange, 
  onAutoScrollChange, 
  onClearLogs, 
  logsEndRef 
}) => {
  const filteredLogs = logs.filter(log => !logFilter || log.type === logFilter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Logs & Events
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={logFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            {LOG_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => onAutoScrollChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto scroll
            </span>
          </label>
          <button
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            onClick={onLoadLogs}
            disabled={logsLoading}
          >
            {logsLoading ? '🔄' : '🔃'} Refresh
          </button>
          <button
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            onClick={onClearLogs}
          >
            Clear
          </button>
        </div>
      </div>

      {logsLoading ? (
        <LoadingSpinner message="Loading logs..." />
      ) : (
        <div className="bg-black dark:bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border dark:border-gray-700">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-400 dark:text-gray-500 text-center py-8">
              {logFilter 
                ? `No logs of type "${logFilter}" available`
                : "No logs available for this device"}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="mb-1">
                <span className="text-gray-400 dark:text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                    log.type === 'error'
                      ? 'bg-red-600 text-white'
                      : log.type === 'warning'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {log.type.toUpperCase()}
                </span>
                <span className="ml-2 text-green-400 dark:text-green-300">
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  )
}

// ==============================================
// MAIN COMPONENT
// ==============================================

/**
 * Device Detail Modal
 * Main component that orchestrates the device detail view
 */
const DeviceDetailModal = ({ isOpen, device, swarmName, onClose }) => {
  // Component state
  const [sensorData, setSensorData] = useState({})
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [sensorLoading, setSensorLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [logFilter, setLogFilter] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef(null)

  // ==============================================
  // BUSINESS LOGIC HANDLERS
  // ==============================================

  /**
   * Load sensor data for the current device
   */
  const loadSensorData = async () => {
    if (!device?.id) return
    
    setSensorLoading(true)
    try {
      const sensors = await deviceService.getDeviceSensorData(device.id)
      setSensorData(sensors)
    } catch (error) {
      setSensorData({})
    } finally {
      setSensorLoading(false)
    }
  }

  /**
   * Load device logs with current filter settings
   */
  const loadDeviceLogs = async () => {
    if (!device?.id) return
    
    setLogsLoading(true)
    try {
      const logsData = await deviceService.getDeviceLogs(device.id, {
        type: logFilter || undefined,
        limit: 100
      })
      
      // Map logs to consistent format
      const mappedLogs = logsData.map(log => ({
        id: log.id || log.logId || Date.now() + Math.random(),
        timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
        type: log.level || log.type || 'info',
        message: log.message || log.description || 'Unknown log entry'
      }))
      
      setLogs(mappedLogs)
    } catch (error) {
      // Keep existing logs on error
    } finally {
      setLogsLoading(false)
    }
  }

  /**
   * Handle device restart command
   */
  const handleRestartDevice = async () => {
    try {
      await deviceService.restartDevice(device.id)
    } catch (error) {
      // Error handling could be added here (e.g., show toast notification)
    }
  }

  // ==============================================
  // EFFECTS
  // ==============================================

  // Load data when tab changes or device changes
  useEffect(() => {
    if (activeTab === 'sensors' && device?.id) {
      loadSensorData()
    } else if (activeTab === 'logs' && device?.id) {
      loadDeviceLogs()
    }
  }, [activeTab, device?.id, logFilter])

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // ==============================================
  // RENDER
  // ==============================================

  // Show error state if no device provided
  if (!device) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-400">📱</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Device not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Could not load device information.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    )
  }

  /**
   * Render appropriate tab content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <InfoTab device={device} />
      case 'sensors':
        return (
          <SensorsTab
            device={device}
            sensorData={sensorData}
            sensorLoading={sensorLoading}
            onLoadSensorData={loadSensorData}
          />
        )
      case 'logs':
        return (
          <LogsTab
            logs={logs}
            logsLoading={logsLoading}
            logFilter={logFilter}
            autoScroll={autoScroll}
            onLoadLogs={loadDeviceLogs}
            onFilterChange={setLogFilter}
            onAutoScrollChange={setAutoScroll}
            onClearLogs={() => setLogs([])}
            logsEndRef={logsEndRef}
          />
        )
      default:
        return null
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-4xl">
      <div className="bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <DeviceHeader
          device={device}
          swarmName={swarmName}
          onRestart={handleRestartDevice}
        />
        
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  )
}

export default DeviceDetailModal