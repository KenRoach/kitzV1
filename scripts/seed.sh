#!/bin/bash
# Seed databases with initial data
# Usage: ./scripts/seed.sh
# Requires: psql + DATABASE_URL env var (or uses docker-compose postgres)
set -e

DB_URL="${DATABASE_URL:-postgres://kitz:kitz@localhost:5432/kitz}"

echo "Seeding database..."

for f in database/seed/*.sql; do
  [ -f "$f" ] || continue
  content=$(cat "$f")
  if [ -z "$content" ] || echo "$content" | head -1 | grep -q "^-- TODO"; then
    echo "  skip  $(basename "$f") (empty/TODO)"
    continue
  fi
  echo "  seed  $(basename "$f")..."
  psql "$DB_URL" -f "$f" -q 2>&1 || echo "  warn  $(basename "$f") had errors (may be OK if data exists)"
done

echo "Seeding complete."
