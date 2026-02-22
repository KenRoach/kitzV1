# Kitz Org-Wide Repo Audit + Delta Plan

This audit was performed against the current local checkout that mirrors the `Kitz` org repositories scaffold.

## Org-wide summary
- **Current convention:** Node.js + TypeScript + Fastify for service repos, markdown/content for docs/knowledge repos.
- **Common baseline present:** `README.md`, `.env.example`, CI workflow, lint/typecheck/test scripts in code repos.
- **Key gaps found initially:** shallow stubs, inconsistent schema usage across repos, incomplete zero-trust wiring, limited traceId/audit propagation.
- **Security check:** no real secrets detected in changed files; placeholders only.

---

## 1) kitz-schemas
### Existing
- TS package with contracts file and CI.
### Missing vs target
- Utility conventions for trace/timestamp, stronger cross-repo type consumption signal.
### Delta plan
- **MODIFY:** `src/contracts.ts` to normalize interfaces and add trace helpers.
- **LEAVE AS-IS:** CI/lint/test scaffolding.
### Implemented
- Updated contracts with typed structures and helper utilities (`createTraceId`, `nowIso`).
- Updated package exports for cross-repo imports.

## 2) kitz-gateway
### Existing
- Fastify API with route stubs and auth/org middleware placeholders.
### Missing vs target
- RBAC scope checks, explicit proxy routes, schema types imported from shared contracts, richer audit stubs.
### Delta plan
- **MODIFY:** `src/index.ts` to add scope middleware and typed route payloads.
- **LEAVE AS-IS:** project scaffolding files.
### Implemented
- Added auth + org + scope middleware stubs, rate-limiting registration, audit logging helper.
- Kept required routes and added explicit proxy endpoints for WhatsApp/Email/Payments paths.

## 3) kitz-brain
### Existing
- Agents, scheduler, tool registry, LLM hub client stubs.
### Missing vs target
- Actual gateway-calling tool invocations, policy enforcement for approvals, stronger run timeline logging.
### Delta plan
- **MODIFY:** `src/index.ts`, `src/tools/registry.ts`, `src/llm/hubClient.ts`.
- **LEAVE AS-IS:** agent skeleton files.
### Implemented
- Tool registry now builds typed requests and calls gateway endpoints only.
- Added approval-required policy enforcement path.
- Daily/weekly runs expanded and traced.

## 4) kitz-notifications-queue
### Existing
- In-memory queue + retry + DLQ skeleton.
### Missing vs target
- Typed job envelope, explicit draft-first behavior, audit/trace event logs.
### Delta plan
- **MODIFY:** `src/index.ts`.
### Implemented
- Added idempotency handling, draft-first enforcement, retries, DLQ, queue stats endpoint.
- Added audit envelope logging with `traceId`.

## 5) kitz-payments
### Existing
- Checkout + webhook + in-memory ledger stub.
### Missing vs target
- Shared schema usage, subscription stub endpoint, richer checkout/session shape.
### Delta plan
- **MODIFY:** `src/index.ts`.
### Implemented
- Added typed checkout session response, webhook event handling, append-only ledger, and subscription endpoints.

## 6) kitz-whatsapp-connector
### Existing
- Basic webhook/send/template/consent endpoints.
### Missing vs target
- Draft-first enforcement behavior and audit events.
### Delta plan
- **MODIFY:** `src/index.ts`.
### Implemented
- Added inbound signature check placeholder, draft-only outbound route, template/consent registry, trace-audited logs.

## 7) kitz-email-connector
### Existing
- Basic webhook/send/template/consent/suppression endpoints.
### Missing vs target
- Draft-first enforcement behavior and explicit unsubscribe/suppression workflows.
### Delta plan
- **MODIFY:** `src/index.ts`.
### Implemented
- Added inbound signature check placeholder, draft-only outbound route, suppression check, unsubscribe endpoint, and trace-audited logs.

## 8) workspace (workspace.kitz.services)
### Existing
- Minimal HTML routes for Leads/Orders/Tasks/AI Direction/Checkout Links.
### Missing vs target
- Gateway-powered AI battery check and checkout creation flow with mobile link actions.
### Delta plan
- **MODIFY:** `src/index.ts`.
### Implemented
- Added `/api/ai-battery` gateway call.
- Added checkout session creation via gateway and action affordances (`copy-link`, share draft channels).

## 9) admin-kitz-services
### Existing
- Dashboard stub endpoint.
### Missing vs target
- API keys, credits, approvals, and audit endpoints.
### Delta plan
- **MODIFY:** `src/index.ts`.
### Implemented
- Added `/api-keys`, `/credits`, `/approvals`, `/audit` stubs.

## 10) kitz-services
### Existing
- Root marketing endpoint.
### Missing vs target
- Free content hub routes.
### Delta plan
- **MODIFY:** `src/index.ts`.
### Implemented
- Added free guides/templates content endpoints.

## 11) kitz-llm-hub
### Existing
- Provider files + router + redaction + eval harness (minimal stubs).
### Missing vs target
- Unified endpoint that routes to adapters and applies policy/redaction consistently.
### Delta plan
- **MODIFY:** `src/index.ts`, `src/router.ts`, `src/redaction.ts`, providers, eval harness.
### Implemented
- Added task routing, redaction policy, adapter invocation in `/complete`, and richer eval cases.

## 12) kitz-docs
### Existing
- Core docs files present.
### Missing vs target
- Deeper architectural/security runbook detail.
### Delta plan
- **MODIFY:** `ARCHITECTURE.md`, `THREAT_MODEL.md`, `APPROVAL_MATRIX.md`, `RUNBOOKS.md`.
### Implemented
- Expanded architecture, threat scenarios + mitigations, approvals table, incident/key-rotation/webhook runbooks.

## 13) kitz-knowledge-base
### Existing
- RAG-oriented playbooks/offers/SOP files present.
### Missing vs target
- No hard blockers for minimal scaffold.
### Delta plan
- **LEAVE AS-IS:** current structure retained.

---

## Cross-repo additions
- Added `kitz-schemas` as a local dependency in service repos for shared contract usage.
- Preserved existing code and conventions while extending endpoint coverage and typed integration.
