# ==============================================================================
# Family Finance — PostgreSQL Database Backup Script (PowerShell for Windows)
# ==============================================================================
# Usage:
#   .\scripts\backup-database.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Detect running database container
$runningContainers = docker ps --format "{{.Names}}"
$container = $null

if ($runningContainers -contains "family-finance-prod-db") {
    $container = "family-finance-prod-db"
} elseif ($runningContainers -contains "family-finance-db") {
    $container = "family-finance-db"
} else {
    Write-Error "[ERROR] No running Family Finance database container found!"
    exit 1
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sqlFile = Join-Path $BackupDir "family_finance_backup_$timestamp.sql"
$zipFile = Join-Path $BackupDir "family_finance_backup_$timestamp.zip"

Write-Host "[INFO] Starting database backup from container '$container'..." -ForegroundColor Cyan

# Run pg_dump inside container
& docker exec $container pg_dump -U postgres family_expense_tracker | Out-File -FilePath $sqlFile -Encoding utf8

if ((Test-Path $sqlFile) -and ((Get-Item $sqlFile).Length -gt 0)) {
    # Compress into a lightweight zip file
    Compress-Archive -Path $sqlFile -DestinationPath $zipFile -Force
    Remove-Item $sqlFile -Force

    $sizeKB = [math]::Round(((Get-Item $zipFile).Length / 1KB), 2)
    Write-Host "[SUCCESS] Backup completed: $zipFile ($sizeKB KB)" -ForegroundColor Green
} else {
    Write-Error "[ERROR] Backup failed or generated empty file."
}
