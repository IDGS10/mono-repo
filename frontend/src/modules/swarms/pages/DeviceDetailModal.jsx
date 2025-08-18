import { useEffect, useState, useRef } from 'react'

// Componentes básicos que necesitamos
const LoadingSpinner = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    {message && <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>}
  </div>
)

const StatusBadge = ({ status, variant = "normal" }) => {
  const colors = {
    online: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
  
  const size = variant === "large" ? "px-3 py-1 text-sm" : "px-2 py-1 text-xs"
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors[status]} ${size}`}>
      {status}
    </span>
  )
}

const MetricCard = ({ title, value, unit, color = "blue" }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100',
    green: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-100',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-100',
    red: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-100'
  }
  
  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <h4 className="text-sm font-medium opacity-75 mb-1">{title}</h4>
      <div className="text-2xl font-bold">
        {value} {unit && <span className="text-sm opacity-75">{unit}</span>}
      </div>
    </div>
  )
}

// Modal Component corregido
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${size} relative`}>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-2 transition-colors"
            >
              <span className="sr-only">Cerrar</span>
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

// Lista de dispositivos ESP simulados
const mockDevicesList = [
  {
    id: 'ESP32-001',
    name: 'Temperature Sensor Alpha',
    type: 'Environmental Sensor',
    status: 'online',
    lastSeen: '2024-07-02T10:30:00Z',
    batteryLevel: 87,
    wifiSignal: -45,
  },
  {
    id: 'ESP32-002',
    name: 'Humidity Monitor Beta',
    type: 'Environmental Sensor',
    status: 'online',
    lastSeen: '2024-07-02T10:25:00Z',
    batteryLevel: 92,
    wifiSignal: -52,
  },
  {
    id: 'ESP32-003',
    name: 'Pressure Gauge Gamma',
    type: 'Pressure Sensor',
    status: 'offline',
    lastSeen: '2024-07-02T09:15:00Z',
    batteryLevel: 23,
    wifiSignal: -68,
  },
  {
    id: 'ESP32-004',
    name: 'Multi-Sensor Delta',
    type: 'Environmental Sensor',
    status: 'online',
    lastSeen: '2024-07-02T10:28:00Z',
    batteryLevel: 76,
    wifiSignal: -38,
  },
  {
    id: 'ESP32-005',
    name: 'Weather Station Epsilon',
    type: 'Weather Monitor',
    status: 'error',
    lastSeen: '2024-07-02T08:45:00Z',
    batteryLevel: 45,
    wifiSignal: -75,
  },
]

// Datos específicos por dispositivo
const deviceDetailData = {
  'ESP32-001': {
    model: 'ESP32-WROOM-32',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    firmwareVersion: 'v2.1.3',
    totalUptime: '15d 8h 23m',
    memoryUsage: 62,
    cpuTemperature: 45.2,
    sensors: {
      temperature: { value: 23.5, unit: '°C', lastUpdate: '2024-07-02T10:30:00Z' },
      humidity: { value: 65, unit: '%', lastUpdate: '2024-07-02T10:30:00Z' },
      pressure: { value: 1013.2, unit: 'hPa', lastUpdate: '2024-07-02T10:30:00Z' },
    },
  },
  'ESP32-002': {
    model: 'ESP32-S3',
    macAddress: 'BB:CC:DD:EE:FF:AA',
    firmwareVersion: 'v2.0.8',
    totalUptime: '8d 3h 15m',
    memoryUsage: 45,
    cpuTemperature: 42.8,
    sensors: {
      temperature: { value: 22.1, unit: '°C', lastUpdate: '2024-07-02T10:25:00Z' },
      humidity: { value: 58, unit: '%', lastUpdate: '2024-07-02T10:25:00Z' },
      pressure: { value: 1015.8, unit: 'hPa', lastUpdate: '2024-07-02T10:25:00Z' },
    },
  },
  'ESP32-003': {
    model: 'ESP32-C3',
    macAddress: 'CC:DD:EE:FF:AA:BB',
    firmwareVersion: 'v1.9.2',
    totalUptime: '3d 12h 45m',
    memoryUsage: 78,
    cpuTemperature: 55.1,
    sensors: {
      temperature: { value: 0, unit: '°C', lastUpdate: '2024-07-02T09:15:00Z' },
      humidity: { value: 0, unit: '%', lastUpdate: '2024-07-02T09:15:00Z' },
      pressure: { value: 998.4, unit: 'hPa', lastUpdate: '2024-07-02T09:15:00Z' },
    },
  },
  'ESP32-004': {
    model: 'ESP32-WROOM-32D',
    macAddress: 'DD:EE:FF:AA:BB:CC',
    firmwareVersion: 'v2.1.1',
    totalUptime: '22d 16h 8m',
    memoryUsage: 51,
    cpuTemperature: 43.7,
    sensors: {
      temperature: { value: 24.8, unit: '°C', lastUpdate: '2024-07-02T10:28:00Z' },
      humidity: { value: 72, unit: '%', lastUpdate: '2024-07-02T10:28:00Z' },
      pressure: { value: 1011.6, unit: 'hPa', lastUpdate: '2024-07-02T10:28:00Z' },
    },
  },
  'ESP32-005': {
    model: 'ESP32-S2',
    macAddress: 'EE:FF:AA:BB:CC:DD',
    firmwareVersion: 'v1.8.5',
    totalUptime: '1d 4h 32m',
    memoryUsage: 89,
    cpuTemperature: 62.3,
    sensors: {
      temperature: { value: 0, unit: '°C', lastUpdate: '2024-07-02T08:45:00Z' },
      humidity: { value: 0, unit: '%', lastUpdate: '2024-07-02T08:45:00Z' },
      pressure: { value: 0, unit: 'hPa', lastUpdate: '2024-07-02T08:45:00Z' },
    },
  },
}

const logTypes = [
  { value: '', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

// Simulate API fetch for device data
const fetchDeviceData = async (deviceId) => {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const deviceInfo = mockDevicesList.find((d) => d.id === deviceId)
      const deviceDetails = deviceDetailData[deviceId]

      if (deviceInfo && deviceDetails) {
        resolve({
          ...deviceInfo,
          ...deviceDetails,
        })
      } else {
        reject(new Error('Device not found'))
      }
    }, 800)
  )
}

// Simulate logs fetch
const fetchLogs = async (deviceId) => {
  return new Promise((resolve) =>
    setTimeout(() => {
      const device = mockDevicesList.find((d) => d.id === deviceId)
      const logs = [
        {
          id: 1,
          timestamp: '2024-07-02T10:30:15Z',
          type: 'info',
          message: `[${deviceId}] Sensor data collected successfully`,
        },
        {
          id: 2,
          timestamp: '2024-07-02T10:29:45Z',
          type: 'info',
          message: `[${deviceId}] WiFi connection stable`,
        },
        {
          id: 3,
          timestamp: '2024-07-02T10:28:30Z',
          type: 'warning',
          message: `[${deviceId}] Battery level below 90%`,
        },
        {
          id: 4,
          timestamp: '2024-07-02T10:25:12Z',
          type: 'info',
          message: `[${deviceId}] Device heartbeat sent`,
        },
      ]

      if (device?.status === 'error') {
        logs.unshift({
          id: 0,
          timestamp: '2024-07-02T10:32:00Z',
          type: 'error',
          message: `[${deviceId}] Critical system error detected`,
        })
      }

      resolve(logs)
    }, 400)
  )
}

// DeviceDetail Modal Content Component
const DeviceDetailContent = ({ deviceId, swarmName, onClose }) => {
  const [device, setDevice] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [logFilter, setLogFilter] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef(null)

  // Load device data when a device is selected
  useEffect(() => {
    if (deviceId) {
      setLoading(true)
      fetchDeviceData(deviceId)
        .then((data) => {
          setDevice(data)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [deviceId])

  // Load logs when tab changes
  useEffect(() => {
    if (activeTab === 'logs' && deviceId) {
      setLogsLoading(true)
      fetchLogs(deviceId)
        .then((data) => {
          setLogs(data)
          setLogsLoading(false)
        })
        .catch(() => {
          setLogsLoading(false)
        })
    }
  }, [activeTab, deviceId])

  // Auto scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Simulate real-time updates for device detail
  useEffect(() => {
    if (!device) return

    const interval = setInterval(() => {
      if (activeTab === 'info') {
        setDevice((prev) => ({
          ...prev,
          batteryLevel: Math.max(
            0,
            prev.batteryLevel + (Math.random() - 0.5) * 2
          ),
          wifiSignal: prev.wifiSignal + (Math.random() - 0.5) * 5,
          memoryUsage: Math.max(
            0,
            Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 10)
          ),
          cpuTemperature: prev.cpuTemperature + (Math.random() - 0.5) * 2,
        }))
      }

      if (activeTab === 'logs') {
        const newLog = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          type: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
          message: `[${deviceId}] Real-time log entry - ${new Date().toLocaleTimeString()}`,
        }
        setLogs((prev) => [...prev, newLog])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [device, activeTab, deviceId])

  const filteredLogs = logs.filter(
    (log) => !logFilter || log.type === logFilter
  )

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner message="Cargando detalles del dispositivo..." />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Dispositivo no encontrado
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {device.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Device ID: {device.id} | Swarm: {swarmName}
            </p>
          </div>
          <StatusBadge status={device.status} variant="large" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'info', label: 'Información' },
            { id: 'sensors', label: 'Datos de Sensores' },
            { id: 'logs', label: 'Logs y Eventos' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Tab 1: Información */}
        {activeTab === 'info' && (
          <div className="space-y-8">
            {/* Datos Técnicos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Datos Técnicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Tipo de Dispositivo
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {device.type}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Modelo
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {device.model}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Dirección MAC
                  </h4>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
                    {device.macAddress}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Versión Firmware
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {device.firmwareVersion}
                  </p>
                </div>
              </div>
            </div>

            {/* Métricas del Dispositivo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Métricas del Dispositivo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Nivel de Batería"
                  value={Math.round(device.batteryLevel)}
                  unit="%"
                  color={
                    device.batteryLevel > 50
                      ? 'green'
                      : device.batteryLevel > 20
                      ? 'yellow'
                      : 'red'
                  }
                />
                <MetricCard
                  title="Señal WiFi"
                  value={Math.round(device.wifiSignal)}
                  unit="dBm"
                  color="blue"
                />
                <MetricCard
                  title="Uso de Memoria"
                  value={Math.round(device.memoryUsage)}
                  unit="%"
                  color={
                    device.memoryUsage < 70
                      ? 'green'
                      : device.memoryUsage < 90
                      ? 'yellow'
                      : 'red'
                  }
                />
                <MetricCard
                  title="Temperatura CPU"
                  value={device.cpuTemperature.toFixed(1)}
                  unit="°C"
                  color={
                    device.cpuTemperature < 50
                      ? 'green'
                      : device.cpuTemperature < 70
                      ? 'yellow'
                      : 'red'
                  }
                />
              </div>
            </div>

            {/* Estado de Conexión */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Estado de Conexión
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Última Vez Visto
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(device.lastSeen).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Tiempo Total Conectado
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {device.totalUptime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Datos de Sensores */}
        {activeTab === 'sensors' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Datos de Sensores Actuales
            </h3>

            {/* Current Sensor Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(device.sensors).map(([key, sensor]) => (
                <div
                  key={key}
                  className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-6 rounded-lg"
                >
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 capitalize">
                    {key}
                  </h4>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                    {sensor.value} {sensor.unit}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Última actualización:{' '}
                    {new Date(sensor.lastUpdate).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Sensor Status */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Estado de Sensores
              </h4>
              <p className="text-gray-900 dark:text-gray-100">
                {Object.values(device.sensors).every(sensor => sensor.value > 0) 
                  ? "✅ Todos los sensores funcionando correctamente" 
                  : "⚠️ Algunos sensores no están reportando datos"}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Logs y Eventos */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Logs y Eventos
              </h3>
              <div className="flex flex-wrap gap-3">
                <select
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                >
                  {logTypes.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Auto scroll
                  </span>
                </label>
                <button
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  onClick={() => setLogs([])}
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Logs Console */}
            {logsLoading ? (
              <LoadingSpinner message="Loading logs..." />
            ) : (
              <div className="bg-black dark:bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border dark:border-gray-700">
                {filteredLogs.map((log) => (
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
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Main DeviceDetailModal component
const DeviceDetailModal = ({ isOpen, deviceId, swarmName, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-4xl">
      <DeviceDetailContent
        deviceId={deviceId}
        swarmName={swarmName}
        onClose={onClose}
      />
    </Modal>
  )
}

export default DeviceDetailModal