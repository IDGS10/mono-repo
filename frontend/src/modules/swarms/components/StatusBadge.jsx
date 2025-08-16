export default function StatusBadge({ status, variant = "default" }) {
  // Default variant for general status
  const defaultConfig = {
    online: {
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      icon: "🟢",
      text: "Online"
    },
    offline: {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      icon: "⚫",
      text: "Offline"
    },
    error: {
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      icon: "🔴",
      text: "Error"
    },
    active: {
      color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
      icon: "🟢",
      text: "ACTIVE"
    },
    inactive: {
      color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
      icon: "⚫",
      text: "INACTIVE"
    }
  };

  // Large variant for emphasis
  const largeConfig = {
    online: {
      color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
      icon: "🟢",
      text: "ONLINE"
    },
    offline: {
      color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
      icon: "⚫",
      text: "OFFLINE"
    },
    error: {
      color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
      icon: "🔴",
      text: "ERROR"
    },
    active: {
      color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
      icon: "🟢",
      text: "ACTIVE"
    },
    inactive: {
      color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
      icon: "⚫",
      text: "INACTIVE"
    }
  };

  const config = variant === "large" ? largeConfig : defaultConfig;
  const { color, icon, text } = config[status] || config.offline || config.inactive;

  const baseClasses = variant === "large" 
    ? "px-4 py-2 rounded-full text-sm font-semibold border-2"
    : "px-2 py-0.5 rounded-full text-xs font-semibold";

  return (
    <span className={`${baseClasses} ${color}`}>
      {icon} {text}
    </span>
  );
}