// modules/analytics/components/StatsCard.jsx
const StatsCard = ({ title, value, change, icon, color = 'blue' }) => {
  const isPositive = change >= 0;
  
  const colorClasses = {
    blue: 'bg-blue-50 border-l-blue-500',
    green: 'bg-green-50 border-l-green-500',
    purple: 'bg-purple-50 border-l-purple-500',
    orange: 'bg-orange-50 border-l-orange-500'
  };

  const cardColorClass = colorClasses[color] || colorClasses.blue;
  const changeColorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const changeIcon = isPositive ? '↗️' : '↘️';

  return (
    <div className={`${cardColorClass} border-l-4 bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        {/* Stats Icon */}
        <div className="flex-shrink-0">
          <span className="text-2xl">{icon}</span>
        </div>
        
        {/* Stats Content */}
        <div className="flex-1 ml-4">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </h3>
          
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {value}
          </div>
          
          <div className="flex items-center text-sm">
            <span className={`flex items-center font-medium ${changeColorClass}`}>
              {changeIcon} {Math.abs(change)}%
            </span>
            <span className="text-gray-500 ml-2">
              vs mes anterior
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;