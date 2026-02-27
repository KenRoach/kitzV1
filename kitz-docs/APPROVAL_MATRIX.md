# KITZ Approval Matrix — Multi-Channel Human Approval System

Every action KITZ takes is classified into a risk tier. Critical actions require human approval before execution — approval can come from any channel (WhatsApp, Email, or Workspace).

## Risk Tiers

| Tier | Behavior | Approval Channels | Examples |
|------|----------|------------------|----------|
| **BLOCKED** | Never executed by AI | N/A — manual only | Outbound payments, refunds, account deletion, full data export |
| **CRITICAL** | Requires approval on **2 channels** | WhatsApp + Email, or WhatsApp + Workspace | Broadcast to contacts, pricing changes, country/tax config, auto-reply rules |
| **HIGH** | Requires explicit approval on **1 channel** + notify all | Any channel | Send WhatsApp/email/SMS to customer, publish content, push to Lovable |
| **MEDIUM** | Draft-first — show user what will happen, "approve" to execute | Any channel | CRM create/update, orders, products, calendar, code generation, SOPs |
| **LOW** | Execute immediately — no approval needed | N/A | All read operations, lookups, searches, analytics, reports |

## Full Matrix

### Blocked (Never Executed by AI)
| Action | Category | Why |
|--------|----------|-----|
| Send money outbound | payments | Receive-only policy — AI never spends |
| Issue refund | payments | Financial risk — manual only |
| Delete user account | admin | Irreversible — manual only |
| Export all data | admin | Security risk — manual only |

### Critical (Dual-Channel Approval)
| Action | Category | Notify All? |
|--------|----------|-------------|
| Broadcast send (bulk message) | outbound | Yes |
| Pricing change | business | Yes |
| Country/tax/compliance config | admin | Yes |
| Auto-reply rule change | config | Yes |

### High (Single Approval + Notify All)
| Action | Category | Notify All? |
|--------|----------|-------------|
| Send WhatsApp to customer | outbound | Yes |
| Send email to customer | outbound | Yes |
| Send SMS to customer | outbound | Yes |
| Send voice note | outbound | Yes |
| Make voice call | outbound | Yes |
| Send checkout link to customer | payments | Yes |
| Delete storefront | payments | No |
| Delete product | catalog | No |
| Publish content | marketing | Yes |
| Promote content (paid) | marketing | Yes |
| Push to Lovable.dev | development | No |

### Medium (Draft-First)
| Action | Category | Auto-Approve After |
|--------|----------|--------------------|
| Create CRM contact | crm | 60 min |
| Update CRM contact | crm | 60 min |
| Create order | orders | — |
| Update order | orders | — |
| Create checkout link | payments | — |
| Update checkout link | payments | — |
| Mark storefront paid | payments | — |
| Create product | catalog | 60 min |
| Update product | catalog | 60 min |
| Add calendar event | calendar | 30 min |
| Update calendar event | calendar | 30 min |
| Delete calendar event | calendar | — |
| Add calendar task | calendar | 30 min |
| Create SOP | operations | — |
| Update SOP | operations | — |
| Generate code | development | — |
| Generate document | content | — |

## How Approval Works

### On WhatsApp
User sends: `"aprobar"` / `"approve"` / `"si"` / `"dale"` / `"listo"`
User sends: `"rechazar"` / `"reject"` / `"no"` / `"cancelar"`

### On Email
User replies to the draft notification with "approve" or clicks the approval link.

### On Workspace (ChatPanel)
User clicks the "Approve" or "Reject" button on the draft card.

### API
```
POST /api/kitz/drafts/decide
{ "trace_id": "...", "action": "approve" | "reject", "index": 0 }

POST /api/kitz/tasks/:taskId/approve
POST /api/kitz/tasks/:taskId/reject
```

## Auto-Approve
Some MEDIUM-risk actions can auto-approve after a timeout (30-60 minutes) if the user doesn't reject. This prevents low-risk drafts from piling up.
