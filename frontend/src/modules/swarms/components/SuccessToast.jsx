export default function SuccessToast({ message, isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 dark:bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg dark:shadow-gray-900/50 z-50">
      <div className="flex items-center gap-2">
        <span>✅</span>
        <span>{message}</span>
        {onClose && (
          <button
            className="ml-3 text-sm underline hover:no-underline"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}