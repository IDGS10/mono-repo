import { AlertCircle, RefreshCw } from "lucide-react";

const ErrorMessage = ({ 
  error = "Ha ocurrido un error", 
  onRetry = null,
  retryText = "Reintentar",
  fullScreen = false,
  type = "error" // error, warning, info
}) => {
  const typeClasses = {
    error: {
      container: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      text: "text-red-600 dark:text-red-400",
      icon: "text-red-500 dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
    },
    warning: {
      container: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-600 dark:text-yellow-400",
      icon: "text-yellow-500 dark:text-yellow-400",
      button: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
    },
    info: {
      container: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      text: "text-blue-600 dark:text-blue-400",
      icon: "text-blue-500 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
    }
  };

  const classes = typeClasses[type];

  const content = (
    <div className={`rounded-lg border p-6 text-center ${classes.container}`}>
      <div className="flex flex-col items-center gap-4">
        <AlertCircle size={48} className={classes.icon} />
        <div>
          <p className={`text-lg font-medium mb-2 ${classes.text}`}>
            {type === 'error' ? 'Error' : type === 'warning' ? 'Advertencia' : 'Información'}
          </p>
          <p className={`text-sm ${classes.text}`}>
            {error}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${classes.button}`}
          >
            <RefreshCw size={16} />
            {retryText}
          </button>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default ErrorMessage;