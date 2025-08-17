CREATE TABLE sensor_readings_backup AS 
SELECT * FROM sensor_readings;

DROP TABLE IF EXISTS sensor_readings CASCADE;

-- Create table without partitions
CREATE TABLE sensor_readings (
    reading_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    sensor_type_id INTEGER REFERENCES sensor_types(sensor_type_id),
    raw_value DECIMAL(10,4) NOT NULL,
    calibrated_value DECIMAL(10,4),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quality_score DECIMAL(3,2) DEFAULT 1.0, -- Data quality indicator (0-1)
    metadata JSONB, -- Additional sensor-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_sensor_readings_device_timestamp ON sensor_readings (device_id, timestamp);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings (timestamp DESC);
CREATE INDEX idx_sensor_readings_sensor_type ON sensor_readings (sensor_type_id);
CREATE INDEX idx_sensor_readings_device_sensor ON sensor_readings (device_id, sensor_type_id);
-- Restore data
INSERT INTO sensor_readings SELECT * FROM sensor_readings_backup;