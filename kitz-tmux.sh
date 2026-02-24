#!/bin/bash
# ═══════════════════════════════════════════════════════
# KITZ OS — tmux Session Launcher
# Creates a tmux session with all 14 agents/services
# Usage: ./kitz-tmux.sh
# ═══════════════════════════════════════════════════════

REPO="$(cd "$(dirname "$0")" && pwd)"
SESSION="kitz"

# Kill existing session if any
tmux kill-session -t "$SESSION" 2>/dev/null

# Allow more than 10 windows
tmux set-option -g base-index 0 2>/dev/null

# 0: postgres (docker-compose)
tmux new-session -d -s "$SESSION" -n "postgres" -c "$REPO"
tmux send-keys -t "$SESSION:postgres" "echo '🐘 PostgreSQL — port 5432'; docker compose up postgres" C-m

# 1: kitz-gateway (port 4000)
tmux new-window -t "$SESSION:1" -n "gateway" -c "$REPO/kitz-gateway"
tmux send-keys -t "$SESSION:1" "npm run dev  # port 4000 — Zero-trust API proxy" C-m

# 2: kitz-llm-hub (port 4010)
tmux new-window -t "$SESSION:2" -n "llm-hub" -c "$REPO/kitz-llm-hub"
tmux send-keys -t "$SESSION:2" "npm run dev  # port 4010 — Multi-provider LLM router" C-m

# 3: kitz-payments (port 3005)
tmux new-window -t "$SESSION:3" -n "payments" -c "$REPO/kitz-payments"
tmux send-keys -t "$SESSION:3" "npm run dev  # port 3005 — AI Battery ledger + webhooks" C-m

# 4: kitz-whatsapp-connector (port 3006)
tmux new-window -t "$SESSION:4" -n "whatsapp" -c "$REPO/kitz-whatsapp-connector"
tmux send-keys -t "$SESSION:4" "npm run dev  # port 3006 — WhatsApp Baileys bridge" C-m

# 5: kitz-email-connector (port 3007)
tmux new-window -t "$SESSION:5" -n "email" -c "$REPO/kitz-email-connector"
tmux send-keys -t "$SESSION:5" "npm run dev  # port 3007 — Email send/receive" C-m

# 6: kitz-notifications-queue (port 3008)
tmux new-window -t "$SESSION:6" -n "notif-q" -c "$REPO/kitz-notifications-queue"
tmux send-keys -t "$SESSION:6" "npm run dev  # port 3008 — FIFO queue + retry + DLQ" C-m

# 7: kitz-services (port 3010)
tmux new-window -t "$SESSION:7" -n "services" -c "$REPO/kitz-services"
tmux send-keys -t "$SESSION:7" "npm run dev  # port 3010 — Content hub + Panama compliance" C-m

# 8: admin-kitz-services (port 3011)
tmux new-window -t "$SESSION:8" -n "admin" -c "$REPO/admin-kitz-services"
tmux send-keys -t "$SESSION:8" "npm run dev  # port 3011 — Admin dashboard + API keys" C-m

# 9: kitz_os (port 3012) — Core AI Engine
tmux new-window -t "$SESSION:9" -n "kitz-os" -c "$REPO/kitz_os"
tmux send-keys -t "$SESSION:9" "npm run dev  # port 3012 — Core AI engine (68+ tools)" C-m

# 10: workspace (port 3001)
tmux new-window -t "$SESSION:10" -n "workspace" -c "$REPO/workspace"
tmux send-keys -t "$SESSION:10" "npm run dev  # port 3001 — Free manual workspace (CRM, orders)" C-m

# 11: kitz-brain (cron — no port)
tmux new-window -t "$SESSION:11" -n "brain" -c "$REPO/kitz-brain"
tmux send-keys -t "$SESSION:11" "npm run dev  # cron — Scheduled AI agents (daily/weekly)" C-m

# 12: AOS — Agent Operating System
tmux new-window -t "$SESSION:12" -n "aos" -c "$REPO/aos"
tmux send-keys -t "$SESSION:12" "npm run dev  # AOS — 30+ agent roles, event bus, ledger" C-m

# 13: logs (docker-compose logs)
tmux new-window -t "$SESSION:13" -n "logs" -c "$REPO"
tmux send-keys -t "$SESSION:13" "echo '📋 Tail all logs: docker compose logs -f'" C-m

# Go back to first window
tmux select-window -t "$SESSION:0"

echo ""
echo "══════════════════════════════════════════════"
echo "  🚀 KITZ OS tmux session ready!"
echo "══════════════════════════════════════════════"
echo ""
echo "  tmux attach -t kitz"
echo ""
echo "  Windows:"
tmux list-windows -t "$SESSION" -F "    #I: #W"
echo ""
echo "  Navigation:"
echo "    Ctrl+B then n = next window"
echo "    Ctrl+B then p = previous window"
echo "    Ctrl+B then 0-9 = jump to window 0-9"
echo "    Ctrl+B then ' then type number = jump to 10+"
echo "══════════════════════════════════════════════"
