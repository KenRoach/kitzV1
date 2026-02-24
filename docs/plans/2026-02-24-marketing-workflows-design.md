# Marketing Workflow Templates — Design

**Date:** 2026-02-24
**Status:** Approved

## Overview

9 n8n workflow templates that give KITZ marketing agents real operational power across all 4 channels: WhatsApp, Email, SMS, and Voice. All templates deploy via `toolFactory_createFromTemplate` and follow draft-first safety rules.

## Channel Infrastructure

| Channel | Tool / Service | Status |
|---|---|---|
| WhatsApp | `outbound_sendWhatsApp`, broadcast tools, Baileys connector | Functional |
| Email | `email_compose`, comms-api `/email` | Stub (draft-only) |
| SMS | comms-api `/text` | Stub (draft-only) |
| Voice | `outbound_sendVoiceNote`, `voice_speak`, ElevenLabs TTS | Functional |

## Templates

### Lead Nurture (3)

| Slug | Trigger | Channels | Flow |
|---|---|---|---|
| `lead-nurture-sequence` | Webhook `/kitz-lead-nurture` | WA + Email + SMS | Score lead → Day 0: WA welcome → Day 3: email value → Day 7: SMS check-in → Day 14: voice note |
| `lead-welcome-onboard` | Webhook `/kitz-new-signup` | WA + Voice | Welcome WA → voice greeting (TTS) → CRM create → activation check |
| `lead-reactivation` | Cron weekly Mon 9am | WA + Email | Inactive 14+ days → WA re-engage → email offer → queue approval |

### Content Generation (3)

| Slug | Trigger | Channels | Flow |
|---|---|---|---|
| `content-social-post` | Webhook `/kitz-content-request` | WA (delivery) | Topic + platform → Claude generates copy → draft approval → WA preview |
| `content-campaign-copy` | Webhook `/kitz-campaign-copy` | Email + WA + SMS | Brief → multi-variant A/B copy per channel → drafts queued |
| `content-translate` | Webhook `/kitz-translate` | All | Text + target lang → Claude translates → return draft |

### Campaign Automation (3)

| Slug | Trigger | Channels | Flow |
|---|---|---|---|
| `campaign-multi-touch` | Webhook `/kitz-campaign-start` | WA + Email + Voice + SMS | Audience filter → 4-touch: WA intro → email deep-dive → SMS reminder → voice close |
| `campaign-broadcast-scheduled` | Cron configurable | WA + SMS | Filter by segment → personalize → broadcast WA + SMS fallback |
| `campaign-performance-report` | Cron daily 6pm | WA (delivery) | Collect stats → Claude report → WA summary to owner |

## Security

- All outbound messages are draft-first (draftOnly: true)
- All workflows call kitz_os via x-service-secret header
- Voice uses ElevenLabs with credit tracking
- All workflows start inactive (active: false)
