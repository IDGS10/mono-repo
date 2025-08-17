import { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import DeviceModal from '../components/DeviceModal.jsx';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', matricula: '' });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/devices');
      setDevices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar dispositivos',err);
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
      if (editingId) {
        await axios.put(`http://localhost:3000/api/devices/${editingId}`, formData);
        setDevices(prev =>
          prev.map(device =>
            device.id === editingId ? { ...device, ...formData } : device
          )
        );
        setEditingId(null);
      } else {
        const response = await axios.post('http://localhost:3000/api/devices', formData);
        setDevices(prev => [...prev, response.data]);
      }
      setModalOpen(false);
    } catch (err) {
      setError('Error al guardar el dispositivo',err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este dispositivo?')) {
      try {
        await axios.delete(`http://localhost:3000/api/devices/${id}`);
        setDevices(prev => prev.filter(device => device.id !== id));
      } catch (err) {
        setError('Error al eliminar el dispositivo',err);
      }
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header estilo analytics */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Device Manager ESP32
          </h1>
          <p className="text-gray-600 text-lg">
            Administra los dispositivos asignados a alumnos
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDevices}
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

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <LoadingSpinner message="Cargando dispositivos..." />
        ) : error ? (
          <ErrorMessage error={error} onRetry={fetchDevices} />
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
