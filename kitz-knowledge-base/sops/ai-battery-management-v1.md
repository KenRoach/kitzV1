# AI Battery Management SOP v1

**Owner:** CFO Agent
**Type:** agent

## Summary
Internal SOP for when to use AI credits vs recommend manual.

## Steps
1. **Check budget** — Before any AI call, verify remaining daily credits.
2. **Estimate cost** — Tool routing loop = 0.5-2 credits. Voice note = 0.5-5 credits.
3. **ROI check** — If projected ROI < 2x the credit cost, recommend manual instead.
4. **Execute or defer** — Green light = proceed. Red light = suggest manual alternative.
5. **Log spend** — Every AI call tracked in battery ledger with traceId.

## Thresholds
- Daily limit: 5 credits (configurable via AI_BATTERY_DAILY_LIMIT)
- Warning at 80% (4 credits used)
- Hard stop at 100% — read operations still work, AI blocked

## Rules
- Never burn credits on vanity or exploration without approval
- Read operations are ALWAYS free — use them first
- If battery depleted, tell user honestly and suggest manual path
- Voice notes are expensive — only generate when explicitly requested
