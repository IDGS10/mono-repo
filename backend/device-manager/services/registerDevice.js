const db = require('../config/db');

const registerDevice = async (data) => {
  const {
    name,
    type,
    status,
    SSID,
    device_ip,
    certificate,
    password,
    mac_address,
    connection_type,
    device_token,
    firmware_version,
    version,
    is_active,
    health_status,
    error_logs,
    maintenance_date,
    notes,
    created_by,
    swarm_id,
    organization_id
  } = data;

  const query = `
    INSERT INTO devices (
      name, type, status, SSID, device_ip, certificate, password,
      mac_address, connection_type, device_token, firmware_version, version,
      is_active, health_status, error_logs, maintenance_date, notes, created_by
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18
    )
    RETURNING *;
  `;

  const values = [
    name, type, status, SSID, device_ip, certificate, password,
    mac_address, connection_type, device_token, firmware_version, version,
    is_active, health_status, error_logs, maintenance_date, notes, created_by
  ];

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Error registering device: ' + error.message);
  }
};

module.exports = { registerDevice };
