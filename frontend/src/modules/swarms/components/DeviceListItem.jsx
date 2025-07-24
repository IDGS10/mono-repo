export default function DeviceListItem({ device, onAdd, onRemove, isAssigned, disabled }) {
  const getStatusColor = (status) => {
    const colors = {
      online: 'text-green-600 dark:text-green-400',
      offline: 'text-gray-600 dark:text-gray-400',
      error: 'text-red-600 dark:text-red-400',
    }
    return colors[status] || 'text-gray-600 dark:text-gray-400'
  }

  const getStatusIcon = (status) => {
    const icons = {
      online: '🟢',
      offline: '⚫',
      error: '🔴',
    }
    return icons[status] || '⚫'
  }

  return (
    <div
      className={`border dark:border-gray-700 rounded-lg p-3 ${
        disabled
          ? 'opacity-50'
          : 'hover:shadow-sm dark:hover:shadow-lg dark:hover:shadow-gray-900/20'
      } transition-shadow bg-white dark:bg-gray-800`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {device.name}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {device.id}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {device.type}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs ${getStatusColor(device.status)}`}>
            {getStatusIcon(device.status)} {device.status}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            🔋 {device.batteryLevel}%
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {isAssigned ? (
          <button
            onClick={() => onRemove(device)}
            disabled={disabled}
            className="w-full px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
          >
            ← Remover
          </button>
        ) : (
          <button
            onClick={() => onAdd(device)}
            disabled={disabled}
            className="w-full px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
          >
            Agregar →
          </button>
        )}
      </div>
    </div>
  )
}