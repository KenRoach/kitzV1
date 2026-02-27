# KITZ OS — Channel Adapter Specification

> Version: 1.0 | Date: 2026-02-27
> Three channels, one brain, every tool accessible from everywhere

---

## Overview

KITZ serves users through three interaction channels. Every one of the 280 tools and 25 workflows is accessible from all three. The Response Adapter formats outputs appropriately for each channel.

## Channels

| Channel | Interface | Service | Port | Best For |
|---------|-----------|---------|------|----------|
| Email | Gmail / any email client | kitz-email-connector | 3007 | Documents, reports, formal comms, archival |
| WhatsApp | WhatsApp Business via Baileys | kitz-whatsapp-connector | 3006 | Quick actions, approvals, alerts, on-the-go |
| Chat Panel | workspace.kitz.services UI | workspace + kitz_os | 3001/3012 | Complex tasks, data exploration, content creation |

---

## Architecture

```
Email → kitz-email-connector (3007)  ─┐
WhatsApp → kitz-whatsapp-connector (3006) ─┤→ kitz_os (3012) → Response Adapter → Channel-specific delivery
Chat Panel → workspace UI (3001)     ─┘
```

### Response Adapter

Location: `kitz_os/src/adapters/responseAdapter.ts`

```typescript
interface AdaptedResponse {
  channel: 'email' | 'whatsapp' | 'chatpanel';
  outputType: 'document' | 'data' | 'media' | 'approval' | 'notification' | 'report';
  whatsapp?: { text: string; media?: Buffer; document?: Buffer; };
  email?: { subject: string; html: string; attachments: Attachment[]; };
  chatpanel?: { chat: string; canvas: CanvasPayload; actions: Action[]; };
}
```

---

## Output Formatting Rules

### WhatsApp Rules
- Default: 5-7 words per message
- Max: 15-23 words, 30 if complex
- Cool, chill, never rude
- Use *bold* for emphasis
- Emojis: 1-2 per message, sparingly
- Lists: max 5 items, numbered
- Long content: send as document attachment (PDF)
- Rich HTML: NEVER — plain text only
- Tables: NEVER — summarize key numbers instead
- Approvals: "Reply YES to approve" or "Reply 1/2/3 to choose"
- Images: send as media message
- Audio: send as voice note (native WA format)

### Email Rules
- Always branded HTML with company colors + logo
- Professional but warm tone
- Clear subject line (action + context)
- TL;DR at top for quick scanning
- Full detail below the fold
- Attachments: PDF for documents, CSV for data
- Links to Google Workspace (Sheets, Docs, Slides)
- Action links: Approve / Edit / View in KITZ
- Footer: "Powered by KITZ — workspace.kitz.services"
- Thread-aware (replies stay in same thread)

### Chat Panel Rules
- Split-panel layout: chat left, canvas preview right
- Chat side: concise conversational text (like WhatsApp tone)
- Canvas side: full rich preview (HTML, charts, tables, interactive)
- Interactive: buttons, dropdowns, inline editing in canvas
- Real-time: live updates, streaming responses
- Action buttons in canvas: Download, Send, Edit, Share, Export
- Drag-and-drop: files and images into chat
- History: scrollable, searchable conversation

---

## Output Type Adaptation Matrix

### Documents (Invoice, Quote, Contract, Proposal, Report, SOP)

| Aspect | Email | WhatsApp | Chat Panel |
|--------|-------|----------|------------|
| Preview | Branded HTML inline | Summary text (3-5 lines) | Full preview in canvas |
| Full document | PDF attachment | PDF document message | Canvas render + download |
| Google link | Docs/Sheets/Slides link | N/A | Embedded link + open button |
| Actions | Reply APPROVE/EDIT | Reply YES to send | [Send] [Edit] [Download] buttons |
| Auto-save | Drive upload | Drive upload | Drive upload |

### Data (Contact list, Orders, Transactions, Analytics)

| Aspect | Email | WhatsApp | Chat Panel |
|--------|-------|----------|------------|
| Preview | HTML table | Top 5 + total count | Scrollable table in canvas |
| Full data | CSV attachment + Sheets link | "Reply ALL for full list" | Full table + search/filter |
| Charts | Embedded PNG chart | N/A (text KPIs only) | Interactive charts in canvas |
| Export | [Open in Sheets] link | N/A | [Export CSV] [Export PDF] [Open in Sheets] |

### Media (Images, Audio, Video)

| Aspect | Email | WhatsApp | Chat Panel |
|--------|-------|----------|------------|
| Image | Inline + full-res attachment | Image media message | Canvas display + download |
| Audio | MP3 attachment | Voice note (native WA) | Audio player in canvas |
| Video | Link to video | Video media message | Video player in canvas |

### Approvals (Draft-first messages, Workflow actions, Bulk operations)

| Aspect | Email | WhatsApp | Chat Panel |
|--------|-------|----------|------------|
| Single approval | Reply APPROVE or EDIT | Reply YES or EDIT | [Approve] [Edit] [Reject] buttons |
| Bulk preview | Summary email + confirm link | Summary + "CONFIRM to proceed" | Preview table + [Confirm All] |
| Workflow action | Approve link in email | Reply YES/NO | [Run] [Skip] buttons |

### Notifications (Alerts, Reminders, Updates)

| Aspect | Email | WhatsApp | Chat Panel |
|--------|-------|----------|------------|
| Urgent | Subject: URGENT + email | WhatsApp + push | Banner notification + chat |
| Important | Standard email | WhatsApp message | Chat message + highlight |
| Routine | Included in daily digest | Included in morning brief | Activity feed |

### Reports (Morning Brief, Weekly Scorecard, Service Report)

| Aspect | Email | WhatsApp | Chat Panel |
|--------|-------|----------|------------|
| Daily brief | Branded HTML digest | 10-line concise summary | Dashboard widget on login |
| Weekly report | Full HTML + Sheets link | KPI summary + "Reply FULL" | Canvas report + drill-down |
| Service report | HTML + breakdown PDF | Key metrics (7 lines) | ROI dashboard in canvas |

---

## Cross-Channel Features

### Channel Switching
User can move output between channels at any time:
- "Send this to my email" → gmail_sendWithAttachment
- "Send this to Maria on WhatsApp" → outbound_sendWhatsApp (adapted)
- "Open this in the chat panel" → redirect to workspace.kitz.services
- "Save to Drive" → drive_upload
- "Put this in Sheets" → sheets_export
- "Make this a Google Doc" → docs_create

### Conversation Continuity
- `memory_search` works across all channels
- Start on WhatsApp → continue on Chat Panel → finish on Email
- Full conversation history preserved via `channel_history`
- Context synced via `channel_sync`

### Smart Routing
KITZ auto-routes to the best channel based on content type:

| Content | Best Channel | Why |
|---------|-------------|-----|
| Urgent alert | WhatsApp | Instant push notification |
| Quick approval | WhatsApp | Reply YES/NO |
| Morning brief | WhatsApp | Read on phone |
| Weekly report | Email | Detailed, archivable |
| Invoice to customer | Email | Professional, PDF |
| Complex editing (deck, website) | Chat Panel | Canvas preview + edit |
| Data exploration | Chat Panel | Tables, filters, charts |
| Content creation | Chat Panel | Preview + edit in canvas |
| Financial docs for accountant | Email | Formal, forwardable |
| Team notifications | WhatsApp | Everyone has it |
| After-hours message | Email | No push during quiet hours |
| Bulk operations preview | Chat Panel | Review table before confirming |

### Quiet Hours
- `channel_quietHours` suppresses WhatsApp notifications during set hours
- Queues messages for morning delivery
- Email delivery unaffected (no push)
- Critical alerts (payment failed, angry VIP) override quiet hours

### Escalation
- `channel_escalate` tries alternate channels if no response:
  - WhatsApp no response in 1hr → try Email
  - Email no response in 4hr → try WhatsApp
  - Both no response in 24hr → try voice call (if enabled)

---

## Input Handling

### What Users Can Send Per Channel

| Input Type | Email | WhatsApp | Chat Panel |
|------------|-------|----------|------------|
| Text command | Subject line or body | Chat message | Chat input |
| Photo/image | Attachment | Media message | Drag-and-drop or upload |
| Document (PDF, Excel, Word) | Attachment | Document message | File upload |
| Audio/voice | Attachment | Voice note | Upload |
| Video | Attachment | Video message | Upload |
| Location | N/A | Location pin | N/A |
| Contact card | N/A | vCard | N/A |
| Multiple files | Multiple attachments | Multiple messages | Multi-file upload |

### Input Processing Flow
```
Input received on any channel
  → channel_detect (identify source)
  → Extract text + attachments
  → 5-Phase Semantic Router:
    1. READ (Haiku) — understand intent
    2. COMPREHEND (Haiku) — classify + extract entities
    3. BRAINSTORM (Sonnet) — plan tool chain
    4. EXECUTE (GPT-4o-mini) — run tools
    5. VOICE (Haiku) — format for source channel
  → Response Adapter formats output
  → Deliver on source channel
  → Auto-save to Google Drive
```

---

## Implementation

### New Service: kitz-google-connector (port 3015)
- All Google Workspace API calls
- OAuth token management per user
- Webhook listeners for Gmail/Drive/Calendar push notifications
- Rate limiting (Google quotas)

### Modified Services
- `kitz_os`: Add Response Adapter, channel detection in semantic router
- `kitz-email-connector`: Add Gmail API integration, inbox watching
- `kitz-whatsapp-connector`: Already production — add attachment handling improvements
- `workspace` (UI): Add canvas preview types for all output formats

### Environment Variables
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GMAIL_WATCH_TOPIC=...  # Pub/Sub topic for Gmail push
```
