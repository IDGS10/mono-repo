// components/charts/DeviceComparisonChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const DeviceComparisonChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-slate-600" />
        <XAxis dataKey="device" stroke="#6b7280" className="dark:stroke-slate-400" />
        <YAxis stroke="#6b7280" className="dark:stroke-slate-400" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'var(--tooltip-bg, #ffffff)', 
            border: '1px solid var(--tooltip-border, #d1d5db)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #374151)'
          }}
        />
        <Legend />
        <Bar dataKey="avgTemp" fill="#3b82f6" name="Temp. Promedio (°C)" />
        <Bar dataKey="avgHumidity" fill="#10b981" name="Humedad Promedio (%)" />
      </BarChart>
    </ResponsiveContainer>
  );
};