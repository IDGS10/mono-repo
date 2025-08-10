const db = require('../config/db');

// Obtener todos los dispositivos
const getAllDevices = async () => {
  try {
    const result = await db.query('SELECT id, name, type, status, mac_address FROM devices;');
    return result.rows;
  } catch (error) {
    throw new Error('Error fetching devices: ' + error.message);
  }
};

const getDeviceById = async (id) => {
  try {
    const result = await db.query('SELECT id, name, type, status, mac_address FROM devices WHERE id = $1;', [id]);
    return result.rows[0];
  } catch (error) {
    throw new Error('Error fetching device by ID: ' + error.message);
  }
};

module.exports = { getAllDevices, getDeviceById };
