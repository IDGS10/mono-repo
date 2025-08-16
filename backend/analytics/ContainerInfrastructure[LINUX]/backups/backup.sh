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