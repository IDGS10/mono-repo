// modules/analytics/components/ChartContainer.jsx
const ChartContainer = ({ title, data, type = 'line' }) => {
  // Simulación de gráfico simple
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No hay datos disponibles</p>
        </div>
      );
    }

    if (type === 'line') {
      const maxUsers = Math.max(...data.map(d => d.users));
      
      return (
        <div className="flex items-end justify-between h-64 p-4 space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 max-w-12">
              <div 
                className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600 min-h-1"
                style={{ 
                  height: `${(item.users / maxUsers) * 100}%` 
                }}
              ></div>
              <span className="text-xs text-gray-600 mt-2 text-center">
                {new Date(item.date).getDate()}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (type === 'doughnut') {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      return (
        <div className="p-4 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getColor(index) }}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">Tipo de gráfico no soportado</p>
      </div>
    );
  };

  const getColor = (index) => {
    const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6'];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200">
            ⚙️
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200">
            📊
          </button>
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="p-2">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartContainer;