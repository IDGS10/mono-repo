// components/StatisticsTable.jsx
import React from 'react';

export const StatisticsTable = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-600">
            <th className="text-left py-2 text-gray-700 dark:text-slate-300">Dispositivo</th>
            <th className="text-left py-2 text-gray-700 dark:text-slate-300">Temp. Max</th>
            <th className="text-left py-2 text-gray-700 dark:text-slate-300">Activaciones</th>
            <th className="text-left py-2 text-gray-700 dark:text-slate-300">Lecturas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((device, index) => (
            <tr key={index} className="border-b border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <td className="py-2 font-medium text-gray-900 dark:text-white">{device.device}</td>
              <td className="py-2 text-gray-600 dark:text-slate-300">{device.maxTemp}°C</td>
              <td className="py-2 text-gray-600 dark:text-slate-300">{device.actuatorRate}%</td>
              <td className="py-2 text-gray-600 dark:text-slate-300">{device.totalReadings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};