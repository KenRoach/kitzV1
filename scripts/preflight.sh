#!/usr/bin/env bash
##############################################################################
# KITZ Pre-Flight Launch Checklist
# Run this before deploying to production to validate all required config.
#
# Usage:  ./scripts/preflight.sh
#         ./scripts/preflight.sh --strict   (exit 1 on any warning)
##############################################################################

set -euo pipefail

STRICT="${1:-}"
ERRORS=0
WARNINGS=0

red()    { printf "\033[31m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
purple() { printf "\033[35m%s\033[0m\n" "$*"; }
dim()    { printf "\033[90m%s\033[0m\n" "$*"; }

fail()   { red   "  FAIL  $*"; ERRORS=$((ERRORS + 1)); }
warn()   { yellow "  WARN  $*"; WARNINGS=$((WARNINGS + 1)); }
pass()   { green  "  PASS  $*"; }
skip()   { dim    "  SKIP  $*"; }

echo ""
purple "  ██╗  ██╗██╗████████╗███████╗"
purple "  ██║ ██╔╝██║╚══██╔══╝╚══███╔╝"
purple "  █████╔╝ ██║   ██║     ███╔╝ "
purple "  ██╔═██╗ ██║   ██║    ███╔╝  "
purple "  ██║  ██╗██║   ██║   ███████╗"
purple "  ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝"
echo ""
purple "  Pre-Flight Launch Checklist"
dim    "  ─────────────────────────────────────────────"
echo ""

# ── 1. CRITICAL: Database ──────────────────────────────

purple "  1. Database Persistence"
if [ -n "${DATABASE_URL:-}" ]; then
  pass "DATABASE_URL is set"
else
  fail "DATABASE_URL not set — user data will be lost on container restart"
fi

if [ -n "${SUPABASE_URL:-}" ]; then
  pass "SUPABASE_URL is set"
else
  fail "SUPABASE_URL not set — workspace CRUD will use in-memory (data lost on restart)"
fi

if [ -n "${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SERVICE_KEY:-}}" ]; then
  pass "SUPABASE_SERVICE_ROLE_KEY is set"
else
  fail "SUPABASE_SERVICE_ROLE_KEY not set — DB writes will fail"
fi
echo ""

# ── 2. CRITICAL: Auth ──────────────────────────────────

purple "  2. Authentication"
if [ -n "${JWT_SECRET:-${DEV_TOKEN_SECRET:-}}" ]; then
  SECRET="${JWT_SECRET:-${DEV_TOKEN_SECRET:-}}"
  LEN=${#SECRET}
  if [ "$LEN" -ge 32 ]; then
    pass "JWT_SECRET is set ($LEN chars)"
  else
    warn "JWT_SECRET is only $LEN chars — should be 32+ for production"
  fi
else
  fail "JWT_SECRET / DEV_TOKEN_SECRET not set — auth will not work"
fi
echo ""

# ── 3. CRITICAL: Payment Webhooks ──────────────────────

purple "  3. Payment Webhooks"
if [ -n "${STRIPE_SECRET_KEY:-}" ]; then
  pass "STRIPE_SECRET_KEY is set"
else
  warn "STRIPE_SECRET_KEY not set — Stripe checkout links won't work"
fi

if [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  pass "STRIPE_WEBHOOK_SECRET is set"
else
  warn "STRIPE_WEBHOOK_SECRET not set — Stripe webhooks will reject"
fi

if [ -n "${YAPPY_WEBHOOK_SECRET:-}" ]; then
  pass "YAPPY_WEBHOOK_SECRET is set"
else
  skip "YAPPY_WEBHOOK_SECRET not set (Panama payments optional)"
fi

if [ -n "${BAC_WEBHOOK_SECRET:-}" ]; then
  pass "BAC_WEBHOOK_SECRET is set"
else
  skip "BAC_WEBHOOK_SECRET not set (BAC payments optional)"
fi
echo ""

# ── 4. AI / LLM Keys ──────────────────────────────────

purple "  4. AI / LLM Configuration"
if [ -n "${ANTHROPIC_API_KEY:-${CLAUDE_API_KEY:-}}" ]; then
  pass "ANTHROPIC_API_KEY is set"
else
  warn "ANTHROPIC_API_KEY not set — 155+ tools will return advisory only (no real AI)"
fi

if [ -n "${OPENAI_API_KEY:-${AI_API_KEY:-}}" ]; then
  pass "OPENAI_API_KEY is set"
else
  warn "OPENAI_API_KEY not set — no fallback LLM available"
fi

LIMIT="${AI_BATTERY_DAILY_LIMIT:-5}"
pass "AI_BATTERY_DAILY_LIMIT = $LIMIT credits/day"

if [ "${KILL_SWITCH:-false}" = "true" ]; then
  warn "KILL_SWITCH is ON — all AI execution is halted"
else
  pass "KILL_SWITCH is off"
fi
echo ""

# ── 5. External Integrations (Optional) ───────────────

purple "  5. External Integrations"
if [ -n "${GOOGLE_CLIENT_ID:-}" ] && [ -n "${GOOGLE_CLIENT_SECRET:-}" ]; then
  pass "Google OAuth configured (Gmail, Sheets, Calendar)"
else
  skip "Google OAuth not configured — Gmail/Sheets/Calendar tools will be advisory"
fi

if [ -n "${SHOPIFY_STORE_URL:-}" ] && [ -n "${SHOPIFY_ACCESS_TOKEN:-}" ]; then
  pass "Shopify configured"
else
  skip "Shopify not configured — Shopify tools will be advisory"
fi

if [ -n "${HUBSPOT_ACCESS_TOKEN:-}" ]; then
  pass "HubSpot configured"
else
  skip "HubSpot not configured — CRM tools will be advisory"
fi

if [ -n "${META_PAGE_ACCESS_TOKEN:-}" ] && [ -n "${META_PAGE_ID:-}" ]; then
  pass "Meta/Facebook configured"
else
  skip "Meta not configured — social media tools will be advisory"
fi

if [ -n "${MELI_ACCESS_TOKEN:-}" ] && [ -n "${MELI_USER_ID:-}" ]; then
  pass "MercadoLibre configured"
else
  skip "MercadoLibre not configured — MELI tools will be advisory"
fi
echo ""

# ── 6. Services ────────────────────────────────────────

purple "  6. Service URLs"
KITZ_OS="${KITZ_OS_URL:-http://localhost:3012}"
WA="${WA_CONNECTOR_URL:-http://localhost:3006}"
pass "KITZ_OS_URL = $KITZ_OS"
pass "WA_CONNECTOR_URL = $WA"
echo ""

# ── 7. Build Check ─────────────────────────────────────

purple "  7. TypeScript Build"
if command -v npx &> /dev/null; then
  pushd "$(dirname "$0")/../kitz_os" > /dev/null 2>&1 || true
  if npx tsc --noEmit 2>/dev/null; then
    pass "kitz_os TypeScript — zero errors"
  else
    warn "kitz_os TypeScript — has errors (run: cd kitz_os && npx tsc --noEmit)"
  fi
  popd > /dev/null 2>&1 || true
else
  skip "npx not found — skipping TypeScript check"
fi
echo ""

# ── Summary ────────────────────────────────────────────

dim "  ─────────────────────────────────────────────"
echo ""
if [ "$ERRORS" -gt 0 ]; then
  red "  ⛔ $ERRORS BLOCKERS, $WARNINGS warnings"
  red "  Fix the FAIL items above before deploying."
  echo ""
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  yellow "  ⚠  $WARNINGS warnings (no blockers)"
  if [ "$STRICT" = "--strict" ]; then
    yellow "  Strict mode: treating warnings as errors."
    echo ""
    exit 1
  fi
  yellow "  Launch is possible but experience will be degraded."
  echo ""
  exit 0
else
  green "  ✅ All checks passed — ready to launch!"
  echo ""
  exit 0
fi
