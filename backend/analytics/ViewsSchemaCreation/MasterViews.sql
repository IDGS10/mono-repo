/*
Author: Angel Eduardo Anaya Becerril
Created: 2025-07-22

Comment: This script referer to common views used in analytics module and will be 
placed over .NET 8 API to manage metrics reports and other calculations.
*/

-- Hourly aggregated sensor data
CREATE VIEW sensor_readings_hourly AS
SELECT 
    device_id,
    sensor_type_id,
    DATE_TRUNC('hour', timestamp) AS hour,
    COUNT(*) AS reading_count,
    AVG(calibrated_value) AS avg_value,
    MIN(calibrated_value) AS min_value,
    MAX(calibrated_value) AS max_value,
    STDDEV(calibrated_value) AS stddev_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY calibrated_value) AS median_value
FROM sensor_readings
GROUP BY device_id, sensor_type_id, DATE_TRUNC('hour', timestamp);

-- Daily aggregated sensor data
CREATE VIEW sensor_readings_daily AS
SELECT 
    device_id,
    sensor_type_id,
    DATE_TRUNC('day', timestamp) AS day,
    COUNT(*) AS reading_count,
    AVG(calibrated_value) AS avg_value,
    MIN(calibrated_value) AS min_value,
    MAX(calibrated_value) AS max_value,
    STDDEV(calibrated_value) AS stddev_value
FROM sensor_readings
GROUP BY device_id, sensor_type_id, DATE_TRUNC('day', timestamp);

-- Device health summary view
CREATE VIEW device_health_summary AS
SELECT 
    d.device_id,
    d.device_name,
    d.swarm_id,
    s.swarm_name,
    d.is_online,
    d.last_seen,
    d.battery_level,
    COALESCE(alerts.active_alerts, 0) AS active_alerts,
    COALESCE(alerts.critical_alerts, 0) AS critical_alerts
FROM esp32_devices d
LEFT JOIN device_swarms s ON d.swarm_id = s.swarm_id
LEFT JOIN (
    SELECT 
        device_id,
        COUNT(*) AS active_alerts,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) AS critical_alerts
    FROM device_alerts
    WHERE is_resolved = false
    GROUP BY device_id
) alerts ON d.device_id = alerts.device_id;

