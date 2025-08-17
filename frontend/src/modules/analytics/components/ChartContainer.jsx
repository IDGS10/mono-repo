// components/ChartContainer.jsx
import React from 'react';

export const ChartContainer = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
      {children}
    </div>
  );
};