// components/charts/CorrelationChart.jsx
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const CorrelationChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart data={data}>
        <CartesianGrid stroke="#d1d5db" className="dark:stroke-slate-600" />
        <XAxis dataKey="temperature" name="Temperatura" unit="°C" stroke="#6b7280" className="dark:stroke-slate-400" />
        <YAxis dataKey="humidity" name="Humedad" unit="%" stroke="#6b7280" className="dark:stroke-slate-400" />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ 
            backgroundColor: 'var(--tooltip-bg, #ffffff)', 
            border: '1px solid var(--tooltip-border, #d1d5db)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #374151)'
          }}
        />
        <Scatter name="Lecturas" data={data} fill="#8b5cf6" />
      </ScatterChart>
    </ResponsiveContainer>
  );
};