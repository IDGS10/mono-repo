import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";
import MetricCard from "../components/MetricCard";
import DeviceCard from "../components/DeviceCard";
import Breadcrumb from "../components/Breadcrumb";
import DeviceDetailModal from "./DeviceDetailModal";

// Mock data
const mockSwarmDetails = {
  1: {
    id: 1,
    name: "Alpha Swarm",
    description: "Monitoreo de temperatura y humedad en invernaderos automatizados para optimizar condiciones de cultivo.",
    status: "active",
    maxDevices: 10,
    createdAt: "2024-06-01",
    requestedBy: "Juan Pérez",
    devices: [
      {
        id: "ESP32-001",
        name: "Temperature Sensor Alpha",
        type: "Environmental Sensor",
        status: "online",
        lastSeen: "2024-07-02T10:30:00Z",
        batteryLevel: 87,
        wifiSignal: -45,
      },
      {
        id: "ESP32-002", 
        name: "Humidity Monitor Beta",
        type: "Environmental Sensor",
        status: "online",
        lastSeen: "2024-07-02T10:25:00Z",
        batteryLevel: 92,
        wifiSignal: -52,
      },
      {
        id: "ESP32-003",
        name: "Pressure Gauge Gamma",
        type: "Pressure Sensor", 
        status: "offline",
        lastSeen: "2024-07-02T09:15:00Z",
        batteryLevel: 23,
        wifiSignal: -68,
      },
      {
        id: "ESP32-004",
        name: "Multi-Sensor Delta",
        type: "Environmental Sensor",
        status: "online",
        lastSeen: "2024-07-02T10:28:00Z",
        batteryLevel: 76,
        wifiSignal: -38,
      },
      {
        id: "ESP32-005",
        name: "Weather Station Epsilon",
        type: "Weather Monitor",
        status: "error",
        lastSeen: "2024-07-02T08:45:00Z",
        batteryLevel: 45,
        wifiSignal: -75,
      },
    ]
  },
  2: {
    id: 2,
    name: "Beta Swarm",
    description: "Sistema de monitoreo para detección temprana de incendios forestales.",
    status: "inactive",
    maxDevices: 8,
    createdAt: "2024-05-15",
    requestedBy: "María González",
    devices: [
      {
        id: "ESP32-006",
        name: "Fire Detector Alpha",
        type: "Fire Sensor",
        status: "offline",
        lastSeen: "2024-07-01T15:30:00Z",
        batteryLevel: 34,
        wifiSignal: -60,
      },
      {
        id: "ESP32-007",
        name: "Smoke Monitor Beta",
        type: "Smoke Sensor",
        status: "offline",
        lastSeen: "2024-07-01T14:20:00Z",
        batteryLevel: 28,
        wifiSignal: -65,
      }
    ]
  }
};

// Simulate API fetch
const fetchSwarmDetail = async (swarmId) => {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const swarm = mockSwarmDetails[swarmId];
      if (swarm) {
        resolve(swarm);
      } else {
        reject(new Error("Swarm not found"));
      }
    }, 1000)
  );
};

export default function SwarmDetail() {
  const [currentView, setCurrentView] = useState("detail"); // "detail", "catalog", "edit"
  const [selectedSwarmId, setSelectedSwarmId] = useState(1); // Default to swarm 1 for demo
  const [swarm, setSwarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState("");
  
  // Modal state for device detail
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    if (currentView === "detail" && selectedSwarmId) {
      setLoading(true);
      setError(false);
      fetchSwarmDetail(selectedSwarmId)
        .then((data) => {
          setSwarm(data);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [currentView, selectedSwarmId]);

  // Simulate real-time updates
  useEffect(() => {
    if (!swarm || currentView !== "detail") return;
    
    const interval = setInterval(() => {
      setSwarm(prev => ({
        ...prev,
        devices: prev.devices.map(device => ({
          ...device,
          batteryLevel: Math.max(0, Math.min(100, device.batteryLevel + (Math.random() - 0.5) * 2)),
          wifiSignal: device.wifiSignal + (Math.random() - 0.5) * 3,
          lastSeen: device.status === 'online' ? new Date().toISOString() : device.lastSeen
        }))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [swarm, currentView]);

  const handleBackToCatalog = () => {
    setCurrentView("catalog");
  };

  const handleEditSwarm = () => {
    setCurrentView("edit");
  };

  // Función para abrir el modal del dispositivo
  const handleViewDeviceDetail = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setIsDeviceModalOpen(true);
  };

  // Función para cerrar el modal del dispositivo
  const handleCloseDeviceModal = () => {
    setIsDeviceModalOpen(false);
    setSelectedDeviceId(null);
  };

  // Render swarm selection for demo (simulate catalog view)
  if (currentView === "catalog") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Mi Catálogo de Enjambres</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Elige un enjambre para ver sus detalles</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(mockSwarmDetails).map((swarmOption) => (
              <div 
                key={swarmOption.id}
                className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedSwarmId(swarmOption.id);
                  setCurrentView("detail");
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{swarmOption.name}</h3>
                  <StatusBadge status={swarmOption.status} variant="large" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{swarmOption.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {swarmOption.devices.length}/{swarmOption.maxDevices} dispositivos
                </p>
                <button className="mt-3 px-3 py-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded text-sm transition-colors">
                  Ver Detalle →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show edit mode (placeholder for now)
  if (currentView === "edit") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <Breadcrumb items={[
            { label: 'Mi Catálogo', onClick: () => setCurrentView("catalog") },
            { label: swarm?.name, onClick: () => setCurrentView("detail") },
            { label: 'Editar' }
          ]} />
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Editar Enjambre</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Esta función se implementa en EditSwarm.jsx. Aquí podrías editar:</p>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Nombre del enjambre: <strong>{swarm?.name}</strong></li>
              <li>• Descripción del enjambre</li>
              <li>• Límite máximo de dispositivos: <strong>{swarm?.maxDevices}</strong></li>
              <li>• Asignar/desasignar dispositivos</li>
            </ul>
          </div>
          
          <button
            onClick={() => setCurrentView("detail")}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            ← Volver al Detalle
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Cargando detalles del enjambre..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error="Error al cargar los detalles del enjambre."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!swarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Enjambre no encontrado</p>
        <button 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          onClick={handleBackToCatalog}
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  // Calculate metrics
  const totalDevices = swarm.devices.length;
  const connectedDevices = swarm.devices.filter(d => d.status === 'online').length;
  const disconnectedDevices = swarm.devices.filter(d => d.status === 'offline').length;
  const errorDevices = swarm.devices.filter(d => d.status === 'error').length;

  // Filter devices
  const filteredDevices = swarm.devices.filter(device => {
    if (!deviceFilter) return true;
    return device.status === deviceFilter;
  });

  const breadcrumbItems = [
    { label: 'Mi Catálogo', onClick: handleBackToCatalog },
    { label: swarm.name }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{swarm.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Gestión y monitoreo del enjambre</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={swarm.status} variant="large" />
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              onClick={handleEditSwarm}
            >
              ✏️ Editar
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Dispositivos" 
          value={`${totalDevices}/${swarm.maxDevices}`}
          color="blue"
          icon="📱"
        />
        <MetricCard 
          title="Conectados" 
          value={connectedDevices}
          color="green"
          icon="🟢"
        />
        <MetricCard 
          title="Desconectados" 
          value={disconnectedDevices}
          color="gray"
          icon="⚫"
        />
        <MetricCard 
          title="En Error" 
          value={errorDevices}
          color="red"
          icon="🔴"
        />
      </div>

      {/* Devices Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Dispositivos ({filteredDevices.length})
          </h2>
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="online">Solo conectados</option>
            <option value="offline">Solo desconectados</option>
            <option value="error">Solo en error</option>
          </select>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {deviceFilter ? 'No hay dispositivos con este estado' : 'No hay dispositivos asignados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device) => (
              <DeviceCard 
                key={device.id} 
                device={device} 
                onViewDetail={handleViewDeviceDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Información del Enjambre</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción</h3>
              <p className="text-gray-900 dark:text-gray-100">{swarm.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Solicitado por</h3>
              <p className="text-gray-900 dark:text-gray-100">{swarm.requestedBy}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha de creación</h3>
              <p className="text-gray-900 dark:text-gray-100">{new Date(swarm.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Límite máximo</h3>
              <p className="text-gray-900 dark:text-gray-100">{swarm.maxDevices} dispositivos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Navigation Helper */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">🎯 Demo - Navegación</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentView("catalog")}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded text-xs transition-colors"
          >
            Ver Catálogo
          </button>
          <button
            onClick={() => setCurrentView("edit")}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded text-xs transition-colors"
          >
            Ir a Editar
          </button>
          <button
            onClick={() => {
              setSelectedSwarmId(selectedSwarmId === 1 ? 2 : 1);
            }}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded text-xs transition-colors"
          >
            Cambiar Enjambre
          </button>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
            👆 Haz clic en "Ver Detalle" de cualquier dispositivo para abrir el modal
          </span>
        </div>
      </div>

      {/* Device Detail Modal */}
      {isDeviceModalOpen && selectedDeviceId && (
        <DeviceDetailModal 
          isOpen={isDeviceModalOpen}
          deviceId={selectedDeviceId}
          swarmName={swarm.name}
          onClose={handleCloseDeviceModal}
        />
      )}
    </div>
  );
}