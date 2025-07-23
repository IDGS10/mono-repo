/*
    Author: Angel Eduardo Anaya Becerril
    Date: 2025-07-22
    Comment: The next SQL script are used to enhance the performance of analytics queries
    creating corresponding indexes on the master tables.
    Please update based on analysis of query performance and access patterns.

    Important:
    Remember that indexes can improve read performance but may slow down write operations.
*/

-- Sensor readings indexes
CREATE INDEX idx_sensor_readings_device_timestamp ON sensor_readings (device_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_sensor_type_timestamp ON sensor_readings (sensor_type_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings (timestamp DESC);

-- Device indexes
CREATE INDEX idx_esp32_devices_swarm ON esp32_devices (swarm_id);
CREATE INDEX idx_esp32_devices_last_seen ON esp32_devices (last_seen DESC);
CREATE INDEX idx_esp32_devices_mac ON esp32_devices (mac_address);

-- Network logs indexes
CREATE INDEX idx_network_logs_device_connected ON network_logs (device_id, connected_at DESC);
CREATE INDEX idx_network_logs_ip ON network_logs (ip_address);

-- Status and alerts indexes
CREATE INDEX idx_device_status_device_timestamp ON device_status (device_id, timestamp DESC);
CREATE INDEX idx_device_alerts_device_unresolved ON device_alerts (device_id) WHERE is_resolved = false;
CREATE INDEX idx_device_alerts_severity ON device_alerts (severity, created_at DESC);
