// Dashboard.jsx - Componente Principal
import React, { useEffect } from 'react';
import { useTelemetryData } from '../hooks/useTelemetryData';
import { KPICard } from '../components/KPICard';
import { DateFilters } from '../components/DateFilters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ChartContainer } from '../components/ChartContainer';
import { TemperatureChart } from '../components/charts/TemperatureChart';
import { HumidityChart } from '../components/charts/HumidityChart';
import { DeviceComparisonChart } from '../components/charts/DeviceComparisonChart';
import { FormatDistributionChart } from '../components/charts/FormatDistributionChart';
import { CorrelationChart } from '../components/charts/CorrelationChart';
import { StatisticsTable } from '../components/StatisticsTable';

const Dashboard = () => {
  const {
    telemetryData,
    realtimeData,
    deviceStats,
    loading,
    error,
    dateRange,
    fetchTelemetryData,
    handleDateRangeChange,
    handleModeChange,
    applyDateFilter
  } = useTelemetryData();

  useEffect(() => {
    // Configurar fechas por defecto
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    handleDateRangeChange('startDate', yesterday.toISOString().split('T')[0]);
    handleDateRangeChange('endDate', now.toISOString().split('T')[0]);

    fetchTelemetryData();
    
    // Configurar variables CSS para tooltips según el tema
    const updateThemeVariables = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const root = document.documentElement;
      
      if (isDark) {
        root.style.setProperty('--tooltip-bg', '#1e293b');
        root.style.setProperty('--tooltip-border', '#475569');
        root.style.setProperty('--tooltip-text', '#f1f5f9');
      } else {
        root.style.setProperty('--tooltip-bg', '#ffffff');
        root.style.setProperty('--tooltip-border', '#d1d5db');
        root.style.setProperty('--tooltip-text', '#374151');
      }
    };

    updateThemeVariables();
    
    const observer = new MutationObserver(updateThemeVariables);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    const interval = setInterval(() => {
      if (dateRange.isRealtime && Math.random() > 0.7) {
        fetchTelemetryData();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [dateRange.isRealtime]);

  // Datos para gráfico de sectores
  const formatDistribution = telemetryData.reduce((acc, item) => {
    const format = item.tags.format;
    acc[format] = (acc[format] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(formatDistribution).map(([format, count]) => ({
    name: format.toUpperCase(),
    value: count,
    percentage: ((count / telemetryData.length) * 100).toFixed(1)
  }));

  if (loading) {
    return <LoadingSpinner dateRange={dateRange} />;
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Dashboard IoT</h1>
        <p className="text-gray-600 dark:text-slate-300">Monitoreo en tiempo real de dispositivos IoT</p>
        
        <DateFilters 
          dateRange={dateRange}
          loading={loading}
          error={error}
          onDateRangeChange={handleDateRangeChange}
          onModeChange={handleModeChange}
          onApplyFilter={applyDateFilter}
        />

        {/* KPIs */}
        <div className="flex gap-4 mt-4">
          <KPICard 
            title="Lecturas Totales" 
            value={telemetryData.length} 
            color="blue" 
          />
          <KPICard 
            title="Dispositivos Activos" 
            value={deviceStats.length} 
            color="green" 
          />
          <KPICard 
            title="Promedio Activación" 
            value={`${Math.round(deviceStats.reduce((acc, device) => acc + parseInt(device.actuatorRate), 0) / deviceStats.length) || 0}%`} 
            color="orange" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Temperatura en Tiempo Real">
          <TemperatureChart data={realtimeData} />
        </ChartContainer>
        
        <ChartContainer title="Humedad Relativa">
          <HumidityChart data={realtimeData} />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <ChartContainer title="Comparación por Dispositivo" className="xl:col-span-2">
          <DeviceComparisonChart data={deviceStats} />
        </ChartContainer>
        
        <ChartContainer title="Formatos de Datos">
          <FormatDistributionChart data={pieData} />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartContainer title="Correlación Temperatura vs Humedad">
          <CorrelationChart data={realtimeData} />
        </ChartContainer>
        
        <ChartContainer title="Estadísticas Detalladas">
          <StatisticsTable data={deviceStats} />
        </ChartContainer>
      </div>

      {/* Botón para refrescar datos */}
      <div className="mt-6 text-center">
        <button 
          onClick={fetchTelemetryData}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg border border-blue-500 dark:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Actualizando...' : dateRange.isRealtime ? 'Actualizar Datos' : 'Recargar Rango'}
        </button>
        
        {!dateRange.isRealtime && (
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Mostrando datos del {new Date(dateRange.startDate).toLocaleDateString()} al {new Date(dateRange.endDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;