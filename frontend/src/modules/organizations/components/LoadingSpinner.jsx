const LoadingSpinner = ({ 
  message = "Cargando...", 
  size = "default",
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12"
  };

  const textSizeClasses = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg"
  };

  const spinnerClass = `animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 ${sizeClasses[size]}`;
  const textClass = `text-gray-600 dark:text-gray-400 mt-4 ${textSizeClasses[size]}`;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={spinnerClass}></div>
      {message && <p className={textClass}>{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
};

export default LoadingSpinner;