// modules/analytics/components/RecentActivity.jsx
const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    const icons = {
      user_signup: '👤',
      high_traffic: '📈',
      conversion: '💰',
      error: '❌',
      security: '🔒',
      performance: '⚡'
    };
    return icons[type] || '📊';
  };

  const getActivityColorClasses = (type) => {
    const colorClasses = {
      user_signup: 'bg-green-500',
      high_traffic: 'bg-blue-500',
      conversion: 'bg-yellow-500',
      error: 'bg-red-500',
      security: 'bg-purple-500',
      performance: 'bg-cyan-500'
    };
    return colorClasses[type] || 'bg-gray-500';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Activity Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Actividad Reciente
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
          Ver todo
        </button>
      </div>
      
      {/* Activity List */}
      <div className="divide-y divide-gray-100">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 text-center">
              No hay actividad reciente
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center p-4 hover:bg-gray-50 transition-colors duration-200">
              {/* Activity Icon */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white mr-4 flex-shrink-0 ${getActivityColorClasses(activity.type)}`}>
                <span className="text-sm">
                  {getActivityIcon(activity.type)}
                </span>
              </div>
              
              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {activity.message}
                </p>
                <span className="text-xs text-gray-500">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
              
              {/* Activity Actions */}
              <div className="ml-4">
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200">
                  <span className="text-lg">⋯</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Activity Footer */}
      {activities.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium">
            🔄 Actualizar actividad
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;