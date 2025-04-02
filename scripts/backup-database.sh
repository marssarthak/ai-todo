#!/bin/bash

# Database backup script for AI Todo App
# This script creates a backup of the Supabase database using pg_dump

# Load environment variables if .env file exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Configuration - can be overridden by environment variables
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST=${DB_HOST:-"db.example.supabase.co"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"postgres"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"your-password"}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/ai_todo_backup_$TIMESTAMP.sql"

echo "Starting database backup..."
echo "Backing up to: $BACKUP_FILE"

# Use PGPASSWORD environment variable for authentication
export PGPASSWORD=$DB_PASSWORD

# Run pg_dump to create the backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully!"
  
  # Create compressed version of the backup
  gzip -9 $BACKUP_FILE
  echo "Backup compressed: ${BACKUP_FILE}.gz"
  
  # Remove backups older than 30 days
  find $BACKUP_DIR -name "ai_todo_backup_*.sql.gz" -type f -mtime +30 -delete
  echo "Old backups cleaned up."
else
  echo "Backup failed!"
  exit 1
fi

# Clear password from environment
unset PGPASSWORD

echo "Backup process completed at $(date)" 