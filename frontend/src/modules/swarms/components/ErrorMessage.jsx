export default function ErrorMessage({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-red-600 dark:text-red-400 text-xl mb-4">⚠️ Error</div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      )}
    </div>
  );
}