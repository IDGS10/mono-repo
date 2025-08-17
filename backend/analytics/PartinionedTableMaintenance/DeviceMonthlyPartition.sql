/*
    Author: Angel Eduardo Anaya Becerril
    Created: 2025-07-22

    Comment: This script is used to manage partitioned tables for device monthly data in PostgreSQL.

*/

-- Create partitions for sensor_readings table (example: monthly partitions)
-- Current month
CREATE TABLE sensor_readings_2024_07 PARTITION OF sensor_readings
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

-- Next month
CREATE TABLE sensor_readings_2024_08 PARTITION OF sensor_readings
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');