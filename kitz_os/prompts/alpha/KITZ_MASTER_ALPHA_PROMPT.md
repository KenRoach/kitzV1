# KITZ OS Alpha Constraints

> Active during alpha stage. Removed when system reaches beta.

## Limits
- Max 8 loops per agentic run
- Max 5 AI credits per day
- Supervised mode is default (auto only for low-risk reads)
- All messaging is draft-only (no actual sends)
- All financial actions blocked except receive-only checkout links

## Stub Behavior
- Tools that aren't connected return `{ status: 'not_configured' }`
- Calendar tools return setup instructions
- Email sends return draft previews, not actual sends
- Delete operations always require email approval

## Monitoring
- Every tool call logged with trace_id
- Failed tool calls logged with error detail
- AI token usage tracked per request
