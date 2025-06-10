-- Enable common extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- Create monitoring user
CREATE USER monitoring WITH PASSWORD 'MonitoringP@ss123!';
GRANT pg_monitor TO monitoring;

-- Create application database and user
CREATE DATABASE app_db;
CREATE USER app_user WITH PASSWORD 'AppUserP@ss123!';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;