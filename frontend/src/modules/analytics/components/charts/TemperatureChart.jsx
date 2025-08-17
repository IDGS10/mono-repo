// components/charts/TemperatureChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const TemperatureChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-slate-600" />
        <XAxis dataKey="time" stroke="#6b7280" className="dark:stroke-slate-400" />
        <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#6b7280" className="dark:stroke-slate-400" />
        <Tooltip 
          formatter={(value) => [`${value.toFixed(1)}°C`, 'Temperatura']}
          labelFormatter={(label) => `Hora: ${label}`}
          contentStyle={{ 
            backgroundColor: 'var(--tooltip-bg, #ffffff)', 
            border: '1px solid var(--tooltip-border, #d1d5db)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #374151)'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="temperature" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6' }}
          name="Temperatura (°C)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};