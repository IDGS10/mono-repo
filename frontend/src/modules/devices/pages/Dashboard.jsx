import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import DeviceModal from '../components/DeviceModal.jsx';
import { getDevices, createDevice, updateDevice, deleteDevice } from '../services/deviceServices';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    matricula: '',
    type: '',
    status: 'offline',
    SSID: '',
    device_ip: '',
    certificate: '',
    password: '',
    mac_address: '',
    connection_type: '',
    device_token: '',
    firmware_version: '',
    version: '',
    is_active: true,
    health_status: '',
    error_logs: '',
    maintenance_date: '',
    notes: '',
    created_by: 'admin',
    swarm_id: null,
    organization_id: null
  });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAllDevices();
  }, []);

  const fetchAllDevices = async () => {
    setLoading(true);
    try {
      const data = await getDevices();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ id: '', name: '', matricula: '' });
    setModalOpen(true);
  };

  const handleEdit = (device) => {
    setEditingId(device.id);
    setFormData(device);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      let newDevice;
      if (editingId) {
        newDevice = await updateDevice(editingId, formData);
        setDevices(prev => prev.map(d => (d.id === editingId ? newDevice : d)));
        setEditingId(null);
      } else {
        newDevice = await createDevice(formData);
        setDevices(prev => [...prev, newDevice]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este dispositivo?')) return;
    try {
      await deleteDevice(id);
      setDevices(prev => prev.filter(device => device.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Device Manager ESP32
          </h1>
          <p className="text-gray-600 text-lg">
            Administra los dispositivos asignados
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchAllDevices}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            🔄 Actualizar
          </button>
          <button 
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            ➕ Agregar Dispositivo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <LoadingSpinner message="Cargando dispositivos..." />
        ) : error ? (
          <ErrorMessage error={error} onRetry={fetchAllDevices} />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Nombre</th>
                <th className="px-6 py-4 text-left">Matrícula</th>
                <th className="px-6 py-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {devices.map(device => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{device.id}</td>
                  <td className="px-6 py-4">{device.name}</td>
                  <td className="px-6 py-4">{device.matricula}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(device)}
                      className="px-3 py-1 text-sm bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-6 text-center text-gray-500">
                    No hay dispositivos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <DeviceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
      />
    </div>
  );
};

export default Dashboard;
