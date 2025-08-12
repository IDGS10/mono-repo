# REMAIN THIS IS FOR LINUX INFRASTRUCTURE EVALUATE THEM
# PostgreSQL Docker Compose Deployment Guide

## Prerequisites

### System Requirements
- Docker Engine 20.10+ and Docker Compose 2.0+
- Minimum 8GB RAM (16GB recommended for production)
- SSD storage with at least 100GB free space
- Linux server (Ubuntu 20.04+ or CentOS 8+ recommended)

### Install Docker and Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Step 1: Directory Structure Setup

Create the project directory structure:

```bash
mkdir -p /opt/postgres-docker/{config,scripts,backups,data,logs,archive}
cd /opt/postgres-docker

# Create subdirectories
mkdir -p config/{postgres,pgbouncer}
mkdir -p scripts/{init,backup}
mkdir -p logs/postgresql
```

## Step 2: Create Configuration Files

### 2.1 Environment Variables (.env)
```bash
cat > .env << 'EOF'
# Database Configuration
POSTGRES_DB=production_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SecureP@ssw0rd123!
POSTGRES_PORT=5432

# Security Settings
POSTGRES_HOST_AUTH_METHOD=scram-sha-256

# Backup Settings
BACKUP_RETENTION_DAYS=30
EOF
```

### 2.2 PostgreSQL Configuration (postgresql.conf)
```bash
cat > config/postgres/postgresql.conf << 'EOF'
# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

# Memory Settings (adjust based on your server)
shared_buffers = 2GB                    # 25% of RAM
effective_cache_size = 6GB              # 75% of RAM
work_mem = 64MB
maintenance_work_mem = 512MB
wal_buffers = 64MB

# Checkpoint Settings
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 512MB

# Archiving and Replication
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
max_wal_senders = 3
wal_keep_size = 1GB

# Logging
logging_collector = on
log_destination = 'stderr'
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance
random_page_cost = 1.1                  # For SSD
effective_io_concurrency = 200          # For SSD
default_statistics_target = 100
EOF
```

### 2.3 Authentication Configuration (pg_hba.conf)
```bash
cat > config/postgres/pg_hba.conf << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     peer

# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             172.20.0.0/16           scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256

# Replication connections
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            scram-sha-256
host    replication     all             172.20.0.0/16           scram-sha-256
EOF
```

### 2.4 PgBouncer Configuration
```bash
cat > config/pgbouncer/pgbouncer.ini << 'EOF'
[databases]
production_db = host=postgres port=5432 dbname=production_db

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
admin_users = postgres
pool_mode = transaction
server_reset_query = DISCARD ALL
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 1
log_disconnections = 1
EOF

# Create userlist for PgBouncer
cat > config/pgbouncer/userlist.txt << 'EOF'
"postgres" "SCRAM-SHA-256$4096:salt$hash:serverkey"
EOF
```

### 2.5 Database Initialization Script
```bash
cat > scripts/init/01-create-extensions.sql << 'EOF'
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
EOF
```

### 2.6 Backup Scripts
```bash
cat > scripts/backup/backup.sh << 'EOF'
#!/bin/bash

# Configuration
POSTGRES_HOST="postgres"
POSTGRES_USER="postgres"
POSTGRES_DB="production_db"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
echo "Starting backup at $(date)"
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB \
    --verbose --format=custom --compress=9 \
    --file="$BACKUP_DIR/backup_${POSTGRES_DB}_${DATE}.dump"

# Backup globals (users, roles, etc.)
pg_dumpall -h $POSTGRES_HOST -U $POSTGRES_USER --globals-only \
    --file="$BACKUP_DIR/globals_${DATE}.sql"

# Compress SQL files
gzip "$BACKUP_DIR/globals_${DATE}.sql"

# Clean old backups
find $BACKUP_DIR -name "backup_*.dump" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "globals_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)"
EOF

chmod +x scripts/backup/backup.sh
```

## Step 3: Set Directory Permissions

```bash
# Create postgres user and set ownership
sudo groupadd -r postgres
sudo useradd -r -g postgres postgres

# Set proper permissions
sudo chown -R postgres:postgres /opt/postgres-docker/{data,logs,backups,archive}
sudo chmod 700 /opt/postgres-docker/{data,logs,backups,archive}
sudo chmod 644 config/postgres/*
sudo chmod 600 .env
```

## Step 4: Deploy the Stack

### 4.1 Start the Database
```bash
cd /opt/postgres-docker

# Start only PostgreSQL first
docker-compose up -d postgres

# Check logs
docker-compose logs -f postgres
```

### 4.2 Verify Database Connection
```bash
# Test connection
docker-compose exec postgres psql -U postgres -d production_db -c "SELECT version();"

# Check extensions
docker-compose exec postgres psql -U postgres -d production_db -c "\dx"
```

### 4.3 Start Additional Services
```bash
# Start monitoring
docker-compose up -d postgres_exporter

# Start connection pooler
docker-compose up -d pgbouncer

# Verify all services
docker-compose ps
```

## Step 5: Post-Deployment Configuration

### 5.1 Update PgBouncer Userlist
```bash
# Generate password hash for PgBouncer
docker-compose exec postgres psql -U postgres -c "SELECT 'postgres', passwd FROM pg_shadow WHERE usename = 'postgres';"

# Update userlist.txt with the actual hash
# Then restart PgBouncer
docker-compose restart pgbouncer
```

### 5.2 Configure Monitoring
```bash
# Test metrics endpoint
curl http://localhost:9187/metrics | grep pg_up
```

### 5.3 Setup Automated Backups
```bash
# Add to crontab for daily backups at 2 AM
echo "0 2 * * * docker-compose -f /opt/postgres-docker/docker-compose.yml run --rm postgres_backup /scripts/backup.sh" | sudo crontab -
```

## Step 6: Testing and Validation

### 6.1 Performance Testing
```bash
# Install pgbench
docker-compose exec postgres pgbench -i -s 50 production_db

# Run benchmark
docker-compose exec postgres pgbench -c 10 -j 2 -t 1000 production_db
```

### 6.2 Connection Testing
```bash
# Test direct PostgreSQL connection
docker-compose exec postgres psql -U postgres -d production_db

# Test PgBouncer connection
docker-compose exec pgbouncer psql -h localhost -p 6432 -U postgres -d production_db
```

### 6.3 Backup Testing
```bash
# Run manual backup
docker-compose run --rm postgres_backup /scripts/backup.sh

# Test restore (on a test database)
docker-compose exec postgres pg_restore -U postgres -d test_db /backups/backup_production_db_YYYYMMDD_HHMMSS.dump
```

## Step 7: Maintenance Operations

### 7.1 Regular Maintenance
```bash
# View active connections
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Vacuum and analyze
docker-compose exec postgres psql -U postgres -d production_db -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('production_db'));"
```

### 7.2 Log Management
```bash
# View PostgreSQL logs
docker-compose logs postgres

# View PgBouncer logs
docker-compose logs pgbouncer

# Rotate logs manually if needed
docker-compose exec postgres pg_ctl reload
```

### 7.3 Scaling Operations
```bash
# Scale connection pooler
docker-compose up -d --scale pgbouncer=2

# Update resource limits
# Edit docker-compose.yml and restart
docker-compose up -d postgres
```

## Step 8: Monitoring and Alerting

### 8.1 Health Checks
```bash
# Check service health
docker-compose ps
docker inspect postgres-primary | grep Health

# Database health
docker-compose exec postgres pg_isready -U postgres
```

### 8.2 Performance Monitoring
```bash
# Query performance
docker-compose exec postgres psql -U postgres -d production_db -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Connection stats via PgBouncer
docker-compose exec pgbouncer psql -h localhost -p 6432 -U postgres -d pgbouncer -c "SHOW STATS;"
```

## Troubleshooting

### Common Issues and Solutions

1. **Connection Refused**
   ```bash
   # Check if containers are running
   docker-compose ps
   
   # Check logs
   docker-compose logs postgres
   ```

2. **Permission Denied**
   ```bash
   # Fix ownership
   sudo chown -R postgres:postgres /opt/postgres-docker/data
   ```

3. **High Memory Usage**
   ```bash
   # Adjust postgresql.conf memory settings
   # Restart container
   docker-compose restart postgres
   ```

4. **Backup Failures**
   ```bash
   # Check backup permissions
   docker-compose exec postgres ls -la /backups
   
   # Test backup manually
   docker-compose run --rm postgres_backup /scripts/backup.sh
   ```

## Security Hardening

### Additional Security Measures
```bash
# 1. Change default port
sed -i 's/5432:5432/15432:5432/' docker-compose.yml

# 2. Use secrets instead of environment variables
# Create Docker secrets for passwords

# 3. Enable SSL/TLS
# Add SSL certificates to postgresql.conf

# 4. Implement firewall rules
sudo ufw allow from 10.0.0.0/8 to any port 15432

# 5. Regular security updates
docker-compose pull
docker-compose up -d
```

This guide provides a complete deployment workflow for a production-ready PostgreSQL setup with proper security, monitoring, and maintenance procedures.