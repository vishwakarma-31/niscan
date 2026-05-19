#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
count=0
while ! PGPASSWORD=postgres psql -h postgres -U postgres -d postgres -c '\q' 2>/dev/null; do
  count=$((count + 1))
  if [ $count -gt 30 ]; then
    echo "ERROR: PostgreSQL did not become ready in time"
    exit 1
  fi
  echo "  PostgreSQL not ready (attempt $count/30), waiting..."
  sleep 2
done
echo "  PostgreSQL is ready!"

echo "Running migrations..."
for f in /app/migrations/*.sql; do
  if [ -f "$f" ]; then
    echo "  Executing: $(basename $f)"
    psql "$DATABASE_URL" -f "$f" || echo "  [Warning: migration may have already run]"
  fi
done

echo "Seeding users..."
node seed.js

echo "Starting server..."
exec node server.js