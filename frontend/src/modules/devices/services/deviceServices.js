import { DeviceApi } from "../../../Api.jsx";

const ENDPOINT = "/devices";

export const getDevices = async () => {
  try {
    const response = await DeviceApi.get(ENDPOINT);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Error al cargar dispositivos");
  }
};

export const createDevice = async (deviceData) => {
  try {
    const response = await DeviceApi.post(ENDPOINT, deviceData);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Error al crear el dispositivo");
  }
};

export const updateDevice = async (id, deviceData) => {
  try {
    const response = await DeviceApi.put(`${ENDPOINT}/${id}`, deviceData);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Error al actualizar el dispositivo");
  }
};

export const deleteDevice = async (id) => {
  try {
    await DeviceApi.delete(`${ENDPOINT}/${id}`);
    return { success: true };
  } catch (err) {
    throw new Error(err.response?.data?.message || "Error al eliminar el dispositivo");
  }
};
