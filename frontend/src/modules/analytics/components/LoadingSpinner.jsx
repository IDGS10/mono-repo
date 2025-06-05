// modules/analytics/components/LoadingSpinner.jsx
const LoadingSpinner = ({ message = 'Cargando...', size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const containerClasses = {
    small: 'gap-2',
    medium: 'gap-3',
    large: 'gap-4'
  };

  const textClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {/* Spinner */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
      </div>
      
      {/* Loading Message */}
      {message && (
        <p className={`text-gray-600 ${textClasses[size]} text-center font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;