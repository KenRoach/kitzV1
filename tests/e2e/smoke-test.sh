#!/usr/bin/env bash
#
# KITZ MVP E2E Smoke Test
# Exercises the full signup → workspace CRUD flow.
#
# Usage:
#   ./tests/e2e/smoke-test.sh              # default: localhost
#   GATEWAY=http://host:4000 WORKSPACE=http://host:3001 ./tests/e2e/smoke-test.sh
#
# Prerequisites: curl, jq

set -euo pipefail

GATEWAY="${GATEWAY:-http://localhost:4000}"
WORKSPACE="${WORKSPACE:-http://localhost:3001}"
PASS=0
FAIL=0
RAND=$(date +%s)

green() { printf "\033[32m✓ %s\033[0m\n" "$1"; }
red()   { printf "\033[31m✗ %s\033[0m\n" "$1"; }

check() {
  local desc="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    green "$desc"
    PASS=$((PASS + 1))
  else
    red "$desc (expected '$expected', got '$actual')"
    FAIL=$((FAIL + 1))
  fi
}

check_not_empty() {
  local desc="$1" actual="$2"
  if [ -n "$actual" ] && [ "$actual" != "null" ]; then
    green "$desc"
    PASS=$((PASS + 1))
  else
    red "$desc (empty or null)"
    FAIL=$((FAIL + 1))
  fi
}

echo "═══════════════════════════════════════════"
echo "  KITZ MVP Smoke Test"
echo "  Gateway:   $GATEWAY"
echo "  Workspace: $WORKSPACE"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. Health checks ──
echo "── Health Checks ──"
GW_HEALTH=$(curl -sf "$GATEWAY/health" 2>/dev/null || echo '{}')
check "Gateway health" "$(echo "$GW_HEALTH" | jq -r '.status // empty')" "ok"

WS_HEALTH=$(curl -sf "$WORKSPACE/health" 2>/dev/null || echo '{}')
check "Workspace health" "$(echo "$WS_HEALTH" | jq -r '.status // empty')" "ok"

# ── 2. Signup ──
echo ""
echo "── Signup ──"
EMAIL="smoke-${RAND}@test.kitz.services"
SIGNUP_RES=$(curl -sf -X POST "$GATEWAY/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"name\":\"Smoke Test\"}" 2>/dev/null || echo '{}')

TOKEN=$(echo "$SIGNUP_RES" | jq -r '.token // empty')
USER_ID=$(echo "$SIGNUP_RES" | jq -r '.userId // empty')
check_not_empty "Signup returns token" "$TOKEN"
check_not_empty "Signup returns userId" "$USER_ID"

if [ -z "$TOKEN" ]; then
  echo ""
  red "Cannot continue without auth token. Aborting."
  echo "Signup response: $SIGNUP_RES"
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

# ── 3. Login with same credentials ──
echo ""
echo "── Login ──"
LOGIN_RES=$(curl -sf -X POST "$GATEWAY/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\"}" 2>/dev/null || echo '{}')

LOGIN_TOKEN=$(echo "$LOGIN_RES" | jq -r '.token // empty')
check_not_empty "Login returns token" "$LOGIN_TOKEN"

# ── 4. Workspace CRUD: Leads ──
echo ""
echo "── CRM: Leads ──"
CREATE_LEAD=$(curl -sf -X POST "$WORKSPACE/api/workspace/leads" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"name\":\"María García\",\"phone\":\"+507-6000-1234\",\"email\":\"maria@test.com\"}" 2>/dev/null || echo '{}')

LEAD_ID=$(echo "$CREATE_LEAD" | jq -r '.id // empty')
check_not_empty "Create lead returns id" "$LEAD_ID"

LIST_LEADS=$(curl -sf "$WORKSPACE/api/workspace/leads" -H "$AUTH" 2>/dev/null || echo '[]')
LEAD_COUNT=$(echo "$LIST_LEADS" | jq 'length')
check "List leads count >= 1" "$([ "$LEAD_COUNT" -ge 1 ] && echo yes || echo no)" "yes"

# ── 5. Workspace CRUD: Orders ──
echo ""
echo "── Orders ──"
CREATE_ORDER=$(curl -sf -X POST "$WORKSPACE/api/workspace/orders" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"description\":\"2 camisas para María\",\"total\":45.00,\"status\":\"pending\"}" 2>/dev/null || echo '{}')

ORDER_ID=$(echo "$CREATE_ORDER" | jq -r '.id // empty')
check_not_empty "Create order returns id" "$ORDER_ID"

LIST_ORDERS=$(curl -sf "$WORKSPACE/api/workspace/orders" -H "$AUTH" 2>/dev/null || echo '[]')
ORDER_COUNT=$(echo "$LIST_ORDERS" | jq 'length')
check "List orders count >= 1" "$([ "$ORDER_COUNT" -ge 1 ] && echo yes || echo no)" "yes"

# ── 6. Workspace CRUD: Tasks ──
echo ""
echo "── Tasks ──"
CREATE_TASK=$(curl -sf -X POST "$WORKSPACE/api/workspace/tasks" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"title\":\"Follow up with María\"}" 2>/dev/null || echo '{}')

TASK_ID=$(echo "$CREATE_TASK" | jq -r '.id // empty')
check_not_empty "Create task returns id" "$TASK_ID"

# ── 7. Workspace CRUD: Products ──
echo ""
echo "── Products ──"
CREATE_PRODUCT=$(curl -sf -X POST "$WORKSPACE/api/workspace/products" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"name\":\"Camiseta KITZ\",\"price\":25.00,\"sku\":\"CAMISA-001\",\"stock_qty\":50}" 2>/dev/null || echo '{}')

PRODUCT_ID=$(echo "$CREATE_PRODUCT" | jq -r '.id // empty')
check_not_empty "Create product returns id" "$PRODUCT_ID"

# ── 8. Workspace CRUD: Payments ──
echo ""
echo "── Payments ──"
CREATE_PAYMENT=$(curl -sf -X POST "$WORKSPACE/api/workspace/payments" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"type\":\"incoming\",\"description\":\"Pago de María\",\"amount\":45.00,\"status\":\"completed\",\"method\":\"yappy\"}" 2>/dev/null || echo '{}')

PAYMENT_ID=$(echo "$CREATE_PAYMENT" | jq -r '.id // empty')
check_not_empty "Create payment returns id" "$PAYMENT_ID"

# ── 9. Workspace CRUD: Checkout Links ──
echo ""
echo "── Checkout Links ──"
CREATE_CHECKOUT=$(curl -sf -X POST "$WORKSPACE/api/workspace/checkout-links" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"amount\":25.00,\"label\":\"Camiseta KITZ\"}" 2>/dev/null || echo '{}')

CHECKOUT_ID=$(echo "$CREATE_CHECKOUT" | jq -r '.id // empty')
check_not_empty "Create checkout link returns id" "$CHECKOUT_ID"

# ── Summary ──
echo ""
echo "═══════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
