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



SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE 'sensor_readings_%'
ORDER BY tablename;

-- Detailed partition information
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'sensor_readings_%'
ORDER BY tablename;


-- Create automatically partitions over data range
DO $$
DECLARE
    current_date date := '2024-08-01'::date;
    end_date date := '2026-02-01'::date;
BEGIN
    WHILE current_date < end_date LOOP
        PERFORM create_monthly_partition('sensor_readings', current_date);
        current_date := current_date + interval '1 month';
    END LOOP;
END $$;
SELECT create_monthly_partition('sensor_readings', '2025-09-01'::date);
SELECT create_monthly_partition('sensor_readings', '2025-10-01'::date);
SELECT create_monthly_partition('sensor_readings', '2025-11-01'::date);
SELECT create_monthly_partition('sensor_readings', '2025-12-01'::date);

-- 2026 (just an example)
SELECT create_monthly_partition('sensor_readings', '2026-01-01'::date);



--- NEW FUNCTION TO CREATE AUTOMATIC PARTITIONS OVER THE CURRENT MONTH
CREATE OR REPLACE FUNCTION maintain_sensor_readings_partitions()
RETURNS void AS $$
DECLARE
    current_month date := date_trunc('month', CURRENT_DATE);
BEGIN
    -- For the current month and 2 next
    PERFORM create_monthly_partition('sensor_readings', current_month);
    PERFORM create_monthly_partition('sensor_readings', current_month + interval '1 month');
    PERFORM create_monthly_partition('sensor_readings', current_month + interval '2 months');
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