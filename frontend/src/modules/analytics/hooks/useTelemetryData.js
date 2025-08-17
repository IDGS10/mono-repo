// hooks/useTelemetryData.js
import { useState, useEffect } from 'react';

export const useTelemetryData = () => {
  const [telemetryData, setTelemetryData] = useState([]);
  const [realtimeData, setRealtimeData] = useState([]);
  const [deviceStats, setDeviceStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    isRealtime: true
  });

  // Simulación de datos IoT basados en tu diccionario
  const generateMockData = (startDate = null, endDate = null) => {
    const devices = [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002", 
      "550e8400-e29b-41d4-a716-446655440003",
      "550e8400-e29b-41d4-a716-446655440004"
    ];

    const data = [];
    let baseTime = Date.now();
    let dataPoints = 50;

    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      dataPoints = Math.min(Math.max(diffInDays * 24, 20), 200);
      baseTime = end;
    }
    
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = baseTime - (i * 60000);
      devices.forEach((deviceId, index) => {
        data.push({
          measurement: "iot_telemetry",
          tags: {
            device_uuid: deviceId,
            topic: "IDGS10-Pruebas-Sensores",
            format: Math.random() > 0.5 ? "json" : "pipe",
            source: "iot-parser",
            version: "1.0.0"
          },
          fields: {
            timestamp: Math.floor(timestamp / 1000),
            temperature: 18 + Math.random() * 15 + Math.sin(i * 0.1) * 3,
            humidity: 40 + Math.random() * 40 + Math.cos(i * 0.08) * 10,
            version: `1.${index}.${Math.floor(Math.random() * 10)}`,
            actuator: Math.random() > 0.8 ? "1" : "0",
            mac: `AA:BB:CC:DD:EE:${String(index + 10).padStart(2, '0')}`
          },
          timestamp: new Date(timestamp).toISOString(),
          deviceName: `Dispositivo ${index + 1}`,
          time: new Date(timestamp).toLocaleTimeString(),
          date: new Date(timestamp).toLocaleDateString()
        });
      });
    }
    
    return data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const processDataForCharts = (data) => {
    const realtimePoints = data.slice(-20).map(item => ({
      time: item.time,
      temperature: item.fields.temperature,
      humidity: item.fields.humidity,
      device: item.deviceName,
      timestamp: item.fields.timestamp
    }));
    setRealtimeData(realtimePoints);

    const deviceMap = {};
    data.forEach(item => {
      const deviceId = item.tags.device_uuid;
      if (!deviceMap[deviceId]) {
        deviceMap[deviceId] = {
          deviceName: item.deviceName,
          temperatures: [],
          humidities: [],
          actuatorActivations: 0,
          totalReadings: 0
        };
      }
      deviceMap[deviceId].temperatures.push(item.fields.temperature);
      deviceMap[deviceId].humidities.push(item.fields.humidity);
      deviceMap[deviceId].actuatorActivations += item.fields.actuator === "1" ? 1 : 0;
      deviceMap[deviceId].totalReadings += 1;
    });

    const stats = Object.entries(deviceMap).map(([id, stats]) => ({
      device: stats.deviceName,
      deviceId: id.slice(-4),
      avgTemp: (stats.temperatures.reduce((a, b) => a + b, 0) / stats.temperatures.length).toFixed(1),
      avgHumidity: (stats.humidities.reduce((a, b) => a + b, 0) / stats.humidities.length).toFixed(1),
      maxTemp: Math.max(...stats.temperatures).toFixed(1),
      minTemp: Math.min(...stats.temperatures).toFixed(1),
      actuatorRate: ((stats.actuatorActivations / stats.totalReadings) * 100).toFixed(1),
      totalReadings: stats.totalReadings
    }));

    setDeviceStats(stats);
  };

  const fetchTelemetryData = async () => {
    try {
      setLoading(true);
      setError('');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = generateMockData(
        dateRange.isRealtime ? null : dateRange.startDate,
        dateRange.isRealtime ? null : dateRange.endDate
      );
      
      const response = {
        data: {
          success: true,
          message: 'Datos de telemetría obtenidos exitosamente',
          batch_data: mockData,
          timestamp: new Date().toISOString(),
          total_records: mockData.length
        }
      };
      
      if (response.data && response.data.success) {
        setTelemetryData(response.data.batch_data);
        processDataForCharts(response.data.batch_data);
      } else {
        setError('No se pudieron obtener los datos de telemetría');
      }
    } catch (err) {
      console.error('Error fetching telemetry data:', err);
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleModeChange = (isRealtime) => {
    setDateRange(prev => ({
      ...prev,
      isRealtime,
      startDate: isRealtime ? '' : prev.startDate,
      endDate: isRealtime ? '' : prev.endDate
    }));
  };

  const applyDateFilter = () => {
    if (!dateRange.isRealtime && (!dateRange.startDate || !dateRange.endDate)) {
      setError('Por favor selecciona ambas fechas para el rango');
      return;
    }
    
    if (!dateRange.isRealtime && new Date(dateRange.startDate) >= new Date(dateRange.endDate)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }
    
    fetchTelemetryData();
  };

  return {
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
  };
};