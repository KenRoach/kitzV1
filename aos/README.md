# AOS: Agent-to-Agent Communication Module

This module implements **event-driven, auditable communication** for agents using:

1. Event Bus (`publish/subscribe`)
2. Shared Work Ledger (`task/proposal/decision/outcome` artifacts)
3. Networking Bot (`ORG_DIGEST_READY` from ledger state)
4. Structured schemas/contracts for all messages and artifacts

Agents do **not** chat directly. They communicate via events + ledger records.

## Structure

```text
aos/
  src/
    index.ts
    types.ts
    eventBus.ts
    ledger/
      ledgerStore.ts
      fileStore.ts
      dbStore.ts
    artifacts/
      task.ts
      proposal.ts
      decision.ts
      outcome.ts
    bots/
      networkingBot.ts
    cli/
      run.ts
    policies/
      approvals.ts
      focusCapacity.ts
  data/
    events.ndjson
    ledger.ndjson
```

## Event schema

`AOSEvent`:
- `id`
- `type`
- `source`
- `severity` (`low|medium|high|critical`)
- `timestamp` (ISO)
- `payload` (object)
- `related_ids?`

Minimum supported types:
- `KPI_CHANGED`
- `CUSTOMER_FEEDBACK_RECEIVED`
- `BUG_REPORTED`
- `INCIDENT_DETECTED`
- `PR_READY_FOR_REVIEW`
- `ORG_DIGEST_READY`

## Ledger artifacts

- Task
- Proposal
- Decision
- Outcome

All artifacts include IDs, timestamps, ownership, and related event IDs for traceability.

## Run locally

```bash
cd aos
npm install
node run simulate-event BUG_REPORTED
node run create-sample-ledger
node run digest
```

## Testing

```bash
cd aos
npm run typecheck
npm test
```

## Notes

- File-based store is used by default (`aos/data/*.ndjson`).
- `dbStore.ts` is intentionally a stub unless a DB is introduced in this repo.
- Policies are currently no-op placeholders (`approvals`, `focusCapacity`) to keep module minimal and framework-agnostic.
