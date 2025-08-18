import { Dialog } from '@headlessui/react';
import { useEffect } from 'react';

const DeviceModal = ({ isOpen, onClose, onSubmit, formData, setFormData, editingId }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.type) return;
    onSubmit(formData);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
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
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
          <Dialog.Title className="text-xl font-semibold text-gray-800">
            {editingId ? 'Editar Dispositivo' : 'Agregar Dispositivo'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Sensor de Alumno"
                className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <input
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="esp32 / esp01"
                className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Sensor</label>
              <input
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Temperatura / Humedad / Movimiento"
                className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección IP</label>
              <input
                name="device_ip"
                value={formData.device_ip}
                onChange={handleChange}
                placeholder="192.168.0.10"
                className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">MAC Address</label>
              <input
                name="mac_address"
                value={formData.mac_address}
                onChange={handleChange}
                placeholder="AA:BB:CC:DD:EE:FF"
                className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DeviceModal;
