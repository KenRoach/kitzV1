# KITZ 80/20 Automation Architecture

> 80% n8n workflow automation + 20% AI agent support

## Principle

Every KITZ user workflow follows the 80/20 split:
- **80% Automated** by n8n workflows: triggers, scheduling, CRM updates, message delivery, data routing
- **20% AI Agent** support: content personalization, lead scoring, next-action suggestions, exception handling

## Architecture

```
User Action (WhatsApp msg / Web form / Purchase / Timer)
    │
    ▼
┌───────────────────────────────────┐
│  n8n Workflow (80% — Automated)   │
│  - Trigger detection              │
│  - CRM data fetch                 │
│  - Template rendering             │
│  - Channel routing                │
│  - Delivery scheduling            │
│  - Status tracking                │
│  - Error retry                    │
└───────────────┬───────────────────┘
                │ Calls kitz_os /api/kitz
                ▼
┌───────────────────────────────────┐
│  AI Agent (20% — Intelligence)    │
│  - Content generation (Claude)    │
│  - Lead scoring (Haiku)           │
│  - Next-action suggestion         │
│  - Personalization hints          │
│  - Exception escalation           │
│  - A/B variant selection          │
└───────────────────────────────────┘
```

## The 80/20 Split by Feature

### Sales Funnels
| Automated (80%) | AI Agent (20%) |
|---|---|
| Stage tag management in CRM | Lead scoring algorithm (Claude Haiku) |
| Contact movement tracking | Next-action suggestions (Claude Haiku) |
| Stage-change webhooks | Conversion report analysis |
| CRM tag updates | Lost-deal reason classification |
| Funnel status snapshots | Stage recommendation |

### Drip Campaigns
| Automated (80%) | AI Agent (20%) |
|---|---|
| Enrollment triggers | Message template generation (Claude Sonnet) |
| Touch scheduling (day offsets) | Content personalization per contact |
| Channel routing (WA/Email/SMS/Voice) | A/B variant creation |
| CRM tag updates on enrollment | Exception handling (bounces, replies) |
| Progress tracking | Sequence optimization suggestions |
| Completion status | Re-engagement timing |

### Mail Merge
| Automated (80%) | AI Agent (20%) |
|---|---|
| Template variable substitution | Template creation from brief (Claude Sonnet) |
| CRM data pull for merge vars | Content tone adaptation |
| Bulk rendering | Translation (Claude Haiku) |
| Channel-specific formatting | Subject line optimization |
| Send scheduling + delays | Personalization beyond {{vars}} |
| Delivery tracking | Send-time optimization |

### Marketing Campaigns
| Automated (80%) | AI Agent (20%) |
|---|---|
| Campaign scheduling | Content generation (Claude Sonnet) |
| Audience segmentation by tags | Copy A/B testing |
| Multi-channel delivery | Performance analysis |
| Broadcast history logging | Recommendation engine |
| Template deployment from factory | Brand voice alignment |

## Tool Count

| Module | Tools | Automated | AI-Powered |
|---|---|---|---|
| Sales Funnel | 6 | 4 (stages, move, status, report) | 2 (scoreLeads, suggestNextAction) |
| Drip Campaign | 5 | 4 (create, enroll, list, enrollments) | 1 (executeTouch with AI content) |
| Mail Merge | 5 | 4 (render, bulkRender, list, sendBulk) | 1 (createTemplate from brief) |
| Marketing | 6 | 2 (listTemplates, campaignReport) | 4 (generate, translate, nurture, campaign) |
| **Total** | **22** | **14 (64%)** | **8 (36%)** |

## n8n Workflow Templates

| Template | Category | Trigger | 80/20 |
|---|---|---|---|
| `funnel-lead-scoring` | Sales | Daily 8AM cron | 80% scheduling, 20% AI scoring |
| `funnel-stage-automation` | Sales | Webhook | 80% CRM update, 20% AI suggestion |
| `funnel-conversion-report` | Sales | Weekly Fri 6PM | 80% data pull, 20% AI analysis |
| `drip-welcome-sequence` | Drip | Webhook (new contact) | 80% enrollment, 20% AI first touch |
| `drip-post-purchase` | Drip | Webhook (purchase) | 80% enrollment + stage move, 20% AI content |
| `drip-reactivation-winback` | Drip | Weekly Mon 9AM | 80% inactive scan, 20% AI re-engagement |
| `mail-merge-broadcast` | Mail Merge | Webhook | 80% render + send, 20% AI template |

## Agent Wiring

| Agent | Team | Tools Used | Role |
|---|---|---|---|
| LeadScorer | sales-crm | `funnel_scoreLeads` | AI scoring via Claude |
| PipelineOptimizer | sales-crm | `funnel_getStatus`, `funnel_suggestNextAction` | AI pipeline analysis |
| OutreachDrafter | sales-crm | `drip_listSequences`, `drip_enrollContact` | Drip enrollment |
| QuoteGenerator | sales-crm | `merge_renderMessage`, `merge_listTemplates` | Quote via mail merge |
| DealCloser | sales-crm | `funnel_moveContact`, `funnel_stageReport` | Stage management |
| ActivationOptimizer | growth-hacking | `marketing_draftNurture` | AI nurture sequences |
| ContentCreator | marketing-growth | `marketing_generateContent` | AI content generation |
| CampaignRunner | marketing-growth | `marketing_draftCampaign` | AI campaign drafting |
| SocialManager | marketing-growth | `marketing_generateContent` | AI social posts |
| CopyWriter | content-brand | `marketing_generateContent` | AI copy drafting |
| TranslationBot | content-brand | `marketing_translateContent` | AI translation |

## Default Drip Sequences (Pre-Seeded)

1. **Welcome Onboarding** (`drip-welcome`) — 4 touches over 10 days
   - Day 0: WhatsApp welcome
   - Day 2: Email value content
   - Day 5: SMS check-in
   - Day 10: Voice note personal touch

2. **Reactivation Win-Back** (`drip-reactivation`) — 4 touches over 14 days
   - Day 0: WhatsApp "we miss you"
   - Day 3: Email feature updates
   - Day 7: SMS reminder
   - Day 14: Voice note personal follow-up

3. **Post-Purchase Follow-Up** (`drip-post-purchase`) — 4 touches over 14 days
   - Day 0: WhatsApp order confirmation
   - Day 3: WhatsApp satisfaction check
   - Day 7: Email feedback request
   - Day 14: SMS loyalty offer

## Default Mail Merge Templates (Pre-Seeded)

1. WhatsApp Welcome — `{{name}}` + `{{business}}`
2. Email Onboarding — workspace link + features
3. SMS Reminder — order ready notification
4. Follow-Up After Quote — quote check-in
5. Payment Reminder — `{{amount}}` + `{{due_date}}` + `{{checkout_link}}`
6. Invoice Delivery — `{{invoice_number}}` + `{{amount}}` + `{{company}}`

## Default Funnel Stages

```
new-lead → contacted → engaged → qualified → proposal-sent → negotiation → closed-won / closed-lost
```

8 stages, stored as `stage:` prefixed CRM tags. Stage history tracked in contact notes.
