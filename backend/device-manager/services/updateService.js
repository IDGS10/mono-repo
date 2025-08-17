const db = require('../config/db');

const updateDevice = async (id, data) => {
  const {
    name,
    type,
    status,
    SSID,
    device_ip,
    certificate,
    password
  } = data;

  const query = `
    UPDATE devices
    SET name = $1, type = $2, status = $3, SSID = $4, device_ip = $5, certificate = $6, password = $7
    WHERE id = $8
    RETURNING *;
  `;

  const values = [name, type, status, SSID, device_ip, certificate, password, id];

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Error updating device: ' + error.message);
  }
};

module.exports = { updateDevice };
