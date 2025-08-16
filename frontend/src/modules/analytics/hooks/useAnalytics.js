// modules/analytics/hooks/useAnalytics.js
import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService.js';

export const useAnalytics = (autoLoad = true) => {
  const [data, setData] = useState({
    stats: null,
    chartData: null,
    recentActivity: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await analyticsService.getDashboardData(filters);
      setData(result);
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar datos';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    return loadData();
  }, [loadData]);

  const loadChartData = useCallback(async (chartType, filters = {}) => {
    try {
      const chartData = await analyticsService.getChartData(chartType, filters);
      setData(prev => ({
        ...prev,
        chartData: {
          ...prev.chartData,
          [chartType]: chartData
        }
      }));
      return chartData;
    } catch (err) {
      setError(err.message || 'Error al cargar gráfico');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    data,
    loading,
    error,
    loadData,
    refreshData,
    loadChartData,
    // Shortcuts para acceso directo
    stats: data.stats,
    chartData: data.chartData,
    recentActivity: data.recentActivity
  };
};