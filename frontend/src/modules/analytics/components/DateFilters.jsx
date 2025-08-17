// components/DateFilters.jsx
import React from 'react';

export const DateFilters = ({ 
  dateRange, 
  loading, 
  error, 
  onDateRangeChange, 
  onModeChange, 
  onApplyFilter 
}) => {
  return (
    <div className="mt-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filtros de Consulta</h3>
      
      {/* Toggle entre tiempo real y rango de fechas */}
      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="dataMode"
            checked={dateRange.isRealtime}
            onChange={() => onModeChange(true)}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700 dark:text-slate-300">Datos Actuales (Tiempo Real)</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="dataMode"
            checked={!dateRange.isRealtime}
            onChange={() => onModeChange(false)}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700 dark:text-slate-300">Rango de Fechas</span>
        </label>
      </div>

      {/* Inputs de fecha */}
      {!dateRange.isRealtime && (
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateRangeChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Botón de aplicar filtro y estado */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={onApplyFilter}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Cargando...' : 'Consultar Datos'}
        </button>
        
        {dateRange.isRealtime && (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-green-600 dark:text-green-400">Modo Tiempo Real Activo</span>
          </div>
        )}
        
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};