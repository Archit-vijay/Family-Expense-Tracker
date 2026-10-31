#!/usr/bin/env bash
# ==============================================================================
# Family Finance — Automated PostgreSQL Database Backup Script
# ==============================================================================
# Takes a compressed snapshot of the PostgreSQL database and rotates backups.
# Recommended cron schedule (every day at 2:00 AM):
#   0 2 * * * /path/to/Family-Expense-Tracker/scripts/backup-database.sh >> /var/log/cron-backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${POSTGRES_DB:-family_expense_tracker}"
DB_USER="${POSTGRES_USER:-postgres}"
RETENTION_DAYS=7

# Detect running database container (dev or prod)
if docker ps --format '{{.Names}}' | grep -q "^family-finance-prod-db$"; then
    CONTAINER="family-finance-prod-db"
elif docker ps --format '{{.Names}}' | grep -q "^family-finance-db$"; then
    CONTAINER="family-finance-db"
else
    echo "[ERROR] No running Family Finance database container found!"
    exit 1
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/family_finance_backup_${TIMESTAMP}.sql.gz"

echo "[INFO] $(date): Starting backup for database '${DB_NAME}' from container '${CONTAINER}'..."

# Execute pg_dump inside container and pipe directly to gzip compression
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify backup was created and is non-empty
if [ -s "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[SUCCESS] Backup completed: ${BACKUP_FILE} (Size: ${FILE_SIZE})"
else
    echo "[ERROR] Backup failed or generated empty archive!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Rotate backups: remove archives older than retention window
echo "[INFO] Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "family_finance_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} +

echo "[INFO] Backup procedure finished successfully."
