// components/charts/HumidityChart.jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const HumidityChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-slate-600" />
        <XAxis dataKey="time" stroke="#6b7280" className="dark:stroke-slate-400" />
        <YAxis domain={[0, 100]} stroke="#6b7280" className="dark:stroke-slate-400" />
        <Tooltip 
          formatter={(value) => [`${value.toFixed(1)}%`, 'Humedad']}
          contentStyle={{ 
            backgroundColor: 'var(--tooltip-bg, #ffffff)', 
            border: '1px solid var(--tooltip-border, #d1d5db)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #374151)'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="humidity" 
          stroke="#10b981" 
          fill="#10b981" 
          fillOpacity={0.3}
          name="Humedad (%)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};