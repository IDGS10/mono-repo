<<<<<<< HEAD
import React from 'react'

const Dashboard = () => {
  return (
    <div>Dashboard</div>
  )
}

export default Dashboard
=======
// modules/analytics/pages/DashboardPage.jsx
import { useAnalytics } from '../hooks/useAnalytics.js';
import StatsCard from '../components/StatsCard.jsx';
import ChartContainer from '../components/ChartContainer.jsx';
import RecentActivity from '../components/RecentActivity.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const Dashboard = () => {
  const { 
    stats, 
    chartData, 
    recentActivity, 
    loading, 
    error, 
    refreshData 
  } = useAnalytics();

  if (loading) {
    return <LoadingSpinner message="Cargando datos de analytics..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Monitorea el rendimiento y métricas clave de tu aplicación
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
            onClick={refreshData}
          >
            🔄 Actualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium">
            📊 Exportar Reporte
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Usuarios Activos"
          value={stats?.activeUsers || 0}
          change={stats?.activeUsersChange || 0}
          icon="👥"
          color="blue"
        />
        <StatsCard
          title="Sesiones"
          value={stats?.sessions || 0}
          change={stats?.sessionsChange || 0}
          icon="🔄"
          color="green"
        />
        <StatsCard
          title="Tiempo Promedio"
          value={`${stats?.avgSessionTime || 0}m`}
          change={stats?.avgSessionTimeChange || 0}
          icon="⏱️"
          color="purple"
        />
        <StatsCard
          title="Tasa de Rebote"
          value={`${stats?.bounceRate || 0}%`}
          change={stats?.bounceRateChange || 0}
          icon="📈"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <ChartContainer
            title="Usuarios en el Tiempo"
            data={chartData?.userTraffic || []}
            type="line"
          />
        </div>
        <div className="xl:col-span-1">
          <ChartContainer
            title="Dispositivos"
            data={chartData?.deviceTypes || []}
            type="doughnut"
          />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <RecentActivity activities={recentActivity || []} />
      </div>
    </div>
  );
};

export default Dashboard;
>>>>>>> prod
