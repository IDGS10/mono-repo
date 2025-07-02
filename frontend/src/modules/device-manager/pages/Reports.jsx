// modules/analytics/pages/ReportsPage.jsx
import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const ReportsPage = () => {
  const [reports] = useState([
    {
      id: 1,
      title: 'Reporte Mensual - Mayo 2025',
      type: 'monthly',
      status: 'completed',
      createdAt: '2025-06-01T10:00:00Z',
      downloadUrl: '#'
    },
    {
      id: 2,
      title: 'Análisis de Tráfico - Semana 22',
      type: 'weekly',
      status: 'processing',
      createdAt: '2025-06-01T08:30:00Z',
      downloadUrl: null
    },
    {
      id: 3,
      title: 'Conversiones Q2 2025',
      type: 'quarterly',
      status: 'completed',
      createdAt: '2025-05-31T15:45:00Z',
      downloadUrl: '#'
    }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simular generación de reporte
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    alert('Reporte generado exitosamente');
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: { 
        className: 'bg-green-100 text-green-800', 
        text: 'Completado' 
      },
      processing: { 
        className: 'bg-yellow-100 text-yellow-800', 
        text: 'Procesando' 
      },
      failed: { 
        className: 'bg-red-100 text-red-800', 
        text: 'Error' 
      }
    };
    
    const style = styles[status] || styles.completed;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${style.className}`}>
        {style.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Reports Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reportes de Analytics
          </h1>
          <p className="text-gray-600 text-lg">
            Genera y descarga reportes detallados de tus métricas
          </p>
        </div>
        <div>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 font-medium disabled:cursor-not-allowed"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? <LoadingSpinner size="small" /> : '📊 Generar Reporte'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario para nuevo reporte */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Generar Nuevo Reporte
          </h3>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="date" 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                <span className="text-gray-500 text-sm">hasta</span>
                <input 
                  type="date" 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Métricas
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Usuarios</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sesiones</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Conversiones</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ingresos</span>
                </label>
              </div>
            </div>

            <button 
              type="button" 
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Generar Reporte
            </button>
          </form>
        </div>

        {/* Lista de reportes existentes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Reportes Recientes
          </h3>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">
                      {report.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Creado el {formatDate(report.createdAt)}
                    </p>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {report.status === 'completed' && report.downloadUrl && (
                      <button className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200">
                        📥 Descargar
                      </button>
                    )}
                    {report.status === 'processing' && (
                      <LoadingSpinner size="small" />
                    )}
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;