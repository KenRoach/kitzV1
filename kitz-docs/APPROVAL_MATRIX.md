# APPROVAL_MATRIX

| Action | Risk | Approval Required | Notes |
|---|---|---|---|
| WhatsApp message final send | Medium | Yes | Draft-first default enforced. |
| Email final send | Medium | Yes | Draft-first + suppression checks. |
| Refund initiation | High | Yes | Blocked by receive-only policy for agents. |
| Price change | High | Yes | Placeholder rule in Brain policy. |
| Order status update | Medium | Conditional | Depends on RBAC scopes. |
| Checkout link creation | Medium | No | Allowed with payment scopes for incoming payments only. |
| Funding request for campaign scale | Medium | Yes | Only after free validation and projected ROI >= 10x. |
| CRM task creation | Low | No | Basic operator action. |
