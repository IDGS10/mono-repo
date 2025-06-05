// modules/analytics/services/analyticsService.js

// Simulación de datos para desarrollo
const mockData = {
  stats: {
    activeUsers: 2485,
    activeUsersChange: 12.5,
    sessions: 8420,
    sessionsChange: 8.2,
    avgSessionTime: 4.2,
    avgSessionTimeChange: -2.1,
    bounceRate: 42.8,
    bounceRateChange: -5.3,
  },
  chartData: {
    userTraffic: [
      { date: '2025-01-01', users: 1200 },
      { date: '2025-01-02', users: 1450 },
      { date: '2025-01-03', users: 1380 },
      { date: '2025-01-04', users: 1620 },
      { date: '2025-01-05', users: 1550 },
      { date: '2025-01-06', users: 1750 },
      { date: '2025-01-07', users: 1690 }
    ],
    deviceTypes: [
      { label: 'Desktop', value: 45.2 },
      { label: 'Mobile', value: 38.8 },
      { label: 'Tablet', value: 16.0 }
    ]
  },
  recentActivity: [
    {
      id: 1,
      type: 'user_signup',
      message: 'Nuevo usuario registrado: john@example.com',
      timestamp: '2025-06-02T10:30:00Z'
    },
    {
      id: 2,
      type: 'high_traffic',
      message: 'Pico de tráfico detectado en /products',
      timestamp: '2025-06-02T10:15:00Z'
    },
    {
      id: 3,
      type: 'conversion',
      message: 'Nueva conversión completada',
      timestamp: '2025-06-02T09:45:00Z'
    },
    {
      id: 4,
      type: 'error',
      message: 'Error 404 frecuente en /old-page',
      timestamp: '2025-06-02T09:30:00Z'
    }
  ]
};

// Función para simular delay de red
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const analyticsService = {
  // Obtener datos del dashboard
  async getDashboardData(filters = {}) {
    await delay(800); // Simular latencia de red
    
    // Aquí harías la llamada real a tu API
    // const response = await fetch('/api/analytics/dashboard', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(filters)
    // });
    // return response.json();
    
    return mockData;
  },

  // Obtener datos específicos para gráficos
  async getChartData(chartType, filters = {}) {
    await delay(500);
    
    // Aquí harías la llamada real a tu API
    // const response = await fetch(`/api/analytics/charts/${chartType}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(filters)
    // });
    // return response.json();
    
    return mockData.chartData[chartType] || [];
  },

  // Obtener actividad reciente
  async getRecentActivity(limit = 10) {
    await delay(300);
    
    // const response = await fetch(`/api/analytics/activity?limit=${limit}`);
    // return response.json();
    
    return mockData.recentActivity.slice(0, limit);
  },

  // Generar reporte
  async generateReport(reportConfig) {
    await delay(2000);
    
    // const response = await fetch('/api/analytics/reports', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(reportConfig)
    // });
    // return response.json();
    
    return {
      id: Date.now(),
      title: `Reporte Analytics - ${new Date().toLocaleDateString()}`,
      status: 'completed',
      downloadUrl: '/downloads/report-' + Date.now() + '.pdf',
      createdAt: new Date().toISOString()
    };
  },

  // Exportar datos
  async exportData(format = 'csv', filters = {}) {
    await delay(1500);
    
    // const response = await fetch('/api/analytics/export', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ format, filters })
    // });
    // return response.blob();
    
    return new Blob(['mock,data,export'], { type: 'text/csv' });
  }
};