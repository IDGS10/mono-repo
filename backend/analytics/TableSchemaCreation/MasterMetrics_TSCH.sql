/*
    Author: Angel Eduardo Anaya Becerril
    Created: 2025-07-22
    Comment: Initialization of Metrics Schemas based on Master Tables
*/

-- Hourly device metrics (populated by API)
CREATE TABLE device_metrics_hourly (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Hour boundary (e.g., 2024-07-21 14:00:00)
    
    -- Connectivity metrics
    uptime_percentage DECIMAL(5,2), -- Percentage of hour device was online
    avg_signal_strength INTEGER, -- Average WiFi RSSI
    connection_drops INTEGER DEFAULT 0, -- Number of disconnections in the hour
    data_transmitted_kb DECIMAL(10,2) DEFAULT 0,
    data_received_kb DECIMAL(10,2) DEFAULT 0,
    
    -- Performance metrics
    avg_cpu_usage DECIMAL(5,2),
    max_cpu_usage DECIMAL(5,2),
    avg_memory_usage DECIMAL(5,2), -- Percentage
    max_memory_usage DECIMAL(5,2),
    avg_internal_temperature DECIMAL(5,2),
    max_internal_temperature DECIMAL(5,2),
    
    -- Health metrics
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    reading_count INTEGER DEFAULT 0, -- Total sensor readings in the hour
    failed_reading_count INTEGER DEFAULT 0,
    avg_battery_level DECIMAL(5,2),
    min_battery_level DECIMAL(5,2),
    
    -- Quality metrics
    avg_data_quality DECIMAL(3,2), -- Average quality score of readings
    out_of_range_readings INTEGER DEFAULT 0, -- Readings outside expected sensor ranges
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(device_id, hour_timestamp)
);

-- Hourly sensor metrics per device and sensor type (populated by API)
CREATE TABLE sensor_metrics_hourly (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    sensor_type_id INTEGER REFERENCES sensor_types(sensor_type_id),
    hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Basic statistics
    reading_count INTEGER DEFAULT 0,
    avg_value DECIMAL(10,4),
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    median_value DECIMAL(10,4),
    stddev_value DECIMAL(10,4),
    variance_value DECIMAL(10,4),
    
    -- Percentiles
    percentile_25 DECIMAL(10,4),
    percentile_75 DECIMAL(10,4),
    percentile_95 DECIMAL(10,4),
    percentile_99 DECIMAL(10,4),
    
    -- Trends and changes
    trend_direction VARCHAR(10), -- 'increasing', 'decreasing', 'stable'
    rate_of_change DECIMAL(10,6), -- Change per minute
    volatility_score DECIMAL(5,2), -- 0-100 scale of how volatile the readings were
    
    -- Quality metrics
    avg_quality_score DECIMAL(3,2),
    out_of_range_count INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0, -- Readings flagged as anomalies
    gap_count INTEGER DEFAULT 0, -- Number of expected readings that were missing
    
    -- Threshold violations
    above_threshold_count INTEGER DEFAULT 0,
    below_threshold_count INTEGER DEFAULT 0,
    threshold_violation_duration_minutes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(device_id, sensor_type_id, hour_timestamp)
);

-- Hourly swarm aggregated metrics (populated by API)
CREATE TABLE swarm_metrics_hourly (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swarm_id UUID REFERENCES device_swarms(swarm_id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Device health summary
    total_devices INTEGER DEFAULT 0,
    online_devices INTEGER DEFAULT 0,
    offline_devices INTEGER DEFAULT 0,
    avg_uptime_percentage DECIMAL(5,2),
    devices_with_alerts INTEGER DEFAULT 0,
    devices_with_critical_alerts INTEGER DEFAULT 0,
    
    -- Battery summary
    avg_battery_level DECIMAL(5,2),
    min_battery_level DECIMAL(5,2),
    low_battery_devices INTEGER DEFAULT 0, -- Devices below 20% battery
    
    -- Network summary
    avg_signal_strength INTEGER,
    total_connection_drops INTEGER DEFAULT 0,
    total_data_transmitted_kb DECIMAL(10,2) DEFAULT 0,
    total_data_received_kb DECIMAL(10,2) DEFAULT 0,
    
    -- Data collection summary
    total_readings INTEGER DEFAULT 0,
    failed_readings INTEGER DEFAULT 0,
    avg_data_quality DECIMAL(3,2),
    total_anomalies INTEGER DEFAULT 0,
    
    -- Alert summary
    new_alerts INTEGER DEFAULT 0,
    resolved_alerts INTEGER DEFAULT 0,
    active_alerts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(swarm_id, hour_timestamp)
);

-- Daily rollup metrics (populated by API from hourly data)
CREATE TABLE device_metrics_daily (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily summaries
    avg_uptime_percentage DECIMAL(5,2),
    total_connection_drops INTEGER DEFAULT 0,
    total_data_transmitted_kb DECIMAL(10,2) DEFAULT 0,
    avg_signal_strength INTEGER,
    avg_cpu_usage DECIMAL(5,2),
    avg_memory_usage DECIMAL(5,2),
    total_errors INTEGER DEFAULT 0,
    total_warnings INTEGER DEFAULT 0,
    total_readings INTEGER DEFAULT 0,
    avg_data_quality DECIMAL(3,2),
    min_battery_level DECIMAL(5,2),
    avg_battery_level DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(device_id, date)
);

-- Alert metrics hourly (populated by API)
CREATE TABLE alert_metrics_hourly (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    swarm_id UUID REFERENCES device_swarms(swarm_id) ON DELETE CASCADE,
    
    -- Alert counts by type
    threshold_alerts INTEGER DEFAULT 0,
    offline_alerts INTEGER DEFAULT 0,
    battery_alerts INTEGER DEFAULT 0,
    error_alerts INTEGER DEFAULT 0,
    connection_alerts INTEGER DEFAULT 0,
    
    -- Alert counts by severity
    low_severity_alerts INTEGER DEFAULT 0,
    medium_severity_alerts INTEGER DEFAULT 0,
    high_severity_alerts INTEGER DEFAULT 0,
    critical_severity_alerts INTEGER DEFAULT 0,
    
    -- Resolution metrics
    alerts_resolved INTEGER DEFAULT 0,
    avg_resolution_time_minutes DECIMAL(8,2),
    escalated_alerts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hour_timestamp, swarm_id)
);

-- Performance baseline tracking (for anomaly detection)
CREATE TABLE sensor_baselines (
    baseline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES esp32_devices(device_id) ON DELETE CASCADE,
    sensor_type_id INTEGER REFERENCES sensor_types(sensor_type_id),
    
    -- Time-based baselines
    hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    day_of_week INTEGER CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday
    
    -- Statistical baselines
    baseline_avg DECIMAL(10,4),
    baseline_stddev DECIMAL(10,4),
    baseline_min DECIMAL(10,4),
    baseline_max DECIMAL(10,4),
    
    -- Thresholds for anomaly detection
    upper_threshold DECIMAL(10,4), -- Mean + 2*StdDev
    lower_threshold DECIMAL(10,4), -- Mean - 2*StdDev
    
    -- Metadata
    sample_count INTEGER DEFAULT 0, -- Number of readings used to calculate baseline
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(device_id, sensor_type_id, hour_of_day, day_of_week)
);

-- System performance metrics (API processing metrics)
CREATE TABLE api_performance_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Processing metrics
    readings_processed INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    avg_processing_time_per_reading DECIMAL(8,4),
    
    -- Queue metrics
    max_queue_size INTEGER DEFAULT 0,
    avg_queue_size DECIMAL(8,2),
    queue_overflow_count INTEGER DEFAULT 0,
    
    -- Error metrics
    processing_errors INTEGER DEFAULT 0,
    timeout_errors INTEGER DEFAULT 0,
    connection_errors INTEGER DEFAULT 0,
    
    -- Database metrics
    db_query_count INTEGER DEFAULT 0,
    avg_db_query_time_ms DECIMAL(8,2),
    db_connection_errors INTEGER DEFAULT 0,
    
    -- Memory and CPU (if monitored by API)
    avg_memory_usage_mb DECIMAL(8,2),
    max_memory_usage_mb DECIMAL(8,2),
    avg_cpu_usage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hour_timestamp)
);