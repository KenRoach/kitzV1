# KITZ OS — New Tools Specification (53 Gap-Closure Tools)

> Version: 1.0 | Date: 2026-02-27
> Closing every gap between what a person does on a device and what KITZ can do

---

## Overview

These 53 tools close the gap between KITZ's existing 68+ tools and full device-replacement coverage. After implementation, KITZ handles everything a person does on a PC, laptop, or mobile — 100% coverage.

---

## Document & File Tools (6)

| Tool | Service | Description |
|------|---------|-------------|
| `form_builder` | kitz_os | Create custom forms (intake, surveys, orders) with field types, validation, and auto-routing |
| `doc_sign` | kitz_os | E-signature workflow: upload doc → assign signers → track → countersign → archive |
| `pdf_merge` | kitz_os | Merge multiple PDFs into one, reorder pages, extract page ranges |
| `file_convert` | kitz_os | Convert between formats: PDF↔Word, Excel↔CSV, PNG↔JPG, MD↔HTML |
| `file_compress` | kitz_os | Zip/unzip files and folders, compress images for web |
| `doc_template_library` | kitz_os | Pre-built templates: NDA, employment contract, lease, partnership agreement, MOU |

---

## Time & Calendar Tools (4)

| Tool | Service | Description |
|------|---------|-------------|
| `alarm_timer` | kitz_os | Set reminders, timers, and alarms with natural language ("remind me in 2 hours") |
| `time_tracker` | kitz_os | Track hours per project/client/employee, generate timesheets, calculate billable hours |
| `booking_page` | kitz_os | Calendly-style booking page: set availability, share link, auto-confirm, sync to calendar |
| `pomodoro_focus` | kitz_os | Focus timer with work/break cycles, daily focus tracking, distraction blocking suggestions |

---

## Financial Tools (5)

| Tool | Service | Description |
|------|---------|-------------|
| `expense_tracker` | kitz_os | Categorize expenses, receipt OCR auto-entry, monthly summaries, tax-ready reports |
| `bank_reconcile` | kitz_os | Match bank transactions to invoices/expenses, flag discrepancies, suggest matches |
| `money_send` | kitz-payments | P2P transfers, vendor payments, payroll disbursement via integrated payment rails |
| `tax_filing` | kitz_os | Country-specific tax calculation, form generation, deadline tracking (PA/CO/MX/BR) |
| `budget_planner` | kitz_os | Create and track budgets by category, department, project with alerts at thresholds |

---

## Marketing & Growth Tools (8)

| Tool | Service | Description |
|------|---------|-------------|
| `customer_segment` | kitz_os | AI segments customers by behavior, value, geography, purchase patterns |
| `loyalty_rewards` | kitz_os | Points system, tier management, reward redemption, referral bonuses |
| `referral_tracker` | kitz_os | Referral link generation, tracking, attribution, reward automation |
| `ab_test` | kitz_os | A/B test messages, subject lines, CTAs, landing pages with statistical significance |
| `seo_tools` | kitz_os | Keyword research, meta tag generation, sitemap creation, page speed analysis |
| `google_business` | kitz_os | Manage Google Business Profile: hours, posts, reviews, Q&A, photos |
| `influencer_outreach` | kitz_os | Find micro-influencers, draft collaboration proposals, track campaign ROI |
| `competitor_monitor` | kitz_os | Track competitor pricing, social activity, reviews, new products |

---

## Media Production Tools (7)

| Tool | Service | Description |
|------|---------|-------------|
| `video_record` | kitz_os | Record video from webcam/screen with AI teleprompter and scene suggestions |
| `video_edit` | kitz_os | Trim, merge, add captions, music, transitions, export for social platforms |
| `podcast_create` | kitz_os | Script generation, recording guidance, editing, show notes, distribution |
| `image_edit` | kitz_os | Crop, resize, filters, text overlay, watermark, batch processing |
| `image_removeBg` | kitz_os | AI background removal for product photos, headshots, marketing assets |
| `image_resize` | kitz_os | Batch resize for social platforms (IG story, FB cover, LinkedIn banner, etc.) |
| `audio_record` | kitz_os | Voice memo recording, transcription, summary, action item extraction |
| `screen_record` | kitz_os | Screen recording for tutorials, bug reports, SOPs with auto-narration |

---

## Web & Online Presence Tools (5)

| Tool | Service | Description |
|------|---------|-------------|
| `qr_generate` | kitz_os | Generate QR codes for payment links, menus, booking pages, vCards, WiFi |
| `domain_manage` | kitz_os | Domain search, registration, DNS management, SSL certificate status |
| `hosting_deploy` | kitz_os | One-click deploy KITZ-generated websites to hosting (Vercel, Netlify, custom) |
| `web_analytics` | kitz_os | Track website visitors, page views, conversions, traffic sources |
| `website_chatbot` | kitz_os | Deploy AI chatbot widget on KITZ-generated websites, connected to full tool suite |
| `booking_embed` | kitz_os | Embed booking widget on website, synced with calendar and CRM |

---

## Learning & Knowledge Tools (2)

| Tool | Service | Description |
|------|---------|-------------|
| `video_learn` | kitz_os | Curated learning: business courses, tutorials, industry training with progress tracking |
| `kitz_academy` | kitz_os | Interactive KITZ onboarding: feature walkthroughs, use case tutorials, best practices |

---

## Project & Team Management Tools (5)

| Tool | Service | Description |
|------|---------|-------------|
| `project_board` | kitz_os | Kanban boards per project: columns, cards, assignments, due dates, progress |
| `gantt_chart` | kitz_os | Timeline view of projects with dependencies, milestones, critical path |
| `hr_manage` | kitz_os | Employee profiles, documents, performance reviews, leave tracking |
| `shift_schedule` | kitz_os | Shift planning: assign shifts, handle swaps, track coverage, overtime alerts |
| `applicant_tracker` | kitz_os | Job posting, application tracking, interview scheduling, offer management |

---

## Security & Privacy Tools (3)

| Tool | Service | Description |
|------|---------|-------------|
| `password_vault` | kitz_os | Secure credential storage for business accounts (encrypted, per-org) |
| `auth_2fa` | kitz-gateway | Two-factor authentication setup and management for KITZ accounts |
| `data_export` | kitz_os | GDPR-style full data export of all user/org data in portable format |
| `account_delete` | kitz_os | Full account deletion with data purge, confirmation flow, grace period |

---

## Mobile-Native Tools (5)

| Tool | Service | Description |
|------|---------|-------------|
| `push_notify` | kitz-notifications-queue | Push notifications to mobile with priority levels and quiet hours respect |
| `notification_prefs` | kitz_os | Per-user notification preferences: channels, frequency, quiet hours, categories |
| `location_alert` | kitz_os | Geo-based triggers: "When I arrive at warehouse, show inventory" |
| `offline_mode` | kitz_os | Queue actions when offline, sync when reconnected, conflict resolution |
| `biometric_login` | kitz-gateway | Fingerprint/face auth for mobile KITZ access |
| `nfc_payment` | kitz-payments | Tap-to-pay for in-person sales via NFC-enabled devices |
| `share_to_kitz` | kitz_os | Mobile share sheet integration: share any content to KITZ for processing |

---

## Implementation Priority

### Phase 1 — Core Business (Weeks 1-4)
High-impact tools that directly generate or save money:
- `expense_tracker`, `bank_reconcile`, `tax_filing`, `budget_planner`
- `time_tracker`, `booking_page`
- `doc_sign`, `form_builder`
- `customer_segment`, `loyalty_rewards`, `referral_tracker`

### Phase 2 — Growth & Marketing (Weeks 5-8)
Tools that drive customer acquisition and retention:
- `seo_tools`, `google_business`, `ab_test`, `competitor_monitor`
- `qr_generate`, `web_analytics`, `website_chatbot`, `booking_embed`
- `influencer_outreach`

### Phase 3 — Media & Content (Weeks 9-12)
Rich media production capabilities:
- `video_edit`, `video_record`, `image_edit`, `image_removeBg`, `image_resize`
- `audio_record`, `screen_record`, `podcast_create`

### Phase 4 — Team & Operations (Weeks 13-16)
Team management and operational tools:
- `project_board`, `gantt_chart`, `hr_manage`, `shift_schedule`, `applicant_tracker`
- `money_send`, `pdf_merge`, `file_convert`, `file_compress`

### Phase 5 — Platform & Mobile (Weeks 17-20)
Platform features and mobile-native capabilities:
- `push_notify`, `notification_prefs`, `offline_mode`, `biometric_login`
- `location_alert`, `nfc_payment`, `share_to_kitz`
- `domain_manage`, `hosting_deploy`
- `password_vault`, `auth_2fa`, `data_export`, `account_delete`
- `video_learn`, `kitz_academy`
- `doc_template_library`, `alarm_timer`, `pomodoro_focus`

---

## Integration Notes

- All new tools register in `kitz_os/src/tools/registry.ts` via OsToolRegistry
- All tools accessible from all 3 channels (WhatsApp, Email, Chat Panel) via Response Adapter
- All tools respect draft-first policy for outbound actions
- All tools track AI Battery consumption
- All tools generate traceId for audit trail
- All tools auto-save outputs to Google Drive via `drive_autoSave`
