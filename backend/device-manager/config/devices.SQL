CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, 
    SSID VARCHAR(50) NOT NULL,
    device_ip VARCHAR(15) NOT NULL,
    mac_address VARCHAR(17),
    connection_type VARCHAR(20),

    certificate TEXT NOT NULL,
    password TEXT NOT NULL,
    device_token TEXT,
    firmware_version VARCHAR(50),
    version VARCHAR(50) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    health_status VARCHAR(50) DEFAULT 'OK',
    error_logs TEXT,
    maintenance_date DATE,
    notes TEXT,
    
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lectura (
    id SERIAL PRIMARY KEY,
    device_id INT NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    sensor_type VARCHAR(50),
    unit VARCHAR(10),
    
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (device_id) REFERENCES devices(id)
);
