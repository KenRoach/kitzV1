# WhatsApp Commerce LatAm Intelligence SOP v1

**Owner:** CRO Agent
**Type:** market-intelligence

## Summary
WhatsApp is the #1 sales channel for LatAm SMBs. This SOP captures the latest market data, best practices, and technical patterns for WhatsApp commerce.

## Market Data (2025-2026)

### Scale
- Conversational commerce in LatAm: **$18.2 billion** (2025), +35% YoY
- 72% channeled through WhatsApp, 15% Instagram DM, 8% Messenger
- 75% of consumers who message a business on WhatsApp end up purchasing
- SMBs using AI Commerce see **up to 60% more sales** via automated WhatsApp campaigns

### Penetration by Country
| Country | WhatsApp Penetration | Business Adoption |
|---------|---------------------|-------------------|
| Brazil | 99% | 78% businesses selling via WA |
| Colombia | 94% | Growing rapidly |
| Mexico | 93% | Stripe Billing +139% in 2022 |
| Argentina | 90% | High adoption |
| Panama | ~90% | Primary SMB channel |

### Key Trends
- WhatsApp Pay expanding to Mexico and Colombia (6+ countries by end 2026)
- 70%+ of LatAm SMEs use WhatsApp as main sales channel
- AI agents resolve 60-80% of frequent queries without human intervention
- CRM must have native WhatsApp API integration (non-negotiable for LatAm)

## Baileys Technical Best Practices

### Connection Management
- Implement robust auto-reconnection logic
- Use multi-file auth state, back up regularly
- Never commit auth files to version control
- Configure `timeRelease` or scheduled restarts to clear accumulated data

### Anti-Spam Rules
- Add 2-5 second delays between messages
- Don't send identical messages to multiple contacts rapidly
- Practical limit: ~1000-2000 messages/day per number
- Read WhatsApp ToS — automation outside official API is risky

### Performance
- Ignore non-essential events (reduce CPU load)
- Store media in cloud storage (S3, Cloudinary), only keep references in DB
- Store conversation history in PostgreSQL, not in-memory
- Monitor `baileys_store.json` size — it grows with every event

### Security
- Sanitize and validate all incoming messages (prevent injection)
- Implement rate limiting
- Use HTTPS for webhooks
- Encrypt sensitive data at rest

### Voice Notes (Kitz-specific)
- MUST be OGG Opus format: `ffmpeg -i input.mp3 -c:a libopus -b:a 64k -ac 1 -ar 48000 output.ogg`
- mime_type: `audio/ogg; codecs=opus`

## CRM Integration Patterns

### LatAm CRM Requirements
1. Native WhatsApp API integration (multiple agents, same number)
2. Multi-currency support (USD, local currencies)
3. Local payment methods (Mercado Pago, bank transfers, vouchers)
4. Spanish-first UI
5. AI agent for auto-qualification and FAQ handling

### n8n Workflow Templates
- WhatsApp micro-CRM with Baserow
- WhatsApp AI customer service agent
- WhatsApp chatbot with product catalog vector store
- CRM enrichment + Google Sheets sync
- Appointment scheduling via WhatsApp + Calendar

## Rules
- WhatsApp is the primary channel — optimize for it first
- Every WhatsApp interaction should feel like texting a friend, not a robot
- 5-7 words default response, 15-23 max, 30 if complex
- AI responses in Spanish unless user messages in English
- Draft-first for all outbound — nothing sends without approval
