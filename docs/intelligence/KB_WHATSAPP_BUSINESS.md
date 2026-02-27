# WhatsApp Business — KITZ Knowledge Base Intelligence

> Module: WhatsApp Business | Sources: 5 | Auto-generated from KITZ Knowledge Base

> Ingestion: Enriched with live web content + WebSearch intelligence

---


## Developer Hub


### WhatsApp Business Platform Docs `[Critical]`

- **ID:** PKB-138
- **Type:** Docs
- **URL:** https://business.whatsapp.com/developers/developer-hub
- **Why KITZ Needs It:** Official API docs, webhooks, rate limits, policy
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Official WhatsApp Business Platform documentation hub. Platform options: WhatsApp Business App (free, small businesses) and WhatsApp Business Platform API (Cloud API hosted by Meta, or On-Premises API being deprecated). Key docs: Getting Started (Meta Business Portfolio, business verification, phone registration), Messages (text, media, location, contacts, interactive buttons/lists/flows), Templates (pre-approved, categories: Marketing/Utility/Authentication), Webhooks (incoming messages, status updates, errors), Phone Number Management, Business Profile, WhatsApp Flows (structured forms/surveys in-chat), Payments (live in Brazil/India). Rate limits: Tier 1 start 250 convos/24h, up to Tier 4 unlimited. Quality Rating Green/Yellow/Red. API 80 msg/s Cloud. Session messages free within 24h; template messages charged. Opt-in required for marketing. KITZ's most critical dependency. Migration path from Baileys to Cloud API needed. Template management for order confirmations, reminders, receipts. WhatsApp Flows could replace multi-turn dialogs. Quality rating must be monitored. WhatsApp 90%+ penetration across LATAM.


---


## Cloud API


### WhatsApp Cloud API (Meta) `[Critical]`

- **ID:** PKB-139
- **Type:** Docs
- **URL:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Why KITZ Needs It:** Cloud-hosted API for sending messages at scale
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Meta-hosted API at graph.facebook.com/v19.0/. Send messages: POST /{phone-number-id}/messages for text, image, document, template, interactive buttons (up to 3), interactive list (up to 10 items), location, contacts, reactions. Webhooks: POST /webhook for incoming messages, delivery statuses (sent/delivered/read/failed), errors. Media: upload POST /{phone-number-id}/media (5MB images, 16MB audio/video, 100MB documents). Templates: POST /{waba-id}/message_templates, 24-48h approval, categories Marketing/Utility/Authentication, languages es/es_MX/es_AR/pt_BR, components Header/Body/Footer/Buttons. Auth: System User access token (permanent). Common errors: 131047 (send failed), 131048 (spam limit), 131049 (invalid number), 131056 (rate limit), 368 (policy block). Production path for KITZ WhatsApp. Baileys works now but Cloud API needed for business-grade reliability, compliance, Flows, Payments, 80 msg/s. Plan migration. Webhook feeds into 5-phase semantic router. Supports all LATAM phone formats.


---


## Business App


### WhatsApp Business App `[Critical]`

- **ID:** PKB-140
- **Type:** Product
- **URL:** https://business.whatsapp.com/
- **Why KITZ Needs It:** Free app for small businesses (catalog, quick replies)
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Free mobile/desktop app for small businesses (Android/iOS/web). Features: Business Profile (name, description, address, hours), Catalog (up to 500 products with images/prices), Cart & Orders (customer sends order message), Quick Replies (saved messages, "/" trigger), Labels (organize contacts/chats), Greeting Message (auto for first-time), Away Message (configurable schedule), Short Links (wa.me/phone?text=), QR Codes, Broadcast Lists (up to 256 contacts), Multi-Device (up to 5). Business App vs API: App is free/manual/5 devices/basic automation; API is paid/programmatic/unlimited agents/full control. KITZ target users currently use Business App as primary tool. KITZ should complement initially then serve as upgrade path. 256-contact broadcast limit is key constraint resolved by API. Catalog data can sync to KITZ workspace. WhatsApp Business App is the de facto tool for 80%+ LATAM micro-businesses.


---


## Pricing


### WhatsApp API Pricing `[High]`

- **ID:** PKB-141
- **Type:** Docs
- **URL:** https://developers.facebook.com/docs/whatsapp/pricing
- **Why KITZ Needs It:** Conversation-based pricing model (marketing/utility/service)
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Conversation-based pricing per 24-hour window. Categories: Marketing (most expensive, promotions), Utility (mid-tier, order updates), Authentication (lower, OTPs), Service (cheapest, user-initiated). LATAM pricing (USD/conversation): Brazil Marketing $0.0625/Utility $0.0080/Auth $0.0315/Service $0.0300; Mexico $0.0436/$0.0100/$0.0216/$0.0044; Colombia $0.0125/$0.0008/$0.0069/$0.0060; Argentina $0.0618/$0.0034/$0.0340/$0.0029; Peru $0.0703/$0.0039/$0.0354/$0.0035; Chile $0.0889/$0.0091/$0.0520/$0.0060. Free tier: 1,000 service conversations/month per WABA. 24h conversation window covers multiple messages. Free entry point: user from FB/IG ad click-to-WhatsApp = free 72h. Optimization: prioritize service (user-initiated), use utility not marketing for updates, consolidate in 24h window, leverage free entry points. Directly impacts KITZ economics. AI Battery must account for WhatsApp costs. Utility 5-10x cheaper than marketing. 1,000 free service/month fits SMB volume. LATAM pricing significantly lower than US/EU.


---


## BSP Integration


### Twilio WhatsApp API `[High]`

- **ID:** PKB-142
- **Type:** Platform
- **URL:** https://www.twilio.com/en-us/messaging/channels/whatsapp
- **Why KITZ Needs It:** Programmable WhatsApp via Twilio (popular BSP)
- **Fetch Status:** SUCCESS

**Extracted Intelligence:**

```
WhatsApp Business API | Twilio
Global reach with a local feel. That's the power of WhatsApp.
Engage your customers across campaigns, promotions, and live support through WhatsApp messaging and calling—powered by Twilio's programmable APIs.
Build WhatsApp experiences with less hassle, more hustle
Deliver rich, interactive experiences on WhatsApp to connect with 3+ billion users.
Twilio simplifies WhatsApp onboarding, creating templates, automating workflows, and meeting compliance.
Use cases: Alerts, Verification, Support, Conversion, AI-powered agents.
Case studies: Magalu (Brazil) >2x seller onboarding conversion, 20% sales increase. inDrive 89% conversion rate, 96% fraud blocking.
```

**Intelligence (Enriched):**

Twilio BSP for WhatsApp. Features: Content Templates, Media Messages, Interactive Messages, Conversations API (multi-channel: WhatsApp+SMS+chat+email), Twilio Flex (contact center), Studio (visual workflow builder). Pricing: Meta conversation pricing + Twilio markup ~$0.005-$0.01/message, no monthly minimum, $15.50 free trial credit. Twilio vs Direct Cloud API: Twilio is easier setup, higher cost, multi-channel, has Flex contact center; Direct is harder setup, lower cost, WhatsApp-only. Notable LATAM clients: Rappi, NuBank, Magalu. Viable BSP option for KITZ. Conversations API enables unified messaging. Cost consideration: markup adds up at LATAM scale, direct Cloud API likely cheaper. Alternative LATAM BSPs: 360dialog, Infobip, Vonage, Bird, Gupshup.

