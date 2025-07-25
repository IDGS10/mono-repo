/*

Author: Angel Eduardo Anaya Becerril

Created: 2025-07-21

Comment: This script relates the creation schemas for postgreSQL to manage metrics reports, business logic and 
data management for the application of swarms where we are focusing on ESP32 devices distribution and
monitoring.

*/

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Device Swarms table - groups of related ESP32 devices
CREATE TABLE device_swarms (
    swarm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swarm_name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Individual ESP32 devices
CREATE TABLE esp32_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swarm_id UUID REFERENCES device_swarms(swarm_id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    mac_address VARCHAR(17) UNIQUE NOT NULL, -- MAC address format: XX:XX:XX:XX:XX:XX ONLY IF IS NEEDED AND PROVIDED
    firmware_version VARCHAR(50),
    last_ip_address INET,
    device_type VARCHAR(50) DEFAULT 'ESP32',
    location VARCHAR(200),
    installation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT false,
    battery_level DECIMAL(5,2), -- Percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sensor types definition
CREATE TABLE sensor_types (
    sensor_type_id SERIAL PRIMARY KEY,
    sensor_name VARCHAR(50) UNIQUE NOT NULL,
    unit VARCHAR(20),
    description TEXT,
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    precision_digits INTEGER DEFAULT 2
);

-- Device-Sensor mapping (which sensors each device has) .NET API is responsible for managing this
CREATE TABLE device_sensors (
    device_sensor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    sensor_type_id INTEGER REFERENCES sensor_types(sensor_type_id),
    sensor_pin INTEGER,
    calibration_offset DECIMAL(10,4) DEFAULT 0,
    calibration_multiplier DECIMAL(10,4) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, sensor_type_id, sensor_pin)
);

-- Main sensor readings table (partitioned by time)
-- PATITIONS NEED TO BE CHECKED FRECUENTLY TO AVOID OVERFLOW
CREATE TABLE sensor_readings (
    reading_id UUID DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    sensor_type_id INTEGER REFERENCES sensor_types(sensor_type_id),
    raw_value DECIMAL(10,4) NOT NULL,
    calibrated_value DECIMAL(10,4),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quality_score DECIMAL(3,2) DEFAULT 1.0, -- Data quality indicator (0-1)
    metadata JSONB, -- Additional sensor-specific data
    PRIMARY KEY (reading_id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Network connectivity logs
CREATE TABLE network_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    connection_type VARCHAR(20) DEFAULT 'WiFi', -- WiFi, Ethernet, Cellular
    signal_strength INTEGER, -- RSSI for WiFi
    network_name VARCHAR(100), -- SSID or network identifier
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    data_uploaded_kb DECIMAL(10,2),
    data_downloaded_kb DECIMAL(10,2)
);

-- Device status and health monitoring
CREATE TABLE device_status (
    status_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    cpu_usage DECIMAL(5,2), -- Percentage
    memory_used_kb INTEGER,
    memory_total_kb INTEGER,
    uptime_seconds BIGINT,
    temperature_internal DECIMAL(5,2), -- Internal ESP32 temperature
    wifi_rssi INTEGER,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alerts and notifications  CONSIDER IMPLEMENT A TRIGGER TO MANAGE ALERTS EMAIL SERVICE OR PUSH NOTIFICATIONS
CREATE TABLE device_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'offline', 'battery_low', 'error'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    threshold_value DECIMAL(10,4),
    actual_value DECIMAL(10,4),
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

