// components/KPICard.jsx
import React from 'react';

export const KPICard = ({ title, value, color = "blue", className = "" }) => {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    orange: "text-orange-600 dark:text-orange-400",
    red: "text-red-600 dark:text-red-400",
    purple: "text-purple-600 dark:text-purple-400"
  };

  return (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-lg shadow-lg ${className}`}>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-slate-400">
        {title}
      </div>
    </div>
  );
};