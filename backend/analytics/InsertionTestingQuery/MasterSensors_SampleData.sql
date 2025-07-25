-- Insert common sensor types
INSERT INTO sensor_types (sensor_name, unit, description, min_value, max_value) VALUES
('temperature', '°C', 'Temperature sensor', -40.0, 85.0),
('humidity', '%', 'Relative humidity sensor', 0.0, 100.0),
('pressure', 'hPa', 'Atmospheric pressure sensor', 300.0, 1100.0),
('light', 'lux', 'Light intensity sensor', 0.0, 100000.0),
('motion', 'boolean', 'Motion detection sensor', 0.0, 1.0),
('soil_moisture', '%', 'Soil moisture sensor', 0.0, 100.0),
('air_quality', 'ppm', 'Air quality sensor (CO2)', 400.0, 5000.0),
('sound_level', 'dB', 'Sound level sensor', 30.0, 130.0),
('voltage', 'V', 'Voltage sensor', 0.0, 5.0),
('current', 'A', 'Current sensor', 0.0, 10.0);