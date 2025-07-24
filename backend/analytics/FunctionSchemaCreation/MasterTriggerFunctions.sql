/*
    Author: Angel Eduardo Anaya Becerril
    Created: 2025-07-22

    Comment: The current SQL script is for create trigger functions in PostgreSQL
    to manage automatic updates and partitions in the analytics module.

*/

-- Functions for automatic partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;



-- =================================================================
--      THIS QUERY IS JUST AN EXAMPLE OF HOW TO CREATE A TRIGGER 
--      FUNCTION IN POSTGRESQL, PLEASE EVALUATE BEFORE USING IT
--      TRIGGERS COULD BE DIFFICULT TO DEBUG AND MAINTAIN
--      
--      ! NOT EXECUTED !
-- =================================================================

-- Trigger to update device last_seen when new sensor reading arrives
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE esp32_devices 
    SET last_seen = NEW.timestamp, is_online = true
    WHERE device_id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_last_seen
    AFTER INSERT ON sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_device_last_seen();