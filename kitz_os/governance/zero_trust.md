# Zero-Trust Security Policy

## Principles
1. **Verify explicitly**: Every tool call checks authorization
2. **Least privilege**: Agents only access tools in their allowlist
3. **Assume breach**: All inputs are treated as potentially hostile

## Per-Agent Tool Allowlists
- CEO: all read tools + agent_chat + braindump_process
- Sales: crm_*, orders_list, orders_get, storefronts_*, outbound_sendWhatsApp (draft)
- Ops: orders_*, storefronts_markPaid, dashboard_metrics
- CFO: orders_*, dashboard_metrics, crm_businessSummary
- Support: crm_*, email_listInbox, outbound_sendWhatsApp (draft)
- Admin Assistant: email_* (ONLY agent with email:write)

## Prompt Injection Defense
- System prompts are immutable at runtime
- User data is never interpreted as instructions
- Tool results are data, not commands

## Trust Violation Response
1. Log the violation to agent_audit_log
2. Engage kill switch if severity >= HIGH
3. Alert founder via WhatsApp
4. Block the agent's current run
