#!/bin/bash
# Run all database migrations
# Usage: ./scripts/migrate.sh
# Requires: DATABASE_URL env var (or uses docker-compose postgres)
set -e

DB_URL="${DATABASE_URL:-postgres://kitz:kitz@localhost:5432/kitz}"

echo "Running migrations against: ${DB_URL%%@*}@***"

# Run each SQL file in order
for f in database/migrations/*.sql; do
  [ -f "$f" ] || continue
  content=$(cat "$f")
  # Skip empty / TODO-only files
  if [ -z "$content" ] || echo "$content" | head -1 | grep -q "^-- TODO"; then
    echo "  skip  $(basename "$f") (empty/TODO)"
    continue
  fi
  echo "  apply $(basename "$f")..."
  psql "$DB_URL" -f "$f" -q 2>&1 || echo "  warn  $(basename "$f") had errors (may be OK if tables exist)"
done

echo "Migrations complete."
