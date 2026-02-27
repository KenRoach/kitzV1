# KITZ OS — Conversational Voice Call Engine Specification

> Version: 1.0 | Date: 2026-02-27
> KITZ doesn't just text. KITZ talks.

---

## Overview

KITZ makes and receives real phone calls with full conversational AI. During a call, KITZ can look up orders, calculate prices, book appointments, send invoices, and transfer to a human — all in real-time.

---

## Architecture

```
Phone Network ←→ Twilio Voice API ←→ WebSocket ←→ KITZ Voice Engine
                                                      │
                                    ┌─────────────────┼──────────────┐
                                    ▼                 ▼              ▼
                              Deepgram STT      Claude Sonnet    ElevenLabs TTS
                              (Hear)            (Think)          (Speak)
                                                    │
                                    ┌───────────────┼──────────────┐
                                    ▼               ▼              ▼
                              CRM Tools       Orders Tools    Calendar Tools
                              (Look up)       (Check)         (Book)
```

### Tech Stack
- **Telephony:** Twilio Voice API (outbound + inbound)
- **Speech-to-Text:** Deepgram (real-time streaming, multilingual)
- **AI Brain:** Claude Sonnet (low-latency reasoning, tool use)
- **Text-to-Speech:** ElevenLabs multilingual_v2 (natural voice)
- **Transport:** WebSocket for real-time audio streaming
- **Latency target:** < 800ms per conversational turn

### Languages
- Spanish (primary — auto-detect dialect)
- English (auto-detect and switch)
- Portuguese (Brazilian)
- Auto-detect: switch language mid-call if customer switches

---

## Call Types

### Outbound (KITZ calls them)
- Order updates and confirmations
- Sales calls (leads, follow-ups)
- Appointment reminders
- Invoice collection
- Delivery confirmations
- Customer birthday calls
- Win-back calls for churning customers
- Post-purchase check-ins

### Inbound (They call KITZ)
- Order inquiries ("Where's my order?")
- Appointment booking
- Price inquiries
- Customer support / complaints
- General FAQs
- After-hours (voicemail + task creation)

### Scheduled (KITZ calls automatically)
- 24hr appointment reminders
- Overdue invoice follow-up
- Post-purchase NPS
- Reactivation for dormant customers
- New lead follow-up (within 5 min of inquiry)

### Campaigns (KITZ calls many)
- Product launch announcements
- Event invitations with RSVP
- Surveys and feedback collection
- Seasonal promotions

---

## Call Flow

### Pre-Call Intelligence
```
1. crm_getContact → Full customer profile
2. orders_listOrders → Open orders
3. memory_search → Past conversations
4. rag_search → Negotiation tactics, customer service SOP
5. brand_get → Business tone, language
6. llm_strategize → Call brief with talking points + guardrails
```

### Live Call — Real-Time Tool Use
| Customer says | KITZ does (in real-time) |
|---------------|-------------------------|
| "Where's my order?" | orders_getOrder → status + ETA |
| "How much for 50 units?" | advisor_pricing → bulk calculation |
| "Schedule me for next week" | calendar_findSlot → offers times → calendar_addEvent |
| "I want to place an order" | storefronts_create → "Sending payment link now" → outbound_sendWhatsApp |
| "I'm not happy" | analyzeSentiment → tactical empathy → resolution offer |
| "Send me the invoice" | invoice_create → outbound_sendWhatsApp → "Check your WhatsApp" |
| "Can I talk to a real person?" | voice_call_transfer → warm transfer with full context |
| *silence 5 sec* | "Are you still there?" / *silence 10 sec* → graceful end |

### Post-Call Processing
```
1. brain:transcribeCall → Full transcript with timestamps + speakers
2. brain:analyzeSentiment → Call sentiment + urgency
3. llm_analyze → Summary: duration, outcome, action items, follow-up
4. crm_updateContact → Last contact, notes, tags, next follow-up
5. memory_store → Store call context for future conversations
6. funnel_moveContact → Update pipeline stage
7. calendar_addEvent → Schedule follow-up task
8. archive_store → Archive transcript + recording
9. Owner notification (WhatsApp):
   "Call complete — Maria Garcia
    2:34 | Positive
    Summary: Confirmed delivery. Asked about bulk pricing.
    Actions: Send bulk quote, follow up in 3 days."
```

---

## Guardrails

- Never promise what can't be delivered
- Never fabricate information — look it up or say "let me check"
- If customer is unhappy → empathize first (Chris Voss tactical empathy)
- If customer wants human → warm transfer immediately with context
- Max call duration: 5 minutes, then wrap up gracefully
- Record consent: "This call may be recorded for quality" at start
- Draft-first for any commitments made during call (discounts, credits)
- All call data logged with traceId for audit

---

## 12 Voice Call Tools

| Tool | Description |
|------|-------------|
| `voice_call_start` | Initiate outbound AI call |
| `voice_call_inbound` | Answer incoming calls with AI receptionist |
| `voice_call_transfer` | Warm transfer to human with context |
| `voice_call_conference` | Add third party to call |
| `voice_call_hold` | Place on hold with branded message/music |
| `voice_call_record` | Record call with consent |
| `voice_call_schedule` | Schedule call for later (KITZ calls automatically) |
| `voice_call_campaign` | Mass outbound call campaign with personalized scripts |
| `voice_call_ivr` | Conversational voice menu (natural language, no buttons) |
| `voice_call_voicemail` | AI voicemail: listen, transcribe, summarize, create task |
| `voice_call_summary` | Post-call report with transcript, sentiment, actions |
| `voice_call_analytics` | Call metrics: total, duration, sentiment, conversion |

---

## Implementation

### New Service: Part of engine/comms-api (port 3013)
- WebSocket server for Twilio media streams
- Deepgram streaming STT integration
- ElevenLabs streaming TTS integration
- Claude Sonnet for real-time reasoning with tool access
- Call state machine (ringing → connected → active → ended)

### Environment Variables
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

### AI Battery Cost
- Voice calls: ~2-3 credits per minute
  - STT: ~0.5 credits/min (Deepgram)
  - LLM: ~1 credit/min (Claude Sonnet)
  - TTS: ~0.5-1 credit/min (ElevenLabs)
- Average 2-3 min call: 5-8 credits
- Campaign of 50 calls: ~250-400 credits
