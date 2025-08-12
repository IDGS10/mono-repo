# PostgreSQL Docker Deployment Guide for Windows

## Prerequisites for Windows

### 1. Install Required Software
```powershell
# Install Docker Desktop for Windows
# Download from: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

# Verify installation
docker --version
docker-compose --version

# Enable WSL 2 if not already enabled
wsl --install
```

### 2. Configure Docker Desktop
- Enable "Use WSL 2 based engine"
- Allocate at least 4GB RAM to Docker
- Enable file sharing for your project directory

## Step 1: Project Structure Setup (Windows)

Create the project structure using PowerShell or Command Prompt:

```powershell
# Create main directory
New-Item -ItemType Directory -Path "C:\postgres-docker" -Force
Set-Location "C:\postgres-docker"

# Create subdirectories
New-Item -ItemType Directory -Path "config\postgres" -Force
New-Item -ItemType Directory -Path "config\pgbouncer" -Force
New-Item -ItemType Directory -Path "scripts\init" -Force
New-Item -ItemType Directory -Path "scripts\backup" -Force
New-Item -ItemType Directory -Path "data" -Force
New-Item -ItemType Directory -Path "logs" -Force
New-Item -ItemType Directory -Path "backups" -Force
New-Item -ItemType Directory -Path "archive" -Force
```

## Step 2: Create Configuration Files (Windows Compatible)

### 2.1 Docker Compose File (docker-compose.yml)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-primary
    restart: unless-stopped
    
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-production_db}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
      PGDATA: /var/lib/postgresql/data/pgdata
      
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - postgres_logs:/var/log/postgresql
      - ./config/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
      - ./config/postgres/pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
      - ./scripts/init:/docker-entrypoint-initdb.d:ro
      - postgres_backups:/backups
      - postgres_archive:/var/lib/postgresql/archive
    
    # Simplified command for Windows compatibility
    command: >
      postgres
      -c config_file=/etc/postgresql/postgresql.conf
      -c hba_file=/etc/postgresql/pg_hba.conf
      -c log_destination=stderr
      -c logging_collector=off
    
    # More lenient health check for Windows
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-production_db} || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    
    networks:
      - postgres_network

  # Start exporter only after postgres is confirmed healthy
  postgres_exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: "postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-production_db}?sslmode=disable"
    ports:
      - "9187:9187"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - postgres_network
    profiles:
      - monitoring

  # Optional: PgBouncer (can be started separately)
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: pgbouncer
    restart: unless-stopped
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: ${POSTGRES_USER:-postgres}
      DATABASES_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASES_DBNAME: ${POSTGRES_DB:-production_db}
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 100
      DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - postgres_network
    profiles:
      - pooling

volumes:
  postgres_data:
    driver: local
  postgres_logs:
    driver: local
  postgres_backups:
    driver: local
  postgres_archive:
    driver: local

networks:
  postgres_network:
    driver: bridge
```

### 2.2 Environment File (.env)
```powershell
# Create .env file
@"
POSTGRES_DB=production_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SecureP@ssw0rd123!
POSTGRES_PORT=5432
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

### 2.3 PostgreSQL Configuration (config/postgres/postgresql.conf)
```powershell
# Create postgresql.conf
@"
# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 100

# Memory Settings (Conservative for Windows)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB

# Logging (Simplified for Windows)
log_destination = 'stderr'
logging_collector = off
log_statement = 'none'
log_min_duration_statement = 1000

# Basic WAL settings
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Checkpoint settings
checkpoint_timeout = 5min
checkpoint_completion_target = 0.5
"@ | Out-File -FilePath "config\postgres\postgresql.conf" -Encoding UTF8
```

### 2.4 Authentication Configuration (config/postgres/pg_hba.conf)
```powershell
# Create pg_hba.conf
@"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    all             all             0.0.0.0/0               scram-sha-256
"@ | Out-File -FilePath "config\postgres\pg_hba.conf" -Encoding UTF8
```

### 2.5 Database Initialization Script (scripts/init/01-setup.sql)
```powershell
# Create initialization script
@"
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
"@ | Out-File -FilePath "scripts\init\01-setup.sql" -Encoding UTF8
```

## Step 3: Deployment Steps (Windows)

### 3.1 Start PostgreSQL Only First
```powershell
# Navigate to project directory
Set-Location "C:\postgres-docker"

# Start only PostgreSQL container first
docker-compose up -d postgres

# Wait and check logs
Start-Sleep -Seconds 30
docker-compose logs postgres
```

### 3.2 Verify PostgreSQL Health
```powershell
# Check container status
docker-compose ps

# Check health status
docker inspect postgres-primary --format='{{.State.Health.Status}}'

# Test connection
docker-compose exec postgres pg_isready -U postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d production_db -c "SELECT version();"
```

### 3.3 Start Additional Services (Optional)
```powershell
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Or start with connection pooling
docker-compose --profile pooling up -d

# Or start everything
docker-compose --profile monitoring --profile pooling up -d
```

## Step 4: Troubleshooting Windows Issues

### 4.1 Fix Unhealthy Container
```powershell
# Stop all services
docker-compose down

# Remove volumes if corrupted
docker-compose down -v

# Rebuild and start
docker-compose up -d postgres --force-recreate

# Check logs for specific errors
docker-compose logs postgres --tail=50
```

### 4.2 Windows-Specific Fixes

**File Path Issues:**
```powershell
# Ensure proper file paths in volumes
# Use forward slashes even on Windows in docker-compose.yml
# Example: ./config/postgres/postgresql.conf (not .\config\postgres\postgresql.conf)
```

**Line Ending Issues:**
```powershell
# Convert files to Unix line endings if needed
# In VS Code: Change EOL from CRLF to LF
# Or use PowerShell:
(Get-Content "config\postgres\postgresql.conf") -join "`n" | Set-Content "config\postgres\postgresql.conf" -NoNewline
```

**Permission Issues:**
```powershell
# Grant full access to Docker directories
icacls "C:\postgres-docker" /grant Everyone:F /T
```

### 4.3 Quick Diagnostic Commands
```powershell
# Check Docker daemon
docker version

# Check container logs
docker-compose logs postgres --tail=20

# Check container processes
docker-compose exec postgres ps aux

# Check disk space
docker system df

# Test network connectivity
docker-compose exec postgres ping google.com
```

## Step 5: Simplified Startup Script (Windows Batch)

Create `start-postgres.bat`:
```batch
@echo off
echo Starting PostgreSQL Docker Container...

cd /d C:\postgres-docker

echo Stopping any existing containers...
docker-compose down

echo Starting PostgreSQL...
docker-compose up -d postgres

echo Waiting for PostgreSQL to be ready...
timeout /t 30 /nobreak > nul

echo Checking PostgreSQL status...
docker-compose exec postgres pg_isready -U postgres

if %errorlevel% equ 0 (
    echo PostgreSQL is ready!
    echo Connection string: postgresql://postgres:SecureP@ssw0rd123!@localhost:5432/production_db
) else (
    echo PostgreSQL failed to start properly
    docker-compose logs postgres
)

pause
```

## Step 6: VS Code Integration

### 6.1 VS Code Tasks (.vscode/tasks.json)
```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start PostgreSQL",
            "type": "shell",
            "command": "docker-compose",
            "args": ["up", "-d", "postgres"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Stop PostgreSQL",
            "type": "shell",
            "command": "docker-compose",
            "args": ["down"],
            "group": "build"
        },
        {
            "label": "View PostgreSQL Logs",
            "type": "shell",
            "command": "docker-compose",
            "args": ["logs", "-f", "postgres"],
            "group": "test"
        }
    ]
}
```

### 6.2 PowerShell Quick Commands
```powershell
# Create aliases for easy management
function Start-PostgreSQL {
    Set-Location "C:\postgres-docker"
    docker-compose up -d postgres
}

function Stop-PostgreSQL {
    Set-Location "C:\postgres-docker"
    docker-compose down
}

function Connect-PostgreSQL {
    docker-compose exec postgres psql -U postgres -d production_db
}

# Add to PowerShell profile
Set-Alias -Name pgstart -Value Start-PostgreSQL
Set-Alias -Name pgstop -Value Stop-PostgreSQL
Set-Alias -Name pgconnect -Value Connect-PostgreSQL
```

## Common Windows Issues and Solutions

| Issue | Solution |
|-------|----------|
| "postgres-primary is unhealthy" | Increase health check intervals, check logs |
| File not found errors | Use forward slashes in docker-compose.yml paths |
| Permission denied | Run Docker Desktop as administrator |
| Slow startup | Increase Docker Desktop memory allocation |
| Line ending issues | Convert config files to LF line endings |

The key changes for Windows:
- Simplified health checks
- More conservative resource settings
- Proper file path handling
- Profile-based service startup
- Windows-specific troubleshooting steps