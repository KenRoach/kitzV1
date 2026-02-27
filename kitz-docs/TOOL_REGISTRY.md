# KITZ OS — Complete Tool Registry (280 Tools)

> Version: 2.0 | Date: 2026-02-27
> Total Tools: 280 | Workflows: 25 pre-built + infinite custom
> Channels: Email, WhatsApp, Chat Panel (workspace.kitz.services)

---

## Tool Registry Summary

| Category | Tools | Service Owner |
|----------|-------|---------------|
| CRM & Customer Data | 10 | kitz_os |
| Products & Storefront | 10 | kitz_os |
| Dashboard & Analytics | 1 | kitz_os |
| Invoices & Quotes | 6 | kitz_os |
| Presentation Decks | 2 | kitz_os |
| Email Builder | 3 | kitz_os |
| Flyers & Promos | 3 | kitz_os |
| Websites | 4 | kitz_os |
| Documents / PDF | 1 | kitz_os |
| Image Generation | 1 | kitz_os |
| Brand Management | 4 | kitz_os |
| Social Media Content | 4 | kitz_os |
| Marketing & Campaigns | 6 | kitz_os |
| Sales Funnel | 6 | kitz_os |
| Drip Campaigns | 5 | kitz_os |
| Mail Merge & Bulk | 5 | kitz_os |
| Broadcast & Auto-Reply | 5 | kitz_os |
| Outbound Communications | 6 | kitz_os |
| Voice / TTS | 5 | kitz_os |
| Business Calculators | 8 | kitz_os |
| Country & Tax Config | 3 | kitz_os |
| Memory & Context | 6 | kitz_os |
| Document Scanning / OCR | 5 | kitz_os |
| Document Archive | 5 | kitz_os |
| SOPs | 5 | kitz_os |
| Web Research | 4 | kitz_os |
| Compliance | 1 | kitz_os |
| AI Completions | 3 | kitz_os |
| Payments | 4 | kitz_os |
| Inventory | 3 | kitz_os |
| Code & Doc Generation | 7 | kitz_os |
| Email Inbox | 3 | kitz_os |
| Agent Chat | 1 | kitz_os |
| Calendar & Scheduling | 7 | kitz_os |
| Braindump | 1 | kitz_os |
| n8n Workflows | 7 | kitz_os |
| Tool Factory | 5 | kitz_os |
| Knowledge Base / RAG | 3 | kitz_os |
| Conversational Voice Calls | 12 | kitz_os + engine/comms-api |
| Predictive Intelligence | 8 | kitz-brain |
| Proactive Actions | 12 | kitz-brain |
| Workflow Automation | 15 | kitz_os + n8n |
| Google Workspace | 49 | kitz-google-connector |
| Channel Management | 8 | kitz_os |
| **TOTAL** | **280** | |

---

## 1. CRM & Customer Data (10 tools)

| Tool | Output | Format |
|------|--------|--------|
| `crm_listContacts` | Full contact list with name, phone, email, status, tags, lead score, last contact | JSON array |
| `crm_getContact` | Single contact record with full detail | JSON object |
| `crm_createContact` | New contact confirmation with assigned ID | JSON confirmation |
| `crm_updateContact` | Updated contact record | JSON object |
| `orders_listOrders` | Order list with status, amounts, timestamps | JSON array |
| `orders_getOrder` | Single order with line items and status | JSON object |
| `orders_createOrder` | New order confirmation with order ID | JSON confirmation |
| `orders_updateOrder` | Updated order record with new status | JSON object |
| `crm_businessSummary` | KPI overview: total contacts, active orders, revenue, follow-up count, hot leads | JSON dashboard |
| `crm_submitFeedback` | NPS/CSAT submission confirmation | JSON confirmation |

## 2. Products & Storefront (10 tools)

| Tool | Output | Format |
|------|--------|--------|
| `storefronts_list` | All storefronts (payment links) with status, amount, provider | JSON array |
| `storefronts_create` | New storefront/checkout link with URL | JSON with URL |
| `storefronts_update` | Updated storefront record | JSON object |
| `storefronts_markPaid` | Payment confirmation for storefront | JSON confirmation |
| `storefronts_send` | Storefront URL dispatched via WhatsApp/email (draft-first) | Draft message |
| `storefronts_delete` | Deletion confirmation | JSON confirmation |
| `products_list` | Product catalog with name, price, SKU, stock | JSON array |
| `products_create` | New product record | JSON confirmation |
| `products_update` | Updated product record | JSON object |
| `products_delete` | Deletion confirmation | JSON confirmation |

## 3. Dashboard & Analytics (1 tool)

| Tool | Output | Format |
|------|--------|--------|
| `dashboard_metrics` | KPI snapshot: today's revenue, active orders, follow-ups due, hot leads, risky orders | JSON dashboard |

## 4. Invoices & Quotes (6 tools)

| Tool | Output | Format |
|------|--------|--------|
| `invoice_create` | Branded HTML invoice with country-specific tax (ITBMS/IVA/IGV), templates: clean, modern, bold | HTML document |
| `invoice_fromOrder` | Invoice generated from CRM order record | HTML document |
| `quote_create` | Branded HTML quote with validity period, line items, totals | HTML document |
| `quote_toInvoice` | Converts a quote to an invoice | HTML document |
| `invoice_list` | List of all invoices and quotes with status, amounts | JSON array |
| `invoice_send` | Invoice ready to send (draft-first) | JSON draft |

## 5. Presentation Decks (2 tools)

| Tool | Output | Format |
|------|--------|--------|
| `deck_create` | AI-generated branded slide deck. Templates: investor-pitch, sales-proposal, business-overview | HTML document |
| `deck_export` | Print-ready HTML with @media print page breaks | HTML print-ready |

## 6. Email Builder (3 tools)

| Tool | Output | Format |
|------|--------|--------|
| `email_buildTemplate` | Responsive branded HTML email. Templates: welcome, product-launch, newsletter | HTML email |
| `email_listTemplates` | Available templates and created email list | JSON array |
| `email_send` | Draft email queued for delivery (draft-first) | Draft confirmation |

## 7. Flyers & Promos (3 tools)

| Tool | Output | Format |
|------|--------|--------|
| `flyer_create` | Promotional flyer HTML. Templates: sale, event, product, holiday, menu | HTML document |
| `promo_create` | Social media promo for instagram/whatsapp/facebook with caption + hashtags | HTML + caption |
| `promo_listCreated` | All created content and templates | JSON array |

## 8. Websites (4 tools)

| Tool | Output | Format |
|------|--------|--------|
| `website_createLanding` | Full landing page with hero, features, testimonials, contact form | HTML page |
| `website_createCatalog` | Product grid page with WhatsApp order buttons | HTML page |
| `website_createBioLink` | Link-in-bio page (Linktree-style) | HTML page |
| `website_export` | Standalone HTML file for deployment | HTML file |

## 9. Documents / PDF (1 tool)

| Tool | Output | Format |
|------|--------|--------|
| `pdf_generate` | Branded HTML document from markdown/text with print CSS | HTML print-ready |

## 10. Image Generation (1 tool)

| Tool | Output | Format |
|------|--------|--------|
| `image_generate` | AI-generated image via DALL-E 3. Sizes: 1024x1024, 1792x1024, 1024x1792 | Image URL |

## 11. Brand Management (4 tools)

| Tool | Output | Format |
|------|--------|--------|
| `brand_setup` | Brand kit with name, colors, fonts, tone, language, tagline | JSON brand kit |
| `brand_get` | Current active brand kit | JSON object |
| `brand_update` | Updated brand kit | JSON object |
| `content_edit` | AI-edited HTML content via natural language instruction | Updated HTML |

## 12. Social Media Content (4 tools)

| Tool | Output | Format |
|------|--------|--------|
| `content_publish` | Publication record with platform post ID and URL | JSON with URL |
| `content_measure` | Performance: impressions, reach, likes, comments, shares, CTR, engagement rate | JSON metrics |
| `content_suggestBoost` | Ranked content worth promotion with boost scores, budget, estimated reach | JSON ranked list |
| `content_promote` | Paid promotion record with budget, duration, campaign ID | JSON campaign |

## 13. Marketing & Campaigns (6 tools)

| Tool | Output | Format |
|------|--------|--------|
| `marketing_generateContent` | AI copy for social, email, whatsapp, sms, ad | Text draft |
| `marketing_translateContent` | Translated content (Spanish/English/Portuguese) | Text |
| `marketing_draftNurture` | 4-touch nurture sequence across channels | JSON sequence |
| `marketing_draftCampaign` | Multi-touch campaign plan with timing, channels, messages | JSON campaign |
| `marketing_campaignReport` | Marketing performance summary | Text report |
| `marketing_listTemplates` | Available content templates | JSON list |

## 14. Sales Funnel (6 tools)

| Tool | Output | Format |
|------|--------|--------|
| `funnel_defineStages` | Funnel stage configuration | JSON config |
| `funnel_moveContact` | Contact stage update (synced to CRM) | JSON confirmation |
| `funnel_scoreLeads` | AI lead scores (0-100) with hot/warm/cold classification | JSON scored list |
| `funnel_getStatus` | Pipeline: contact counts per stage, conversion rates | JSON dashboard |
| `funnel_suggestNextAction` | AI next action per lead (call, follow-up, discount) | JSON recommendation |
| `funnel_stageReport` | Funnel conversion report | Text report |

## 15. Drip Campaigns (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `drip_createSequence` | Drip sequence with AI-generated touches | JSON sequence |
| `drip_enrollContact` | Enrollment with next-touch preview | JSON confirmation |
| `drip_listSequences` | All available drip sequences | JSON list |
| `drip_getEnrollments` | Enrollment status per contact per sequence | JSON status |
| `drip_executeTouch` | Renders and dispatches next touch (draft-first) | Channel message |

## 16. Mail Merge & Bulk (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `merge_createTemplate` | Template with {{variable}} placeholders | Template definition |
| `merge_renderMessage` | Personalized message for one contact | Text |
| `merge_bulkRender` | Personalized preview batch | JSON array |
| `merge_listTemplates` | All available templates | JSON list |
| `merge_sendBulk` | Bulk personalized send (draft-first) | Channel messages |

## 17. Broadcast & Auto-Reply (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `broadcast_preview` | Contact list preview for broadcast | JSON list |
| `broadcast_send` | Bulk WhatsApp message with personalization | WhatsApp messages |
| `broadcast_history` | Broadcast log with timestamps and counts | JSON log |
| `autoreply_get` | Current auto-reply configuration | JSON config |
| `autoreply_set` | Updated auto-reply rule | JSON confirmation |

## 18. Outbound Communications (6 tools)

| Tool | Output | Format |
|------|--------|--------|
| `outbound_sendWhatsApp` | WhatsApp text message (draft-first) | WhatsApp message |
| `outbound_sendEmail` | Email draft queued for delivery | Email draft |
| `outbound_sendVoiceNote` | ElevenLabs TTS → WhatsApp voice note | Audio MP3 |
| `outbound_makeCall` | WhatsApp AI voice call | Voice call |
| `outbound_sendSMS` | Twilio SMS draft | SMS draft |
| `outbound_sendVoiceCall` | Twilio TTS phone call | Voice call |

## 19. Voice / TTS (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `voice_speak` | TTS audio via ElevenLabs (MP3/PCM/ulaw) | Base64 audio |
| `voice_listVoices` | Available ElevenLabs voices | JSON list |
| `voice_getConfig` | Current voice configuration | JSON config |
| `voice_getWidget` | HTML embed for voice player | HTML snippet |
| `voice_getSignedUrl` | Signed streaming URL | URL string |

## 20. Business Calculators (8 tools)

| Tool | Output | Format |
|------|--------|--------|
| `advisor_employerCost` | Total employer cost breakdown for 17 LATAM countries | JSON breakdown |
| `advisor_severance` | Severance/liquidation estimate by country | JSON estimate |
| `advisor_pricing` | Cost-plus, value-based, competitive pricing analysis | JSON strategies |
| `advisor_breakeven` | Break-even: units/month, revenue required, daily units | JSON analysis |
| `advisor_unitEconomics` | CAC, LTV, LTV/CAC ratio, payback period, health label | JSON economics |
| `advisor_runway` | Cash runway projection with urgency label | JSON projection |
| `advisor_invoiceTax` | Country-specific tax calculation with line-item breakdown | JSON tax calc |
| `advisor_loanPayment` | Loan amortization with monthly payment, 6-month schedule | JSON amortization |

## 21. Country & Tax Config (3 tools)

| Tool | Output | Format |
|------|--------|--------|
| `country_configure` | Workspace configured for country (tax, currency, payments, e-invoice) | JSON config |
| `country_getConfig` | Current country configuration | JSON config |
| `country_validateTaxId` | Tax ID validation (RUC, RFC, NIT, CNPJ, RUT, CUIT, etc.) | JSON validation |

## 22. Memory & Context (6 tools)

| Tool | Output | Format |
|------|--------|--------|
| `memory_search` | Semantic search across stored memory | JSON results |
| `memory_search_conversations` | Past conversation search | JSON results |
| `memory_search_knowledge` | Knowledge base search | JSON results |
| `memory_store_knowledge` | Knowledge item stored | JSON confirmation |
| `memory_get_context` | Conversation history context | JSON history |
| `memory_stats` | Memory store statistics | JSON stats |

## 23. Document Scanning / OCR (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `doc_scan` | Structured extraction from image/PDF | JSON extracted data |
| `media_analyze_product` | Product listing from photo (ES/EN description, tags, price range) | JSON product |
| `media_scan_receipt` | Financial data from receipt (merchant, total, items, tax) | JSON financial |
| `media_describe` | Natural language description of image | JSON description |
| `media_ocr` | Full text extraction from image | JSON text |

## 24. Document Archive (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `archive_store` | Archived document with AI auto-tagging | JSON archive record |
| `archive_search` | Document search by keyword, type, date | JSON results |
| `archive_get` | Full document metadata and extracted fields | JSON detail |
| `archive_list` | Document inventory with type summary | JSON list |
| `archive_delete` | Soft-delete with audit trail | JSON confirmation |

## 25. SOPs (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `sop_search` | SOP search results by keyword | JSON results |
| `sop_get` | Full SOP content with steps and metadata | Markdown |
| `sop_list` | All SOPs with names, categories, versions | JSON list |
| `sop_create` | New SOP draft with steps | Markdown SOP |
| `sop_update` | New SOP version | Markdown SOP |

## 26. Web Research (4 tools)

| Tool | Output | Format |
|------|--------|--------|
| `web_scrape` | Page content and structured data from URL | JSON / text |
| `web_search` | Search results with titles, URLs, snippets | JSON results |
| `web_summarize` | AI summary of URL content | Text summary |
| `web_extract` | Targeted extraction: prices, emails, phones | JSON data |

## 27. Compliance (1 tool)

| Tool | Output | Format |
|------|--------|--------|
| `compliance_factCheck` | Outbound message compliance report: send / revise / hold | JSON report |

## 28. AI Completions (3 tools)

| Tool | Output | Format |
|------|--------|--------|
| `llm_complete` | Free-form LLM text completion | Text |
| `llm_analyze` | Structured analysis (summary, bullets, json, action-items) | Text or JSON |
| `llm_strategize` | Strategic thinking (Opus tier, C-suite level) | Text |

## 29. Payments (4 tools)

| Tool | Output | Format |
|------|--------|--------|
| `payments_processWebhook` | Payment record from Stripe/PayPal/Yappy/BAC | JSON confirmation |
| `payments_listTransactions` | Transaction list with amounts, providers, timestamps | JSON array |
| `payments_getTransaction` | Single transaction detail | JSON object |
| `payments_summary` | Revenue summary: today, this week, this month | JSON summary |

## 30. Inventory (3 tools)

| Tool | Output | Format |
|------|--------|--------|
| `inventory_checkStock` | Stock level for a product | JSON data |
| `inventory_adjustStock` | Stock adjustment with new level | JSON confirmation |
| `inventory_lowStockAlerts` | Products below threshold | JSON alerts |

## 31. Code & Document Generation (7 tools)

| Tool | Output | Format |
|------|--------|--------|
| `artifact_generateCode` | Generated code (TS, JS, SQL, bash, YAML, JSON) | Code text |
| `artifact_generateDocument` | Report, proposal, plan, email, spec, readme, runbook | Markdown |
| `artifact_generateTool` | KITZ OS tool module skeleton | TypeScript |
| `artifact_selfHeal` | Regenerated/repaired file content | Code/text |
| `artifact_generateMigration` | SQL migration script | SQL |
| `artifact_pushToLovable` | Frontend code pushed to Lovable UI | Confirmation |
| `artifact_list` | Artifact list from knowledge base | JSON list |

## 32. Email Inbox (3 tools)

| Tool | Output | Format |
|------|--------|--------|
| `email_listInbox` | Inbox messages with sender, subject, date | JSON array |
| `email_compose` | Email draft | Email draft |
| `email_sendApprovalRequest` | Approval request email | Email sent |

## 33. Agent Chat (1 tool)

| Tool | Output | Format |
|------|--------|--------|
| `agent_chat` | Response from specialized KITZ agent (CEO, CFO, CMO, Sales, Ops, Legal) | Text / JSON |

## 34. Calendar & Scheduling (7 tools)

| Tool | Output | Format |
|------|--------|--------|
| `calendar_listEvents` | Upcoming events with times, titles, locations | JSON array |
| `calendar_addEvent` | New event confirmation | JSON confirmation |
| `calendar_updateEvent` | Updated event | JSON confirmation |
| `calendar_deleteEvent` | Deletion confirmation | JSON confirmation |
| `calendar_findSlot` | Available meeting slots | JSON slots |
| `calendar_addTask` | New task with due date | JSON confirmation |
| `calendar_today` | Today's schedule: events and tasks | JSON + text |

## 35. Braindump (1 tool)

| Tool | Output | Format |
|------|--------|--------|
| `braindump_process` | Structured report: title, summary, key points, pros, cons, next steps | JSON report |

## 36. n8n Workflows (7 tools)

| Tool | Output | Format |
|------|--------|--------|
| `n8n_listWorkflows` | All n8n workflows with status | JSON list |
| `n8n_getWorkflow` | Single workflow definition | JSON workflow |
| `n8n_executeWorkflow` | Execution result | JSON output |
| `n8n_triggerWebhook` | Webhook trigger result | JSON response |
| `n8n_activateWorkflow` | Activation confirmation | JSON confirmation |
| `n8n_getExecutions` | Execution history | JSON list |
| `n8n_healthCheck` | n8n system health | JSON health |

## 37. Tool Factory (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `toolFactory_createFromTemplate` | New n8n tool from 21 built-in templates | Registration |
| `toolFactory_createFromDescription` | AI-generated n8n workflow from natural language | Registration |
| `toolFactory_createCompute` | Compute tool from JSON DSL | Registration |
| `toolFactory_listCustomTools` | All runtime-registered tools | JSON list |
| `toolFactory_deleteCustomTool` | Tool deletion | JSON confirmation |

## 38. Knowledge Base / RAG (3 tools)

| Tool | Output | Format |
|------|--------|--------|
| `rag_search` | Relevant text excerpts from 119+ intelligence documents | Text excerpts |
| `rag_index` | Re-index confirmation with chunk count | JSON confirmation |
| `rag_listDocs` | Indexed document list with chunk counts | JSON list |

## 39. Conversational Voice Calls (12 tools)

| Tool | Output | Format |
|------|--------|--------|
| `voice_call_start` | Initiate outbound AI call (Twilio + ElevenLabs + Deepgram + Claude) | Call session |
| `voice_call_inbound` | Answer incoming calls with AI receptionist | Call session |
| `voice_call_transfer` | Warm transfer to human with context + transcript | Transfer |
| `voice_call_conference` | Add third party to call | Conference |
| `voice_call_hold` | Place caller on hold with branded message | Hold |
| `voice_call_record` | Record call with consent | Recording |
| `voice_call_schedule` | Schedule outbound call for later | Scheduled call |
| `voice_call_campaign` | Mass outbound call campaign with personalized scripts | Campaign |
| `voice_call_ivr` | Conversational voice menu (no button presses) | IVR session |
| `voice_call_voicemail` | AI voicemail: listen, transcribe, summarize, create task | Voicemail |
| `voice_call_summary` | Post-call: transcript, sentiment, action items, CRM update | JSON report |
| `voice_call_analytics` | Call metrics: total, avg duration, sentiment, conversion | JSON analytics |

## 40. Predictive Intelligence (8 tools)

| Tool | Output | Format |
|------|--------|--------|
| `predict_revenue` | Revenue forecast next 30/60/90 days | JSON forecast |
| `predict_churn` | Customers at risk of leaving with probability scores | JSON risk list |
| `predict_stockout` | Days until each product runs out | JSON predictions |
| `predict_cashflow` | Cash runway + cash-out date + urgency | JSON projection |
| `predict_demand` | Demand forecast by product | JSON forecast |
| `predict_leadConversion` | Conversion probability per lead | JSON probabilities |
| `predict_bestTime` | Optimal time to post/send/call | JSON recommendations |
| `predict_ltv` | Lifetime value per customer | JSON valuations |

## 41. Proactive Actions (12 tools)

| Tool | Output | Format |
|------|--------|--------|
| `proactive_morningBrief` | 7am daily intelligence report | Formatted report |
| `proactive_eveningSummary` | 5pm daily wrap-up | Formatted report |
| `proactive_weeklyReport` | Sunday full business analysis | Formatted report |
| `proactive_serviceReport` | Time + money saved this period with ROI | JSON report |
| `proactive_churnIntervene` | Auto-draft win-back for at-risk customers | Draft messages |
| `proactive_invoiceChase` | Auto-escalate overdue invoices | Draft messages |
| `proactive_restockAlert` | Auto-draft purchase orders when stock low | Draft PO |
| `proactive_contentSuggest` | Draft posts when social feed is quiet | Draft content |
| `proactive_competitorWatch` | Monitor competitor pricing and activity | JSON intelligence |
| `proactive_complianceAlert` | Tax deadlines + regulation change alerts | Alert |
| `proactive_healthCheck` | Business vital signs dashboard | JSON vitals |
| `proactive_learningLoop` | Measure outcomes of actions, feed back into predictions | JSON outcomes |

## 42. Workflow Automation (15 tools)

| Tool | Output | Format |
|------|--------|--------|
| `workflow_create` | Build workflow from natural language | Workflow definition |
| `workflow_createFromTemplate` | Deploy from 25 pre-built templates | Workflow active |
| `workflow_list` | All active workflows + execution stats | JSON list |
| `workflow_get` | Full workflow detail + history | JSON detail |
| `workflow_edit` | Modify steps via natural language | Updated workflow |
| `workflow_pause` | Temporarily stop a workflow | JSON confirmation |
| `workflow_resume` | Restart paused workflow | JSON confirmation |
| `workflow_delete` | Remove a workflow | JSON confirmation |
| `workflow_test` | Dry run with sample data (no real sends) | JSON test results |
| `workflow_log` | Execution history + outcomes | JSON log |
| `workflow_analytics` | Performance: runs, success rate, time saved, revenue impacted | JSON analytics |
| `workflow_suggest` | AI suggests workflows from user's repetitive actions | JSON suggestions |
| `workflow_branch` | Add IF/ELSE conditions to workflow | Updated workflow |
| `workflow_schedule` | Set/change timing rules (cron, event, delay, business hours) | Updated schedule |
| `workflow_chain` | Connect workflows (output of one = trigger of next) | Chained workflow |

## 43. Google Workspace (49 tools)

### Gmail (13 tools)

| Tool | Output | Format |
|------|--------|--------|
| `gmail_listInbox` | Email list filtered by unread, sender, label, date, attachment | JSON array |
| `gmail_readEmail` | Full email + decoded attachments | JSON + attachments |
| `gmail_searchEmail` | Natural language search translated to Gmail query | JSON results |
| `gmail_compose` | AI-drafted email using brand tone + CRM context (draft-first) | Email draft |
| `gmail_reply` | Smart reply reading full thread context | Email draft |
| `gmail_forward` | Forward with AI TL;DR summary | Email |
| `gmail_sendWithAttachment` | Send any KITZ output as email attachment | Email + attachment |
| `gmail_labelAndSort` | AI auto-labels: Clients/Invoices/Leads/Suppliers/Personal | Labels applied |
| `gmail_createFilter` | Create Gmail filter from natural language | Filter created |
| `gmail_archiveOld` | Mass archive emails older than X days | Archive count |
| `gmail_autoRespond` | Auto-reply rules by sender, subject, keyword | Rules set |
| `gmail_watchInbox` | Real-time inbox monitoring with auto-routing | Watcher active |
| `gmail_digest` | Daily email digest: unread count, urgent, drafts ready | Formatted digest |

### Google Drive (10 tools)

| Tool | Output | Format |
|------|--------|--------|
| `drive_upload` | Upload any KITZ output to Drive, auto-organized by type + date | File uploaded |
| `drive_download` | Pull file from Drive into KITZ for processing | File content |
| `drive_search` | Natural language file search | JSON results |
| `drive_organize` | AI auto-organizes Drive folder structure | Folders created |
| `drive_share` | Share file/folder with permissions (view/edit/comment) | Share link |
| `drive_createFolder` | Create folders by project, client, or category | Folder created |
| `drive_moveFile` | Move/rename files, batch move | Files moved |
| `drive_autoSave` | Every KITZ output auto-saves to Drive | Auto-save active |
| `drive_watchFolder` | Monitor folder for changes, trigger workflows | Watcher active |
| `drive_backup` | Nightly backup of all KITZ data to Drive | Backup completed |

### Google Calendar (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `gcal_sync` | 2-way sync between KITZ and Google Calendar | Sync active |
| `gcal_multiCalendar` | Manage business/personal/team/deadlines calendars | Calendar config |
| `gcal_createWithMeet` | Create event + auto-generate Google Meet link | Event + Meet link |
| `gcal_shareAvailability` | Generate shareable availability link (Calendly-style) | Booking URL |
| `gcal_teamView` | Entire team's calendar in one view, auto-schedule | Team schedule |

### Google Sheets (10 tools)

| Tool | Output | Format |
|------|--------|--------|
| `sheets_read` | Read any Google Sheet, AI understands structure | JSON data |
| `sheets_import` | Import Sheet data into KITZ (contacts, products, invoices) | Import confirmation |
| `sheets_export` | Export KITZ data to Sheets (CRM, orders, transactions) | Sheet link |
| `sheets_appendRow` | Add row to any Sheet (every sale, expense, etc.) | Row added |
| `sheets_updateCell` | Update specific cells | Cells updated |
| `sheets_createDashboard` | AI builds Google Sheets dashboard with charts + formulas | Sheet link |
| `sheets_createTemplate` | Generate business templates (cash flow, budget, inventory, payroll) | Sheet link |
| `sheets_liveSync` | 2-way sync between KITZ and Sheets | Sync active |
| `sheets_analyze` | AI analyzes spreadsheet: trends, anomalies, insights | Text analysis |
| `sheets_formula` | Write formulas from natural language | Formula applied |

### Google Docs (7 tools)

| Tool | Output | Format |
|------|--------|--------|
| `docs_create` | Create Google Doc from KITZ output (proposals, contracts, SOPs) | Doc link |
| `docs_read` | Read any Google Doc into KITZ | Text content |
| `docs_edit` | AI edits Google Doc via natural language with track changes | Doc updated |
| `docs_template` | Generate branded business doc templates | Doc link |
| `docs_summarize` | Summarize any Doc (50-page contract → 1-page summary) | Text summary |
| `docs_translate` | Translate full Doc (ES/EN/PT), creates new copy | Doc link |
| `docs_mailMerge` | Mail merge from Sheet into Doc template, batch generate | Doc links |

### Google Slides (5 tools)

| Tool | Output | Format |
|------|--------|--------|
| `slides_create` | KITZ deck → Google Slides (fully editable) | Slides link |
| `slides_fromData` | Spreadsheet → presentation with auto-charts | Slides link |
| `slides_edit` | Add/modify slides from natural language | Slides updated |
| `slides_brand` | Apply brand kit to any Slides (colors, fonts, logo) | Slides updated |
| `slides_present` | Generate Meet + present Slides + auto meeting notes | Meet + Slides |

### Google Forms (4 tools)

| Tool | Output | Format |
|------|--------|--------|
| `forms_create` | AI generates Google Form from description, linked to Sheet | Form link |
| `forms_watchResponses` | Auto-route responses: leads→CRM, orders→orders, feedback→NPS | Watcher active |
| `forms_analyzeResults` | AI summary of form responses with trends + charts | Text analysis |
| `forms_embed` | Embed form on KITZ website | Embed code |

### Google Meet (4 tools)

| Tool | Output | Format |
|------|--------|--------|
| `meet_create` | Instant Meet link, auto-sent to attendees | Meet URL |
| `meet_schedule` | Schedule Meet with agenda + calendar event + reminder | Event + Meet |
| `meet_transcribe` | Auto-transcribe → meeting notes → action items → tasks | Doc + tasks |
| `meet_prep` | Pre-meeting brief: CRM profiles, history, talking points | JSON brief |

## 44. Channel Management (8 tools)

| Tool | Output | Format |
|------|--------|--------|
| `channel_detect` | Identify source channel of request | Channel ID |
| `channel_switch` | Move output to different channel ("send this to email") | Delivery confirmation |
| `channel_broadcast` | Send same message to all 3 channels | Multi-delivery |
| `channel_preferences` | User sets preferred channel per output type | Preferences saved |
| `channel_quietHours` | No notifications during set hours, queue for morning | Config saved |
| `channel_escalate` | If no response on channel A, try channel B | Escalation active |
| `channel_history` | Unified conversation history across all channels | JSON history |
| `channel_sync` | Keep context in sync across channels | Sync active |

---

## Scheduled Reports

| Report | Schedule | Output |
|--------|----------|--------|
| Morning Brief | Daily 7am | System status, business snapshot, next-step checklist |
| Evening Summary | Daily 5pm | Day wrap-up, completed tasks, tomorrow preview |
| Weekly Scorecard | Monday 9am | KPI deltas, conversion rates, revenue trend |
| Service Report | Weekly | Time saved, money impact, ROI calculation |
| Monthly Review | 1st of month | P&L, cash flow, tax estimate, growth metrics |
| Quarterly Review | Quarterly | QBR with strategic recommendations |

## Brain Agent Reports

| Agent | Schedule | Output |
|-------|----------|--------|
| Sales Agent | Daily 8am | Leads reviewed, warm leads, follow-up tasks |
| Ops Agent | Weekly Mon 9am | Open orders, aging, SLA violations |
| CFO Agent | Weekly Mon 9am | Revenue estimate, ROI plans, compliance |
