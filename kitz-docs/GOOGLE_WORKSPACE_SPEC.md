# KITZ OS — Google Workspace Integration Specification

> Version: 1.0 | Date: 2026-02-27
> Google is the hands. KITZ is the brain.

---

## Overview

KITZ integrates deeply with Google Workspace — Gmail, Drive, Calendar, Sheets, Docs, Slides, Forms, and Meet. Every KITZ output lands in Google. Every Google input flows into KITZ. Users never leave their world.

---

## Architecture

### New Service: kitz-google-connector (port 3015)

```
User → kitz-gateway → kitz_os → kitz-google-connector ←→ Google APIs
```

### Authentication
- Google OAuth 2.0 (via kitz-gateway `/auth/google/url` and `/auth/google/callback`)
- Scopes requested at login:
  - `gmail.modify` — read, write, send, label emails
  - `drive.file` — create, read, organize files
  - `calendar.events` — full calendar CRUD
  - `spreadsheets` — read, write, create Sheets
  - `documents` — read, write, create Docs
  - `presentations` — read, write, create Slides
  - `forms.body` — create and read Forms
- Token refresh + storage per user (encrypted in DB)
- Webhook listeners for push notifications (Gmail, Drive, Calendar)

### Libraries
- `googleapis` — official Node.js client
- `@google-cloud/local-auth` — OAuth helper

### Rate Limiting
- Gmail: 250 sends/day (free), 2000/day (Workspace)
- Drive: 1000 requests/100 seconds
- Sheets: 300 requests/minute
- Calendar: 500 requests/100 seconds

---

## Service Map: 49 Tools

### Gmail (13 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `gmail_listInbox` | GET | List emails filtered by unread, sender, label, date, attachment |
| `gmail_readEmail` | GET | Full email content + decode attachments |
| `gmail_searchEmail` | GET | Natural language → Gmail query translation |
| `gmail_compose` | POST | AI-drafted email with brand tone + CRM context |
| `gmail_reply` | POST | Smart reply reading full thread context |
| `gmail_forward` | POST | Forward with AI TL;DR summary |
| `gmail_sendWithAttachment` | POST | Send any KITZ output as email attachment |
| `gmail_labelAndSort` | PUT | AI auto-labels: Clients/Invoices/Leads/Suppliers |
| `gmail_createFilter` | POST | Create Gmail filter from natural language |
| `gmail_archiveOld` | PUT | Mass archive emails older than X days |
| `gmail_autoRespond` | POST | Auto-reply rules by sender, subject, keyword |
| `gmail_watchInbox` | POST | Real-time inbox monitoring with auto-routing |
| `gmail_digest` | GET | Daily email digest: unread, urgent, drafts |

### Google Drive (10 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `drive_upload` | POST | Upload KITZ output, auto-organized by type + date |
| `drive_download` | GET | Pull file from Drive for KITZ processing |
| `drive_search` | GET | Natural language file search |
| `drive_organize` | PUT | AI auto-organizes folder structure |
| `drive_share` | PUT | Share file/folder with permissions |
| `drive_createFolder` | POST | Create folders by project, client, category |
| `drive_moveFile` | PUT | Move/rename files, batch operations |
| `drive_autoSave` | POST | Every KITZ output auto-saves to Drive |
| `drive_watchFolder` | POST | Monitor folder for changes, trigger workflows |
| `drive_backup` | POST | Nightly backup of all KITZ data |

### Google Calendar (5 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `gcal_sync` | POST | 2-way sync KITZ ↔ Google Calendar |
| `gcal_multiCalendar` | GET | Manage business/personal/team/deadlines calendars |
| `gcal_createWithMeet` | POST | Event + auto-generate Google Meet link |
| `gcal_shareAvailability` | GET | Calendly-style shareable availability link |
| `gcal_teamView` | GET | Team calendar unified view + auto-schedule |

### Google Sheets (10 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `sheets_read` | GET | Read any Sheet, AI understands structure |
| `sheets_import` | POST | Import Sheet data into KITZ (contacts, products) |
| `sheets_export` | POST | Export KITZ data to Sheets (CRM, orders, transactions) |
| `sheets_appendRow` | POST | Add row (every sale, expense, etc.) |
| `sheets_updateCell` | PUT | Update specific cells |
| `sheets_createDashboard` | POST | AI builds dashboard with charts + formulas |
| `sheets_createTemplate` | POST | Generate business templates (cash flow, budget, etc.) |
| `sheets_liveSync` | POST | 2-way sync KITZ ↔ Sheets |
| `sheets_analyze` | GET | AI finds trends, anomalies, insights in spreadsheet |
| `sheets_formula` | PUT | Write formulas from natural language |

### Google Docs (7 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `docs_create` | POST | Create Doc from KITZ output (proposals, contracts, SOPs) |
| `docs_read` | GET | Read any Doc into KITZ |
| `docs_edit` | PUT | AI edits Doc via natural language, track changes |
| `docs_template` | POST | Generate branded business doc templates |
| `docs_summarize` | GET | Summarize any Doc (50pp → 1pp) |
| `docs_translate` | POST | Translate full Doc (ES/EN/PT), new copy |
| `docs_mailMerge` | POST | Mail merge from Sheet into Doc template |

### Google Slides (5 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `slides_create` | POST | KITZ deck → Google Slides (fully editable) |
| `slides_fromData` | POST | Spreadsheet → presentation with auto-charts |
| `slides_edit` | PUT | Add/modify slides from natural language |
| `slides_brand` | PUT | Apply brand kit (colors, fonts, logo) |
| `slides_present` | POST | Meet + Slides + auto meeting notes |

### Google Forms (4 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `forms_create` | POST | AI generates Form from description, linked to Sheet |
| `forms_watchResponses` | POST | Auto-route responses (leads→CRM, orders→orders) |
| `forms_analyzeResults` | GET | AI summary with trends + charts |
| `forms_embed` | GET | Embed form on KITZ website |

### Google Meet (4 tools)

| Tool | Method | Description |
|------|--------|-------------|
| `meet_create` | POST | Instant Meet link, auto-sent to attendees |
| `meet_schedule` | POST | Schedule with agenda + calendar + reminder |
| `meet_transcribe` | POST | Auto-transcribe → notes → action items → tasks |
| `meet_prep` | GET | Pre-meeting brief: CRM, history, talking points |

---

## Auto-Save Map: Every KITZ Output → Google Drive

| KITZ Output | Drive Folder |
|-------------|-------------|
| Invoice | Drive/Business/Invoices/YYYY/MMM/ |
| Quote | Drive/Business/Quotes/YYYY/MMM/ |
| Contract | Drive/Business/Contracts/ |
| Proposal | Drive/Business/Proposals/ |
| Presentation | Drive/Business/Decks/ |
| Report | Drive/Business/Reports/YYYY/MMM/ |
| SOP | Drive/Business/SOPs/ |
| Flyer / Promo | Drive/Business/Marketing/ |
| Website | Drive/Business/Websites/ |
| Meeting notes | Drive/Business/Meetings/ |
| Email campaign | Drive/Business/Marketing/Email/ |
| Financial report | Drive/Business/Finance/YYYY/MMM/ |
| CRM export | Drive/Business/Data/CRM/ |
| Recording transcript | Drive/Business/Recordings/ |
| Image / graphic | Drive/Business/Marketing/Assets/ |
| Payslip | Drive/Business/HR/Payslips/YYYY/MMM/ |
| Receipt scan | Drive/Business/Finance/Receipts/YYYY/MMM/ |
| Backup | Drive/Business/KITZ_Backup/ |

---

## Google Event → KITZ Action

| Google Event | KITZ Action |
|-------------|-------------|
| New email arrives | Classify → route → auto-respond |
| Email with attachment | Scan → extract → file → act |
| Calendar event created | Sync → prep → remind |
| Sheet updated | Sync data to CRM/orders/inventory |
| Form response submitted | Route to CRM/orders/feedback |
| File added to Drive folder | Detect → classify → process |
| Doc shared | Summarize → extract action items |
| Meet recording available | Transcribe → notes → tasks |
| Google review posted | Analyze → respond → update CRM |

---

## Environment Variables

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GOOGLE_PUBSUB_TOPIC=projects/kitz/topics/gmail-push
GOOGLE_SERVICE_ACCOUNT=...  # For server-to-server operations
```

---

## Implementation Notes

- All Google API calls go through kitz-google-connector (port 3015)
- Service registers with kitz-gateway for auth proxying
- Token storage: encrypted in Supabase per user per org
- Webhook handlers: Express routes for Google push notifications
- Batch operations: use Google's batch API for bulk operations
- Error handling: exponential backoff for rate limits (429)
- Offline queue: if Google API unavailable, queue and retry
