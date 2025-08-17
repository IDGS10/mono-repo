// components/charts/FormatDistributionChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const FormatDistributionChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({name, percentage}) => `${name}: ${percentage}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'var(--tooltip-bg, #ffffff)', 
            border: '1px solid var(--tooltip-border, #d1d5db)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #374151)'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};