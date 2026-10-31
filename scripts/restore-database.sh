#!/usr/bin/env bash
# ==============================================================================
# Family Finance — PostgreSQL Database Restore Script
# ==============================================================================
# Usage:
#   ./scripts/restore-database.sh backups/family_finance_backup_20261031_180000.sql.gz
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path-to-backup-file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${POSTGRES_DB:-family_expense_tracker}"
DB_USER="${POSTGRES_USER:-postgres}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERROR] Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Detect running database container
if docker ps --format '{{.Names}}' | grep -q "^family-finance-prod-db$"; then
    CONTAINER="family-finance-prod-db"
elif docker ps --format '{{.Names}}' | grep -q "^family-finance-db$"; then
    CONTAINER="family-finance-db"
else
    echo "[ERROR] No running Family Finance database container found!"
    exit 1
fi

echo "=================================================================="
echo "WARNING: Restoring will overwrite existing data in '${DB_NAME}'!"
echo "Target Container: ${CONTAINER}"
echo "Source Backup:    ${BACKUP_FILE}"
echo "=================================================================="
read -p "Are you sure you want to proceed with restore? (y/N): " -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Restore cancelled by user."
    exit 0
fi

echo "[INFO] Restoring database from compressed archive..."

# Terminate existing connections to allow clean restore
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

# Decompress and stream SQL into the database
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null

echo "[SUCCESS] Database restored successfully from ${BACKUP_FILE}!"
