import React, { useState, useEffect } from 'react';
import { SecurityApi } from '../../../Api';

const Dashboard = () => {
  const [securityMessage, setSecurityMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSecurityMessage = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await SecurityApi.get('/api/hello');
        
        if (response.data && response.data.success) {
          setSecurityMessage(response.data.message);
        } else {
          setError('No se pudo obtener el mensaje del servicio de seguridad');
        }
      } catch (err) {
        console.error('Error fetching security message:', err);
        setError(`Error de conexión: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityMessage();
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Analytics Dashboard
        </h1>
        
        {/* Security Service Integration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Security Service Status
          </h2>
          
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Conectando con el servicio de seguridad...
              </span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error de conexión
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {securityMessage && !loading && !error && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Conexión exitosa
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <strong>{securityMessage}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Placeholder for future analytics content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Analytics Content
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Este es el contenido principal del dashboard de analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;