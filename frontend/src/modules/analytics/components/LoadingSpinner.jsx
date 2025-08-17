// components/LoadingSpinner.jsx
import React from 'react';

export const LoadingSpinner = ({ dateRange }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-gray-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      <span className="ml-3 text-lg text-gray-800 dark:text-white">Cargando datos de telemetría...</span>
      {!dateRange.isRealtime && (
        <span className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Obteniendo datos del {dateRange.startDate} al {dateRange.endDate}
        </span>
      )}
    </div>
  );
};
