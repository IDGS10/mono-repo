// modules/analytics/components/ErrorMessage.jsx
const ErrorMessage = ({ 
  error, 
  onRetry, 
  title = 'Error al cargar los datos',
  showRetry = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 p-8 bg-white rounded-lg border border-red-200 shadow-sm">
      {/* Error Icon */}
      <div className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
        <span className="text-2xl">❌</span>
      </div>
      
      {/* Error Title */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h2>
      
      {/* Error Message */}
      <p className="text-gray-600 text-center mb-6 max-w-md leading-relaxed">
        {error}
      </p>
      
      {/* Retry Button */}
      {showRetry && onRetry && (
        <button 
          onClick={onRetry} 
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          🔄 Reintentar
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;