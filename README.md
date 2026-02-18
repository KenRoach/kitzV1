# Kitz Tool Gateway (v0.1)

This repository provides the **Tool Access Gateway** used by agents to call approved product capabilities under `/tools/*`.

## Supported tool routes
- `POST /tools/crm/create_lead`
- `POST /tools/crm/update_lead`
- `POST /tools/crm/log_interaction`
- `POST /tools/orders/create_quote`
- `POST /tools/orders/create_order`
- `POST /tools/orders/update_status`
- `POST /tools/finance/get_kpis`
- `POST /tools/finance/create_invoice` (**approval required**)
- `POST /tools/ai-battery/estimate`
- `POST /tools/ai-battery/charge` (**approval required**)
- `POST /tools/audit/log`

## Required request contract (all routes)
OpenClaw must send these fields on every request:
- `agent_name`
- `reason`
- `business_context`
- `requested_action`
- `ai_battery_estimate`
- `tenant_id`
- `request_id`
- `user_id` **or** `account_id`

Optional approval fields:
- `approval_token`
- `human_approval_id`

## Approval gate rules
The gateway requires `approval_token` or `human_approval_id` for:
- Invoice creation
- AI battery charging
- Any action where `requested_action` contains `refund`, `delete`, or `permission`

## Idempotency
`request_id` is used as the idempotency key. Repeated calls with the same `request_id` return the stored result.

## Auditing
All tool calls (success and failure, including validation failures) produce an audit event.
For local verification, inspect `GET /tools/audit/events`.


## Core execution flow

`User Action → Event → AI Agent → Tool Call → Database Update → Insight`

This is the canonical lifecycle the gateway is designed to support:
1. **User Action**: a user triggers an action inside product surfaces.
2. **Event**: the platform emits a structured event with tenant and context metadata.
3. **AI Agent**: OpenClaw (or another approved agent) evaluates intent and risk.
4. **Tool Call**: the agent calls one of the approved `/tools/*` routes with required fields and idempotency key.
5. **Database Update**: the tool implementation writes the resulting state transition (or rejects on policy/approval).
6. **Insight**: downstream analytics/audit layers consume the outcome to generate recommendations, alerts, and reporting.

## OpenAPI
- `docs/tool-gateway-openapi.json`

## Run locally
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## Run tests
```bash
pytest -q
```

## Example OpenClaw request
```json
{
  "agent_name": "openclaw-agent",
  "reason": "create invoice for completed order",
  "business_context": "B2B wholesale flow",
  "requested_action": "create_invoice",
  "ai_battery_estimate": 2.1,
  "tenant_id": "tenant-123",
  "user_id": "u-991",
  "request_id": "req-2026-0001",
  "human_approval_id": "ha-445",
  "payload": {
    "order_id": "ord-1001",
    "amount": 199.99
  }
}
```


## OpenAI SDK usage example
Use the installed `openai` package with a server-side API key:

```js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.responses.create({
  model: "gpt-4.1",
  input: "Summarize my last 10 orders and tell me what to optimize.",
});

console.log(response.output_text);
```

You can run the committed example file with:

```bash
OPENAI_API_KEY=your_key_here node openai-example.mjs
```

## AI Core module (`/ai-core`)
Simple agent architecture for orchestration around the gateway:

- `ai-core/aiClient.js`
- `ai-core/agents/salesAgent.js`
- `ai-core/agents/opsAgent.js`
- `ai-core/agents/cfoAgent.js`
- `ai-core/tools/updateCRM.js`
- `ai-core/tools/sendWhatsApp.js`
- `ai-core/tools/generateInvoice.js`
- `ai-core/memory/vectorStore.js`

AI Battery guardrail is applied before execution and credits are deducted after responses:

```js
if (user.aiCredits <= 0) {
  return 'Recharge your AI Battery';
}

// ... run model/tool calls

deductCredits(user, costEstimate);
```

## OpenAI server key validation (safe flow)
Use server-side environment variable only (never expose key in frontend):

```bash
export OPENAI_API_KEY="your_key_here"
```

Quick test with the Responses API (`gpt-5.2`):

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-5.2",
    "input": "Say hi in one sentence."
  }'
```

## Backend endpoint for secure model calls
A server endpoint is available at `POST /api/ai`.

Request body:

```json
{
  "input": "Summarize my latest orders.",
  "user_id": "u-1",
  "model": "gpt-5.2"
}
```

Rules:
- Frontend sends only `input` + `user_id` (and optional `model`) to backend.
- API key stays server-side in `OPENAI_API_KEY`.
- If server-side `aiCredits <= 0`, request is blocked with `Recharge your AI Battery`.
- After a successful model response, server debits credits (`deduct_credits`) and returns `remaining_ai_credits`.

## Connect this project to GitHub (`KenRoach/kitz`)
If your local clone has no remote yet, connect it with:

```bash
git remote add origin https://github.com/KenRoach/kitz.git
```

Verify:

```bash
git remote -v
```

Push current branch:

```bash
git push -u origin $(git branch --show-current)
```
