#!/usr/bin/env bash
# Validate TypeScript compilation across all services
set -e

echo "═══ KITZ OS Build Validation ═══"
echo ""

SERVICES=(
  "kitz_os"
  "kitz-brain"
  "kitz-gateway"
  "kitz-llm-hub"
  "kitz-payments"
  "kitz-notifications-queue"
  "kitz-email-connector"
  "kitz-whatsapp-connector"
  "kitz-services"
  "admin-kitz-services"
  "kitz-schemas"
)

PASS=0
FAIL=0

for svc in "${SERVICES[@]}"; do
  if [ -d "$svc" ] && [ -f "$svc/tsconfig.json" ]; then
    echo -n "  $svc ... "
    if cd "$svc" && npx tsc --noEmit 2>/dev/null; then
      echo "✅"
      PASS=$((PASS + 1))
    else
      echo "❌"
      FAIL=$((FAIL + 1))
    fi
    cd ..
  fi
done

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All builds clean! ✅"
