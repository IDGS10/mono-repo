-- Create extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create application database
CREATE DATABASE app_db;

-- Create application user
CREATE USER app_user WITH PASSWORD 'AppP@ssw0rd123!';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;

-- Create monitoring user
CREATE USER monitoring WITH PASSWORD 'MonitoringP@ss123!';
GRANT pg_monitor TO monitoring;