export default function MetricCard({ title, value, unit, color = "blue", icon }) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30",
    green: "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30",
    yellow: "border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/30",
    red: "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30",
    gray: "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800",
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[color]}`}>
      {icon && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <span className="text-2xl">{icon}</span>
        </div>
      )}
      {!icon && (
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
      )}
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}{" "}
        {unit && (
          <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}