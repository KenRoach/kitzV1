# WhatsApp Repos -- KITZ Knowledge Base Intelligence

> Module: WhatsApp Repos | Sources: 5 | Batch 7 Intelligence
> Last updated: 2026-02-27

---

## API Wrapper

### Evolution API (GitHub)
- **Priority:** Critical
- **ID:** PKB-288
- **URL:** https://github.com/EvolutionAPI/evolution-api
- **Why KITZ needs it:** Open-source WhatsApp integration: Baileys+Official API, Chatwoot, Dify, n8n

**Extracted Intelligence:**

Evolution API is an open-source WhatsApp integration API that goes beyond messaging. Integrates with: Typebot, Chatwoot (customer service), Dify (AI trigger management, multiple agents), n8n (workflow automation with media support). Baileys integration for WhatsApp Web connection. Event streaming: RabbitMQ, Apache Kafka, WebSocket. Active development with chatbot improvements (N8N, Evolution Bot) and Chatwoot/Baileys service enhancements.

**KITZ Application:** Critical for KITZ's WhatsApp connector evolution. Chatwoot integration enables customer service workflows. Dify integration for AI agent management. n8n integration for workflow automation. Multi-protocol event streaming (RabbitMQ, Kafka, WebSocket) provides infrastructure flexibility. Directly relevant to kitz-whatsapp-connector architecture.

---

### WPPConnect (GitHub Topics)
- **Priority:** High
- **ID:** PKB-289
- **URL:** https://github.com/topics/whatsapp-bot
- **Why KITZ needs it:** Open-source WhatsApp Web API: Node.js framework, multi-device, TypeScript

**Extracted Intelligence:**

WPPConnect is a JavaScript community project exporting WhatsApp Web functions to Node.js. Written in TypeScript (859 stars, 627 forks). WPPConnect/WA-JS: lower-level WhatsApp Web function export (TypeScript, 566 stars, 173 forks). WPPConnect Server: ready-to-use API. Supports customer service, media sending, AI intelligence recognition. Multi-device functionality. Related: whatsapp-web.js (popular WhatsApp client library for Node.js by pedroslopez).

**KITZ Application:** Alternative/complement to Baileys for WhatsApp integration. TypeScript codebase aligns with KITZ's tech stack. Ready-to-use server option could accelerate development. Community-driven with active maintenance.

---

## AI Chatbot

### WhatsApp ChatGPT Bot
- **Priority:** High
- **ID:** PKB-290
- **URL:** https://github.com/wassengerhq/whatsapp-chatgpt-bot
- **Why KITZ needs it:** Ready-to-use AI WhatsApp bot: GPT-4o, audio+image, RAG, MCP compatible

**Extracted Intelligence:**

Customizable AI WhatsApp chatbot by Wassenger. Supports GPT-4o with text + audio + image input, audio responses, RAG + MCP Tools. Multi-language (90+ languages). Human handoff capability. Uses Wassenger API (WhatsApp cloud solution) + Ngrok webhooks.

**Implementations available:** Node.js (main), Python, PHP, C#.

**Key Features:** Automatic replies, image analysis, audio transcription + TTS, human handoff, RAG for external data loading, MCP tool integration.

**KITZ Application:** Reference architecture for KITZ's own WhatsApp AI bot. Multi-language support critical for LATAM. Human handoff pattern directly applicable. RAG + MCP integration patterns can inform KITZ's implementation. Multiple language implementations provide flexibility.

---

### Python WhatsApp Bot
- **Priority:** High
- **ID:** PKB-291
- **URL:** https://github.com/daveebbelaar/python-whatsapp-bot
- **Why KITZ needs it:** Pure Python WhatsApp bot: Meta Cloud API, Flask, OpenAI integration guide

**Extracted Intelligence:**

Pure Python WhatsApp bot using Meta Cloud API + Flask. OpenAI integration for AI responses. Webhook events for real-time message reception. OpenAI Assistants API integration with retrieval tool. Requires: Meta developer account, ngrok for webhook tunneling (static domain needed for Meta validation).

**KITZ Application:** Reference for Python-based WhatsApp integration. Meta Cloud API approach (vs Baileys) provides official API path. OpenAI Assistants API pattern applicable to KITZ's LLM integration. Ngrok tunneling pattern useful for development/testing.

---

## E-Commerce Bot

### WhatsApp E-Commerce Chatbot
- **Priority:** High
- **ID:** PKB-292
- **URL:** https://github.com/bibinprathap/whatsapp-chatbot
- **Why KITZ needs it:** WhatsApp commerce bot: NL-to-cart with OpenAI, Baileys, SQLite, order mgmt

**Extracted Intelligence:**

AI sales agent for WhatsApp converting natural language to SQLite orders. LLM-powered intent recognition: "2 milks and an apple" creates a cart instantly. Multi-device via @whiskeysockets/baileys (no Chrome dependency). Persistent carts, addresses, timestamps in better-sqlite3. Privacy-first: swap OpenAI for Ollama (local LLM) option. Stage router (src/stages/*.js) for deterministic menu flows. Cron-driven abandoned cart nudges every 10 minutes. Token-based auth state for fast reconnects. Node.js 18+ required.

**KITZ Application:** Directly relevant to KITZ's WhatsApp commerce features. NL-to-cart is the exact user experience KITZ should deliver. Baileys integration matches KITZ's current stack. Abandoned cart nudges are a revenue recovery feature. Ollama option enables local LLM for cost savings. Stage router pattern applicable to KITZ's conversation flows.
