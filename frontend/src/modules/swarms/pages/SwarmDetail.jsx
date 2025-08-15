import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";
import MetricCard from "../components/MetricCard";
import DeviceCard from "../components/DeviceCard";
import Breadcrumb from "../components/Breadcrumb";
import DeviceDetailModal from "./DeviceDetailModal";

const API_BASE = "http://localhost:5052";

const fetchSwarmDetail = async (id) => {
  const res = await fetch(`${API_BASE}/swarms/${id}`);
  if (!res.ok) throw new Error("Error al obtener el detalle del swarm");
  const json = await res.json();
  return json.data?.swarm;
};

export default function SwarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("detail");
  const [swarm, setSwarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState("");
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    if (currentView === "detail" && id) {
      setLoading(true);
      setError(false);
      fetchSwarmDetail(id)
        .then((data) => {
          setSwarm(data);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [currentView, id]);

  const handleBackToCatalog = () => {
    navigate('/swarm');
  };

  const handleEditSwarm = () => {
    navigate(`/swarm/EditSwarm/${id}`);
  };

  const handleViewDeviceDetail = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setIsDeviceModalOpen(true);
  };

  const handleCloseDeviceModal = () => {
    setIsDeviceModalOpen(false);
    setSelectedDeviceId(null);
  };

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

  const totalDevices = swarm.devices?.length || 0;
  const connectedDevices = swarm.devices?.filter(d => d.status === 'online').length || 0;
  const disconnectedDevices = swarm.devices?.filter(d => d.status === 'offline').length || 0;
  const errorDevices = swarm.devices?.filter(d => d.status === 'error').length || 0;

  const filteredDevices = swarm.devices?.filter(device => {
    if (!deviceFilter) return true;
    return device.status === deviceFilter;
  }) || [];

  const breadcrumbItems = [
    { label: 'Mi Catálogo', onClick: handleBackToCatalog },
    { label: swarm.name }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
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
              <p className="text-gray-900 dark:text-gray-100">{swarm.created_at ? new Date(swarm.created_at).toLocaleDateString() : ""}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Límite máximo</h3>
              <p className="text-gray-900 dark:text-gray-100">{swarm.maxDevices} dispositivos</p>
            </div>
          </div>
        </div>
      </div>

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