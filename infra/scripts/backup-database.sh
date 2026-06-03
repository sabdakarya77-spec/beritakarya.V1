#!/bin/bash

# Database Backup Script for BeritaKarya
# Usage: ./backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/beritakarya"
BACKUP_FILE="$BACKUP_DIR/beritakarya_backup_$DATE.sql"

# Container name matches docker-compose.backend.yml (beritakarya_db)
DB_CONTAINER="${DB_CONTAINER:-beritakarya_db}"
DB_NAME="${DB_NAME:-beritakarya_prod}"
DB_USER="${DB_USER:-beritakarya}"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup database
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
PG_STATUS=$?

# Send notification on success/failure based on pg_dump status
if [ $PG_STATUS -eq 0 ]; then
  # Compress backup only if pg_dump succeeded
  gzip "$BACKUP_FILE"
  
  # Keep only last 7 days of backups (run only on successful backup)
  find "$BACKUP_DIR" -name "beritakarya_backup_*.sql.gz" -mtime +7 -delete
  
  echo "✅ Backup successful" | mail -s "Backup Success - BeritaKarya" adminberitakarya@gmail.com
  exit 0
else
  # Cleanup potential incomplete/failed backup file
  rm -f "$BACKUP_FILE"
  echo "❌ Backup failed during pg_dump execution" | mail -s "Backup FAILED - BeritaKarya" adminberitakarya@gmail.com
  exit 1
fi
