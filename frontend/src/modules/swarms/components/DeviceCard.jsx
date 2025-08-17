import StatusBadge from './StatusBadge';

export default function DeviceCard({ device, onViewDetail, onClick }) {
  const getSignalStrength = (signal) => {
    if (signal > -50) return { text: "Excellent", color: "text-green-600 dark:text-green-400", bars: "📶" };
    if (signal > -60) return { text: "Good", color: "text-yellow-600 dark:text-yellow-400", bars: "📶" };
    if (signal > -70) return { text: "Fair", color: "text-orange-600 dark:text-orange-400", bars: "📶" };
    return { text: "Poor", color: "text-red-600 dark:text-red-400", bars: "📶" };
  };

  const getBatteryColor = (level) => {
    if (level > 60) return "text-green-600 dark:text-green-400";
    if (level > 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const signalConfig = getSignalStrength(device.wifiSignal);

  const handleClick = () => {
    if (onClick) {
      onClick(device.id);
    } else if (onViewDetail) {
      onViewDetail(device.id);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{device.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{device.id}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{device.type}</p>
        </div>
        <StatusBadge status={device.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-400">Battery:</span>
          <span className={`ml-1 font-semibold ${getBatteryColor(device.batteryLevel)}`}>
            {device.batteryLevel}% 🔋
          </span>
        </div>
        {device.wifiSignal && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">WiFi:</span>
            <span className={`ml-1 ${signalConfig.color}`}>
              {signalConfig.text} {signalConfig.bars}
            </span>
          </div>
        )}
        <div className="col-span-2">
          <span className="font-medium text-gray-600 dark:text-gray-400">Last seen:</span>
          <span className="ml-1 text-gray-700 dark:text-gray-300">
            {new Date(device.lastSeen || device.requestedAt).toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t dark:border-gray-700">
        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">
          View Details →
        </button>
      </div>
    </div>
  );
}