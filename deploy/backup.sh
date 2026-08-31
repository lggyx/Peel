#!/bin/bash
# Peel SQLite backup script
# Run via cron: 0 3 * * * /app/deploy/backup.sh

set -euo pipefail

BACKUP_DIR="/backup/peel"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# Backup downloaded videos and SQLite database
tar -czf "$BACKUP_DIR/peel-data-$DATE.tar.gz" \
  -C /app downloads/ \
  2>/dev/null || true

# Keep only last N days
find "$BACKUP_DIR" -name "peel-data-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[Backup] Completed: peel-data-$DATE.tar.gz"
