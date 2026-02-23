#!/bin/bash
# Verify all services are running
# Usage: ./scripts/health-check.sh

services=(
  "kitz-gateway:4000"
  "workspace:3001"
  "kitz-payments:3005"
  "kitz-whatsapp-connector:3006"
  "kitz-email-connector:3007"
  "kitz-notifications-queue:3008"
  "kitz-services:3010"
  "admin-kitz-services:3011"
  "kitz_os:3012"
)

echo "🏥 Checking service health..."
for svc in "${services[@]}"; do
  name="${svc%%:*}"
  port="${svc##*:}"
  if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "  ✅ $name (:$port)"
  else
    echo "  ❌ $name (:$port)"
  fi
done
