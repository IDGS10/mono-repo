/*
    Author: Angel Eduardo Anaya Becerril
    Created: 2025-07-22

    Comment: Index creation to perform optimizations on the MasterAnalytics tables.
*/

-- Device metrics indexes
CREATE INDEX idx_device_metrics_hourly_device_time ON device_metrics_hourly (device_id, hour_timestamp DESC);
CREATE INDEX idx_device_metrics_hourly_time ON device_metrics_hourly (hour_timestamp DESC);
CREATE INDEX idx_device_metrics_daily_device_date ON device_metrics_daily (device_id, date DESC);

-- Sensor metrics indexes
CREATE INDEX idx_sensor_metrics_hourly_device_sensor_time ON sensor_metrics_hourly (device_id, sensor_type_id, hour_timestamp DESC);
CREATE INDEX idx_sensor_metrics_hourly_sensor_time ON sensor_metrics_hourly (sensor_type_id, hour_timestamp DESC);
CREATE INDEX idx_sensor_metrics_hourly_time ON sensor_metrics_hourly (hour_timestamp DESC);

-- Swarm metrics indexes
CREATE INDEX idx_swarm_metrics_hourly_swarm_time ON swarm_metrics_hourly (swarm_id, hour_timestamp DESC);
CREATE INDEX idx_swarm_metrics_hourly_time ON swarm_metrics_hourly (hour_timestamp DESC);

-- Alert metrics indexes
CREATE INDEX idx_alert_metrics_hourly_time_swarm ON alert_metrics_hourly (hour_timestamp DESC, swarm_id);

-- Baseline indexes
CREATE INDEX idx_sensor_baselines_device_sensor ON sensor_baselines (device_id, sensor_type_id);
CREATE INDEX idx_sensor_baselines_time_pattern ON sensor_baselines (hour_of_day, day_of_week);

-- API performance indexes
CREATE INDEX idx_api_performance_time ON api_performance_metrics (hour_timestamp DESC);

