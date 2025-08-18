import axios from 'axios';

const API_URL = 'https://server-uteq.nrsoftware.online/devices/api/devices';

export const getDevices = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (err) {
    throw new Error('Error al cargar dispositivos');
  }
};

export const createDevice = async (deviceData) => {
  try {
    const response = await axios.post(API_URL, deviceData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    throw new Error('Error al crear el dispositivo');
  }
};

export const updateDevice = async (id, deviceData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, deviceData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    throw new Error('Error al actualizar el dispositivo');
  }
};

export const deleteDevice = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (err) {
    throw new Error('Error al eliminar el dispositivo');
  }
};
