# AI Platforms & Major Players — Kitz Intelligence Document

> **Classification:** Strategic Intelligence — Kitz Engineering & Product
> **Last updated:** 2026-02-24
> **Owner:** Kitz Platform Team
> **Review cadence:** Quarterly

---

## Executive Summary

Kitz currently runs a **Claude-primary, OpenAI-fallback** dual-LLM architecture via `claudeClient.ts`. This document maps the broader AI platform landscape, identifies architecture patterns worth adopting, and recommends a phased multi-model strategy optimized for LatAm SMB unit economics.

**Current Kitz AI Stack:**
- **Primary:** Anthropic Claude (Opus 4.6 / Sonnet 4 / Haiku 4.5) — tiered routing by task complexity
- **Fallback:** OpenAI (GPT-4o / GPT-4o-mini) — automatic failover on Claude errors
- **Orchestration:** n8n workflow automation
- **No current usage of:** embeddings, vector search, image generation, speech-to-text, or fine-tuning

**Key strategic gaps this document addresses:**
1. No embeddings/RAG pipeline for business knowledge retrieval
2. No image generation for the 24+ content creation tools
3. No speech/audio processing (critical for WhatsApp-heavy LatAm markets)
4. No structured output enforcement (JSON mode / function calling)
5. Single-region deployment with no edge inference strategy

---

## 1. Foundation Models & APIs

### 1.1 OpenAI — openai.com

**What it is:** The company behind GPT-4o, DALL-E 3, Whisper, and the most mature commercial LLM API ecosystem. Already integrated as Kitz's fallback provider.

**Key capabilities relevant to Kitz:**
- **GPT-4o / GPT-4o-mini:** Already used as fallback tiers in `claudeClient.ts`. GPT-4o-mini is exceptionally cost-effective for classification tasks (~$0.15/1M input tokens).
- **DALL-E 3:** Image generation via API. Directly useful for Kitz's content creation tools (social media graphics, product photos, ad creatives).
- **Whisper:** Open-source speech-to-text model. Supports Spanish, Portuguese, and 95+ other languages. Critical for WhatsApp voice message transcription in LatAm markets.
- **Function calling / Structured outputs:** JSON Schema enforcement on model outputs. Guarantees parseable responses for CRM field extraction, invoice data capture, and task creation.
- **Assistants API / Threads:** Managed conversation state with tool use, code interpreter, and file search. Reduces state management burden on Kitz's backend.
- **Batch API:** 50% cost reduction for non-real-time workloads. Ideal for nightly content generation queues, bulk email drafting, and analytics summarization.
- **Embeddings (text-embedding-3-small):** $0.02/1M tokens. Foundation for RAG pipelines over business documents, CRM notes, and email history.

**Architecture patterns worth adopting:**
- **Structured Outputs with JSON Schema:** OpenAI's `response_format: { type: "json_schema", json_schema: {...} }` guarantees valid JSON. Kitz should implement equivalent output validation regardless of provider. Anthropic supports this via tool use with input schemas.
- **Tiered model routing:** Kitz already does this well with the `ClaudeTier` system. OpenAI's equivalent (GPT-4o for reasoning, GPT-4o-mini for extraction) mirrors the Kitz pattern.
- **Batch API for async workloads:** Queue non-urgent content generation (next-day social posts, weekly reports) through batch endpoints at 50% cost savings.
- **Function calling for structured data extraction:** Instead of parsing free-text Claude responses to extract invoice fields or CRM data, define explicit function schemas. This eliminates regex parsing and reduces extraction errors from ~8% to <1%.

**Integration opportunity for Kitz:**
- **Now:** Add Whisper API for WhatsApp voice message transcription. LatAm users send 3-5x more voice messages than text. This is a competitive differentiator.
- **Now:** Implement structured output / function calling patterns in `claudeClient.ts` using Anthropic's tool use API (or OpenAI's function calling on the fallback path). Apply to all CRM data extraction, invoice parsing, and task creation flows.
- **Next Quarter:** Add DALL-E 3 integration for the content creation tools. Social media post generators, ad creative tools, and product listing builders all benefit from on-demand image generation.
- **Next Quarter:** Implement text-embedding-3-small for a business knowledge RAG pipeline. Index CRM notes, email threads, and chat history. Surface relevant context to Claude before generating responses.

**Priority:** **NOW** (Whisper, structured outputs) / **NEXT QUARTER** (DALL-E, embeddings)

---

### 1.2 OpenAI Platform Documentation — platform.openai.com/docs

**What it is:** OpenAI's comprehensive API documentation and developer guides. The gold standard for LLM API developer experience.

**Key patterns Kitz should study and adopt:**

- **Rate limit handling with exponential backoff:** OpenAI documents precise retry-after headers and backoff strategies. Kitz's current fallback is binary (Claude fails -> try OpenAI). A more sophisticated approach: retry with backoff on the same provider first, then fall back.
- **Token counting before submission:** Use tiktoken (or Anthropic's token counter) to pre-calculate costs and avoid truncation. Kitz currently slices context at character boundaries (`contextStr.slice(0, 8000)` in `claudeThink`), which can cut mid-sentence and waste tokens on incomplete context.
- **Streaming for real-time UX:** Both OpenAI and Anthropic support server-sent events (SSE) streaming. For chat interfaces, streaming the response token-by-token dramatically improves perceived latency. Kitz's current `stream: false` pattern means users wait for full generation before seeing anything.
- **Moderation endpoint:** Free content moderation API that checks for harmful content. Useful for Kitz's team chat and content creation tools to prevent misuse.
- **Usage tracking and billing alerts:** OpenAI's usage dashboard patterns should inform Kitz's own per-tenant AI cost tracking. Essential for sustainable LatAm SMB pricing.

**Architecture patterns worth adopting:**
- **SDK-first design:** OpenAI's official Node.js SDK handles retries, streaming, pagination, and error typing. Kitz's raw `fetch()` calls in `claudeClient.ts` should be replaced with the official Anthropic SDK (`@anthropic-ai/sdk`) and OpenAI SDK (`openai`), which handle edge cases that raw fetch does not (automatic retries, proper error classification, streaming helpers).
- **Prompt caching headers:** OpenAI and Anthropic both support prompt caching for system prompts that repeat across requests. Kitz's agent system prompts (like the strategic brain prompt in `claudeThink`) are identical across calls and would benefit significantly -- up to 90% cache hit rate on system prompt tokens.

**Integration opportunity for Kitz:**
- **Now:** Replace raw `fetch()` calls with official SDKs. This is a reliability and maintainability improvement with zero feature risk.
- **Now:** Implement streaming in the chat UI for real-time response display.
- **Now:** Switch from character-based context slicing to token-aware truncation.

**Priority:** **NOW** (SDK migration, streaming, token-aware truncation)

---

### 1.3 Anthropic — anthropic.com

**What it is:** The creator of Claude, Kitz's primary LLM. Anthropic's focus on AI safety, Constitutional AI training, and long-context capabilities makes Claude particularly well-suited for business applications where accuracy and reliability matter.

**Key capabilities relevant to Kitz:**
- **Claude Opus 4.6:** Kitz's current top-tier model for strategic thinking. Frontier-class reasoning with strong instruction following. Used in `claudeThink()` for C-suite-level analysis.
- **Claude Sonnet 4:** The workhorse tier. Strong balance of capability and cost. Used for content creation, operational agents, and analysis tasks.
- **Claude Haiku 4.5:** Fast classification and extraction. Sub-second latency for routing and categorization. Used in `claudeClassify()`.
- **Tool use (function calling):** Claude can call developer-defined tools with structured JSON inputs. This is Kitz's biggest unlocked capability -- it enables Claude to directly create CRM records, send invoices, schedule tasks, and trigger n8n workflows through defined tool schemas.
- **200K context window:** Claude supports 200K tokens of context, enabling analysis of entire email threads, long documents, and comprehensive CRM histories in a single request.
- **System prompts with caching:** Anthropic supports prompt caching. Kitz's agent system prompts (which are identical across requests for the same agent type) should use cached prompts to reduce costs by up to 90% on the system prompt portion.
- **Extended thinking:** Claude can "think" step-by-step before responding, improving accuracy on complex tasks. Useful for financial analysis, strategic recommendations, and multi-step planning.
- **Computer use (beta):** Claude can interact with computer interfaces. Future potential for automating legacy business tools that lack APIs.

**Architecture patterns worth adopting:**
- **Tool use for structured actions:** Define tool schemas for every Kitz action (create_contact, send_invoice, schedule_task, post_to_social). Claude selects and calls the appropriate tool based on user intent. This replaces Kitz's current semantic router with a more flexible, LLM-native approach.
- **Multi-turn tool use chains:** Claude can chain multiple tool calls in a single conversation turn. Example: user says "Invoice Maria for the web design project and schedule a follow-up call next week" -> Claude calls `create_invoice` then `schedule_task` in sequence.
- **System prompt layering:** Use a base system prompt for Kitz identity + a context layer for the current module (CRM, invoicing, content) + a user-specific layer (business name, industry, preferences). This three-layer approach maximizes prompt cache hits on the base layer while personalizing behavior.
- **Constitutional AI safety patterns:** Anthropic's approach to safety through principles (not just filters) is relevant for Kitz's content creation tools. Define business-appropriate content principles rather than relying on keyword blocking.

**Integration opportunity for Kitz:**
- **Now:** Implement tool use in `claudeClient.ts`. Define tool schemas for the top 10 most common user actions. This is the single highest-leverage technical improvement for Kitz's AI layer.
- **Now:** Enable prompt caching for all system prompts. Immediate cost reduction.
- **Next Quarter:** Implement extended thinking for the `claudeThink()` function. The strategic brain should show its reasoning chain, not just conclusions.
- **Future:** Evaluate computer use for automating interactions with LatAm government tax portals (SAT, SUNAT, SII) that lack modern APIs.

**Priority:** **NOW** (tool use, prompt caching) / **NEXT QUARTER** (extended thinking) / **FUTURE** (computer use)

---

### 1.4 Anthropic Documentation — docs.anthropic.com

**What it is:** Anthropic's official API documentation, covering the Messages API, tool use, vision, and safety best practices.

**Key patterns Kitz must implement:**

- **Tool use schema design:**
  ```
  Tool definition pattern:
  {
    name: "create_invoice",
    description: "Create and send an invoice to a client",
    input_schema: {
      type: "object",
      properties: {
        client_name: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string", enum: ["MXN", "BRL", "CLP", "COP", "USD"] },
        description: { type: "string" },
        due_date: { type: "string", format: "date" }
      },
      required: ["client_name", "amount", "currency"]
    }
  }
  ```
  Kitz should define tool schemas for every action exposed through the AI layer. The Claude model then decides which tool to call based on natural language input.

- **System prompt best practices:**
  - Put identity and role instructions first
  - Include explicit output format instructions
  - Use XML tags (`<context>`, `<instructions>`, `<format>`) to structure long system prompts
  - Kitz's current system prompts in `claudeClient.ts` are well-structured but should adopt XML tag formatting for complex agents

- **Safety patterns:**
  - Never put user-controlled text directly into system prompts (injection risk)
  - Use separate `user` message blocks for user input, even when building multi-part prompts
  - Kitz's `claudeThink()` correctly separates user question from business data, but `claudeCreate()` puts the raw prompt directly into a user message without sanitization -- review this for prompt injection risks

- **Vision capabilities:**
  - Claude can analyze images sent as base64 or URLs
  - Relevant for: receipt/invoice OCR, product photo analysis, WhatsApp image message understanding
  - Kitz's content creation tools could accept reference images and generate matching content

- **Streaming implementation:**
  ```
  Pattern: Server-Sent Events (SSE)
  - Send request with stream: true
  - Process event types: message_start, content_block_delta, message_stop
  - Accumulate text deltas for real-time display
  - Track usage from message_stop event for cost tracking
  ```

**Integration opportunity for Kitz:**
- **Now:** Audit all system prompts for injection vulnerabilities. Refactor `claudeCreate()` to sanitize user input.
- **Now:** Implement SSE streaming in the chat interface.
- **Next Quarter:** Add vision capability for receipt/invoice image processing.

**Priority:** **NOW** (safety audit, streaming) / **NEXT QUARTER** (vision)

---

### 1.5 Google DeepMind — deepmind.google

**What it is:** Google's frontier AI research lab, responsible for AlphaFold, Gemini's architecture, and breakthrough research in multi-modal AI, robotics, and scientific discovery.

**Key capabilities relevant to Kitz:**
- **Frontier research signals:** DeepMind's published research indicates where commercial AI capabilities will be in 12-18 months. Current focus areas: multi-modal reasoning, tool use agents, and long-horizon planning.
- **AlphaFold/AlphaCode methodology:** While the specific domains (biology, competitive programming) are not directly relevant, the methodology -- training specialized models for specific task types -- informs Kitz's strategy of using different model tiers for different task complexities.
- **Gemini architecture research:** Multi-modal from the ground up (text, image, audio, video in a single model). This architectural direction suggests Kitz should plan for unified multi-modal APIs rather than separate text/image/audio pipelines.

**Architecture patterns worth adopting:**
- **Specialist model routing:** DeepMind's research consistently shows that task-specific models outperform general models. Kitz's tier system (Opus for strategy, Haiku for classification) is directionally correct. Consider extending this to domain-specific fine-tuning in the future.
- **Evaluation-driven development:** DeepMind rigorously evaluates model performance on specific benchmarks. Kitz should build an internal eval suite for its AI features (content quality, classification accuracy, extraction precision) to objectively compare providers and prompt versions.

**Integration opportunity for Kitz:**
- **Future:** Monitor DeepMind's research publications for breakthroughs in multilingual reasoning (critical for Spanish/Portuguese markets) and small-model capabilities (critical for cost optimization).
- No direct integration path today. DeepMind's work reaches commercial availability through Google's Gemini product line.

**Priority:** **FUTURE** (monitoring only)

---

### 1.6 Google AI / Gemini — ai.google

**What it is:** Google's commercial AI platform built on Gemini models. Offers multi-modal capabilities (text, image, audio, video), massive context windows (up to 2M tokens), and tight integration with Google Workspace.

**Key capabilities relevant to Kitz:**
- **Gemini 2.0 Flash:** Extremely cost-effective model with strong multilingual performance. Competitive with GPT-4o-mini and Claude Haiku for classification and extraction tasks at lower cost.
- **2M token context window:** 10x larger than Claude's 200K. Enables analysis of entire business histories, year-long email archives, or comprehensive document collections in a single request.
- **Native multi-modal input:** Single API call accepts text + images + audio + video. Simplifies the architecture compared to separate Whisper + DALL-E + GPT pipelines.
- **Google Search grounding:** Gemini can ground responses in real-time Google Search results. Useful for market research, competitor analysis, and trend identification features in Kitz.
- **Gemini in Google Workspace:** Gmail, Docs, Sheets integration patterns are directly relevant to how Kitz integrates AI into its own productivity modules.

**Architecture patterns worth adopting:**
- **Multi-modal unified API:** Instead of separate endpoints for text, image, and audio processing, Gemini's single-endpoint multi-modal approach simplifies client code. If Kitz moves to a multi-provider strategy, abstract behind a unified interface that handles multi-modal inputs.
- **Grounding with search:** For Kitz's content creation tools, grounding AI-generated content in real search results improves accuracy and relevance. Example: "Write a blog post about coffee trends in Mexico" grounded in actual recent data.
- **Context caching:** Gemini's context caching API allows caching large contexts (business data, CRM exports) and reusing them across multiple requests at reduced cost. Highly relevant for Kitz's business analysis features.

**Integration opportunity for Kitz:**
- **Next Quarter:** Evaluate Gemini 2.0 Flash as a third-tier option alongside Haiku and GPT-4o-mini for classification and extraction tasks. Run cost and quality benchmarks on real Kitz workloads.
- **Next Quarter:** Prototype the 2M context window for "business health analysis" features that review a full quarter of business data in one pass.
- **Future:** Consider Gemini for multi-modal content creation (e.g., generating social media posts that combine text + image understanding of uploaded product photos).

**Priority:** **NEXT QUARTER** (cost benchmarking, long-context prototype) / **FUTURE** (multi-modal content)

---

### 1.7 Google Vertex AI — cloud.google.com/vertex-ai

**What it is:** Google Cloud's enterprise AI/ML platform. Provides managed model hosting, fine-tuning, evaluation, and deployment infrastructure. Supports Gemini, open-source models (Llama, Mistral), and custom models.

**Key capabilities relevant to Kitz:**
- **Model Garden:** Access to 150+ models (Gemini, Claude via partnership, Llama, Mistral, Stable Diffusion) through a single platform with unified billing and governance.
- **Vertex AI Search:** Managed RAG pipeline. Upload business documents, and Vertex handles chunking, embedding, indexing, and retrieval. Dramatically reduces the engineering effort for a knowledge base.
- **Vertex AI Evaluation:** Automated model evaluation framework. Define custom metrics and compare model performance across providers. Essential for a multi-model strategy.
- **Fine-tuning infrastructure:** Fine-tune Gemini or open-source models on Kitz-specific data (LatAm business terminology, industry-specific content patterns, regional language variations).
- **Grounding with enterprise data:** Connect Gemini to structured databases (BigQuery, Cloud SQL) for grounded responses. Relevant for Kitz's analytics and reporting features.

**Architecture patterns worth adopting:**
- **Managed RAG instead of DIY:** Kitz should not build a RAG pipeline from scratch. Use a managed solution (Vertex AI Search, or the simpler Anthropic/OpenAI equivalent) to index business knowledge.
- **Model evaluation pipeline:** Before switching models or prompts in production, run them through an automated evaluation pipeline against a fixed test set. Vertex AI's eval framework is the reference implementation.
- **Model routing with fallback:** Vertex AI's model routing patterns (primary -> fallback -> fallback) directly validate Kitz's existing `claudeClient.ts` architecture but suggest extending it with health checks, circuit breakers, and quality monitoring.

**Integration opportunity for Kitz:**
- **Future:** If Kitz moves to GCP, Vertex AI provides the infrastructure layer for the entire AI stack. However, the current direct-API approach (Anthropic + OpenAI) is simpler, cheaper, and more appropriate for Kitz's current scale.
- **Future:** Vertex AI Search is worth evaluating when Kitz builds its RAG pipeline, as it eliminates the need to manage vector databases directly.

**Priority:** **FUTURE** (evaluate when scaling beyond direct API calls)

---

## 2. Cloud AI Services

### 2.1 Microsoft Azure AI

**What it is:** Microsoft's enterprise AI platform. Hosts OpenAI models (GPT-4o, DALL-E, Whisper) with enterprise security, compliance, and Azure ecosystem integration. Also includes Azure Cognitive Services (speech, vision, language, translation).

**Key capabilities relevant to Kitz:**
- **Azure OpenAI Service:** Same GPT-4o models Kitz already uses via OpenAI's API, but with enterprise SLAs, data residency options (Brazil South region available), and HIPAA/SOC2 compliance. Identical API, different hosting.
- **Azure AI Translator:** Real-time translation across 130+ languages. Critical for Kitz's LatAm market where businesses may operate across Spanish, Portuguese, and English.
- **Azure AI Speech:** Text-to-speech and speech-to-text with LatAm Spanish and Brazilian Portuguese voice models. Higher accuracy than Whisper for regional accents and slang.
- **Copilot patterns (Microsoft 365 Copilot):** Microsoft's approach to embedding AI into existing productivity tools is the most direct reference architecture for how Kitz embeds AI into its modules. Key patterns:
  - AI appears contextually within the tool (not a separate chat window)
  - Suggested actions based on current context
  - One-click application of AI suggestions
  - Clear provenance ("Generated by AI — review before sending")

**Architecture patterns worth adopting:**
- **Data residency and compliance:** For LatAm enterprise customers (and future LGPD compliance in Brazil), Azure's regional hosting patterns matter. Kitz should plan for data residency requirements even if using direct APIs today.
- **Copilot UX patterns:** Microsoft's Copilot design language -- contextual AI suggestions, draft/review/apply workflow, confidence indicators -- should influence Kitz's AI UX across all 24+ content creation tools.
- **Responsible AI dashboard:** Azure's approach to monitoring AI outputs for fairness, reliability, and safety. Kitz should implement equivalent monitoring for its AI features, especially content generation.

**Integration opportunity for Kitz:**
- **Next Quarter:** Evaluate Azure AI Translator for real-time translation in team chat and email modules. This is a higher-quality, more cost-effective solution than using GPT for translation.
- **Future:** If Kitz targets enterprise LatAm customers (banks, telcos, government), Azure OpenAI Service provides the compliance and SLA story that direct API access does not.

**Priority:** **NEXT QUARTER** (translator evaluation) / **FUTURE** (enterprise compliance path)

---

### 2.2 AWS AI/ML

**What it is:** Amazon's AI/ML platform spanning managed AI services (Bedrock, SageMaker, Rekognition, Comprehend, Translate) and infrastructure (GPU instances, custom chips). The most comprehensive cloud AI infrastructure offering.

**Key capabilities relevant to Kitz:**
- **Amazon Bedrock:** Managed API access to Claude (Anthropic), Llama (Meta), Mistral, Stable Diffusion, and Amazon's own Titan models through a single API. Includes built-in RAG (Knowledge Bases), guardrails, and model evaluation.
- **Amazon Bedrock Knowledge Bases:** Managed RAG pipeline. Upload documents to S3, Bedrock handles chunking, embedding (Titan Embeddings), vector storage (OpenSearch Serverless), and retrieval. Extremely relevant for Kitz's business knowledge features.
- **Amazon Bedrock Guardrails:** Content filtering, PII redaction, and topic blocking applied as a layer on top of any model. Useful for Kitz's content creation tools and team chat.
- **Amazon Comprehend:** NLP service for entity extraction, sentiment analysis, key phrase extraction, and language detection. Pre-trained, no prompt engineering needed. Useful for automated CRM data enrichment.
- **Amazon Translate:** Neural machine translation for 75+ languages, including LatAm Spanish and Brazilian Portuguese variants.
- **SageMaker:** Full ML platform for training and hosting custom models. Relevant only if Kitz needs custom model training (e.g., industry-specific content classifiers for LatAm markets).

**Architecture patterns worth adopting:**
- **Bedrock's model-agnostic API:** Bedrock abstracts multiple model providers behind a single API. Kitz's `claudeClient.ts` already does a simpler version of this (Claude primary, OpenAI fallback). Bedrock's pattern of unified input/output format across providers is worth studying for Kitz's abstraction layer.
- **Knowledge Bases for RAG:** Instead of building a custom RAG pipeline (vector DB, embedding pipeline, retrieval logic), use a managed service. Bedrock Knowledge Bases or a simpler equivalent reduces engineering effort from weeks to days.
- **Guardrails as middleware:** Apply content safety rules as a middleware layer rather than embedding them in every prompt. This separates safety policy from model behavior, making it easier to update rules without changing prompts.

**Integration opportunity for Kitz:**
- **Next Quarter:** If Kitz runs on AWS, Bedrock is the fastest path to a production RAG pipeline. Knowledge Bases + Claude on Bedrock gives the same model quality with managed infrastructure.
- **Future:** Amazon Comprehend for automated CRM data enrichment (extract company names, amounts, dates, sentiment from emails and chat messages without using LLM tokens).

**Priority:** **NEXT QUARTER** (Bedrock RAG evaluation if on AWS) / **FUTURE** (Comprehend for data enrichment)

---

### 2.3 IBM watsonx

**What it is:** IBM's enterprise AI platform focused on governance, compliance, and transparency. Includes watsonx.ai (model studio), watsonx.data (data lakehouse), and watsonx.governance (AI lifecycle management).

**Key capabilities relevant to Kitz:**
- **AI Governance framework:** watsonx.governance provides model monitoring, bias detection, explainability, and audit trails. As LatAm AI regulations develop (Brazil's AI Bill, Mexico's AI guidelines), governance capabilities become increasingly important.
- **Granite models:** IBM's open-source enterprise LLMs. Smaller and more cost-effective than frontier models. Competitive for structured tasks like document processing, classification, and data extraction.
- **Regulated industry patterns:** IBM's deep experience with banking, healthcare, and government compliance in LatAm provides reference architectures for data handling, audit trails, and regulatory compliance.

**Architecture patterns worth adopting:**
- **AI governance layer:** Even without using watsonx, Kitz should implement:
  - Audit logging of all AI interactions (already partially done via `console.log` in `claudeClient.ts`, but needs structured storage)
  - Model version tracking (which model generated which output)
  - Cost attribution per tenant (essential for sustainable SMB pricing)
  - Output quality monitoring (automated checks on AI-generated content)
- **Fact sheet methodology:** IBM's AI FactSheets track model provenance, training data, and performance characteristics. Kitz should maintain an internal model card for each AI feature documenting: model used, expected accuracy, known limitations, and cost per call.

**Integration opportunity for Kitz:**
- **Future:** If Kitz targets regulated industries in LatAm (financial services, healthcare), watsonx governance patterns become essential. Not a direct integration, but a reference architecture.
- **Future:** Granite models as a cost-effective tier for simple extraction tasks, potentially replacing Haiku for the lowest-value classification work.

**Priority:** **FUTURE** (governance patterns as regulatory landscape develops)

---

## 3. Enterprise AI Platforms

### 3.1 Salesforce Einstein

**What it is:** Salesforce's AI layer embedded across its CRM platform. Einstein provides predictive analytics, generative AI (Einstein GPT), and autonomous agents (Agentforce) for sales, service, and marketing.

**Key capabilities relevant to Kitz -- directly applicable to Kitz's CRM module:**
- **Einstein Lead Scoring:** ML-based lead prioritization using historical conversion data. Kitz's CRM should implement equivalent scoring: analyze which leads converted to paying customers and surface similar profiles.
- **Einstein Activity Capture:** Automatically logs emails, calendar events, and calls to CRM records without manual data entry. Kitz already has email and WhatsApp integration -- auto-linking messages to CRM contacts is the next step.
- **Einstein GPT for Sales:** Generates personalized emails, summarizes account history, and drafts call preparation notes. Kitz's `claudeCreate()` function does basic content generation, but lacks the CRM context awareness that makes Einstein powerful.
- **Agentforce (autonomous agents):** AI agents that can autonomously handle customer service inquiries, qualify leads, and execute multi-step workflows. This is the direction Kitz's agent system should evolve toward.
- **Einstein Copilot actions:** Pre-defined actions (create record, update field, send email, schedule meeting) that the AI can invoke. Directly maps to Kitz's needed tool use implementation.

**Architecture patterns worth adopting:**
- **CRM-aware AI context:** Every AI interaction in Salesforce includes the relevant CRM context (account history, recent activities, pipeline stage, past purchases). Kitz should build an equivalent context assembly layer:
  ```
  For any AI request related to a contact:
  1. Pull contact record + custom fields
  2. Pull last 10 interactions (emails, chats, calls)
  3. Pull related invoices and payment history
  4. Pull related tasks and their status
  5. Assemble into structured context for Claude
  ```
- **Predictive analytics on CRM data:** Einstein trains models on the customer's own data to predict outcomes (deal close probability, churn risk, best contact time). Kitz can approximate this with prompt-based analysis using Claude: "Given this customer's history, what's the likelihood they'll renew?"
- **Action grounding:** Einstein's AI suggestions are always grounded in concrete, executable actions ("Send this email," "Create this task," "Update this field"). Kitz's AI responses should always end with specific, actionable next steps that can be executed with one click.

**Integration opportunity for Kitz:**
- **Now:** Implement CRM context assembly for AI interactions. When a user asks about a client in Kitz's chat, Claude should automatically receive the full client context.
- **Now:** Add "action suggestions" to AI responses -- every AI output should include 1-3 clickable actions (create task, send email, update record).
- **Next Quarter:** Build lead scoring using Claude analysis of historical conversion data. No ML pipeline needed -- use Claude to analyze patterns in past conversions and score new leads.
- **Next Quarter:** Implement auto-activity capture: every email, WhatsApp message, and chat message automatically linked to the relevant CRM contact.

**Priority:** **NOW** (CRM context assembly, action suggestions) / **NEXT QUARTER** (lead scoring, auto-capture)

---

### 3.2 Databricks

**What it is:** The data + AI lakehouse platform. Combines data warehousing, ETL, ML training, and model serving in a unified platform. Known for Apache Spark, Delta Lake, and MLflow.

**Key capabilities relevant to Kitz:**
- **Unity Catalog:** Governed data access across all data assets. As Kitz's data grows (CRM records, invoices, communications, AI-generated content), a governance layer becomes essential.
- **MLflow:** Open-source experiment tracking, model registry, and deployment. Even without Databricks, MLflow is valuable for tracking prompt versions, A/B testing AI features, and monitoring model performance.
- **Feature Store:** Manages ML features (computed business metrics, customer attributes, behavioral signals) for real-time and batch predictions. Relevant when Kitz builds predictive features (churn prediction, revenue forecasting).
- **Mosaic AI:** Databricks' LLM serving and fine-tuning platform. Supports fine-tuning open-source models on domain-specific data.

**Architecture patterns worth adopting:**
- **MLflow for prompt management:** Use MLflow (or a lightweight equivalent) to version-control prompts, track A/B test results, and monitor AI feature quality over time. Kitz's system prompts are currently hardcoded strings -- they should be versioned and tested like code.
- **Lakehouse for business intelligence:** As Kitz accumulates business data across modules (CRM, invoicing, tasks, communications), a unified analytics layer becomes valuable. The lakehouse pattern -- one copy of data, multiple query patterns -- is more sustainable than module-specific databases.
- **Feature engineering for AI context:** Pre-compute business metrics (monthly revenue trend, customer communication frequency, average invoice payment time) and store them as features. These pre-computed features provide richer context for AI analysis than raw data.

**Integration opportunity for Kitz:**
- **Future:** Adopt MLflow (open-source, runs anywhere) for prompt version control and AI feature evaluation. This is a lightweight adoption that does not require the full Databricks platform.
- **Future:** As Kitz grows beyond 1,000 active businesses, a unified analytics layer becomes necessary. Evaluate lakehouse architecture for cross-module business intelligence.

**Priority:** **FUTURE** (MLflow for prompt management when the team is ready)

---

### 3.3 Cohere

**What it is:** Enterprise-focused LLM company specializing in RAG, embeddings, and multilingual models. Known for the Command R+ model (strong at RAG and tool use) and best-in-class embedding models.

**Key capabilities relevant to Kitz:**
- **Embed v3 (multilingual):** State-of-the-art multilingual embedding model. Outperforms OpenAI embeddings on non-English text, particularly strong on Spanish and Portuguese. Critical for Kitz's LatAm market where business data is in Spanish/Portuguese.
- **Command R+ (RAG-optimized):** LLM specifically tuned for retrieval-augmented generation. Provides inline citations (references to source documents in the response), reducing hallucination and increasing user trust.
- **Rerank API:** Takes a query and a list of documents, returns them ranked by relevance. Dramatically improves RAG quality at minimal cost. Can be used as a layer on top of any vector search.
- **Multilingual support:** Cohere's models are trained with explicit multilingual objectives, not just English + fine-tuned. This results in more natural Spanish and Portuguese output compared to English-first models.

**Architecture patterns worth adopting:**
- **Two-stage retrieval (embed + rerank):** For Kitz's RAG pipeline, use a two-stage approach: (1) fast vector search with embeddings to find candidate documents, (2) rerank candidates with Cohere Rerank to surface the most relevant results. This pattern consistently outperforms single-stage retrieval.
- **Citations in AI responses:** Command R+'s inline citation pattern should be adopted regardless of provider. When Kitz's AI references business data (invoices, emails, CRM notes), the response should cite the specific source. This builds user trust and enables verification.
- **Multilingual embeddings for unified search:** Use Cohere's multilingual embeddings to build a unified search index across Spanish, Portuguese, and English business documents. Users can search in any language and find relevant results in any language.

**Integration opportunity for Kitz:**
- **Next Quarter:** Use Cohere Embed v3 (multilingual) as the embedding model for Kitz's RAG pipeline. This is a strong recommendation given the LatAm multilingual requirement. OpenAI embeddings perform well on English but degrade on Spanish/Portuguese.
- **Next Quarter:** Add Cohere Rerank as a quality layer on top of vector search results.
- **Future:** Evaluate Command R+ as an alternative to Claude for RAG-heavy features, given its superior citation capabilities.

**Priority:** **NEXT QUARTER** (multilingual embeddings, rerank) / **FUTURE** (Command R+ evaluation)

---

## 4. Hardware & Infrastructure

### 4.1 NVIDIA AI

**What it is:** The dominant GPU provider for AI training and inference. NVIDIA's ecosystem spans hardware (H100, H200, B200 GPUs), software (CUDA, TensorRT, Triton Inference Server), and cloud services (DGX Cloud, NIM microservices).

**Key capabilities relevant to Kitz:**
- **NVIDIA NIM (NVIDIA Inference Microservices):** Pre-optimized, containerized LLM inference endpoints. Deploy Llama, Mistral, or other open-source models with optimized performance on NVIDIA GPUs. Relevant if Kitz ever self-hosts models.
- **TensorRT-LLM:** Inference optimization library that significantly reduces latency and cost for LLM serving. Relevant for self-hosted model deployments.
- **NVIDIA AI Foundry:** Customized model training and optimization service. NVIDIA helps companies create domain-specific models optimized for their hardware.

**Architecture patterns worth adopting:**
- **Inference optimization awareness:** Even when using API-based models (Claude, GPT-4o), understanding inference economics helps Kitz make better decisions. Key principles:
  - Smaller models with better prompts often outperform larger models with naive prompts
  - Batching requests (where latency tolerance allows) reduces per-request cost
  - Caching identical or similar requests eliminates redundant inference
  - Quantized models (lower precision) can serve classification tasks at 50-75% lower cost
- **Edge inference for latency-sensitive tasks:** As NVIDIA pushes inference to smaller devices, consider whether classification, language detection, or PII detection could run locally (or at the edge) instead of making API calls. This reduces latency and cost for high-volume, low-complexity tasks.

**Integration opportunity for Kitz:**
- **Future:** If Kitz reaches scale where API costs exceed $10K-$20K/month, evaluate self-hosting open-source models (Llama 3, Mistral) on GPU instances for high-volume, low-complexity tasks (classification, extraction, embeddings). NVIDIA NIM makes this operationally feasible.
- **Future:** Monitor NVIDIA's small-model and edge-inference developments. If sub-$0.01 inference for classification tasks becomes available via edge deployment, it changes the unit economics of Kitz's AI features.

**Priority:** **FUTURE** (relevant only at significant scale)

---

## 5. Strategic Summary

### 5.1 Current Kitz AI Stack: Strengths and Gaps

**Strengths:**
| Strength | Implementation | Location |
|---|---|---|
| Tiered model routing | Opus/Sonnet/Haiku by task complexity | `claudeClient.ts` |
| Automatic failover | Claude -> OpenAI on error | `claudeClient.ts` |
| Cost-aware token limits | Different max_tokens per tier | `TIER_MAX_TOKENS` |
| Temperature tuning | Per-tier temperature for quality control | `TIER_TEMPERATURE` |
| Specialized functions | `claudeThink`, `claudeCreate`, `claudeClassify` | `claudeClient.ts` |
| Structured logging | JSON logging with trace IDs | All functions |

**Gaps (ordered by business impact):**
| Gap | Impact | Effort to Fix | Priority |
|---|---|---|---|
| No tool use / function calling | AI cannot take actions (create records, send messages) | Medium | NOW |
| No streaming | Users wait for full response before seeing output | Low | NOW |
| No prompt caching | Overpaying on system prompt tokens (every request) | Low | NOW |
| Character-based context slicing | Wasted tokens, broken context | Low | NOW |
| Raw fetch instead of SDKs | Missing retries, error typing, streaming helpers | Low | NOW |
| No embeddings/RAG | AI cannot reference business history | Medium | Next Quarter |
| No image generation | 24 content tools with zero visual output | Low | Next Quarter |
| No speech-to-text | Cannot process WhatsApp voice messages | Low | Next Quarter |
| No structured output enforcement | Fragile parsing of free-text responses | Medium | Next Quarter |
| No AI cost tracking per tenant | Cannot price AI features sustainably | Medium | Next Quarter |
| No prompt versioning | Cannot A/B test or roll back prompts | Low | Future |
| No model evaluation pipeline | Cannot objectively compare providers | Medium | Future |
| No multilingual embeddings | Search/RAG degraded for Spanish/Portuguese | Medium | Future |

### 5.2 Multi-Model Strategy Recommendations

**Phase 1 — NOW (Current Quarter): Strengthen the Claude Core**
- Implement Anthropic tool use in `claudeClient.ts` for structured actions
- Enable prompt caching for all system prompts (immediate cost reduction)
- Replace raw `fetch()` with official Anthropic and OpenAI SDKs
- Add SSE streaming to the chat interface
- Switch from `contextStr.slice(0, 8000)` to token-aware truncation
- Audit system prompts for injection vulnerabilities

**Phase 2 — NEXT QUARTER: Add Specialized Capabilities**
- Add OpenAI Whisper for WhatsApp voice message transcription
- Add DALL-E 3 or Stable Diffusion for content creation image generation
- Build RAG pipeline using Cohere Embed v3 (multilingual) for embeddings
- Add Cohere Rerank for retrieval quality
- Implement per-tenant AI cost tracking and usage dashboards
- Evaluate Gemini 2.0 Flash as a cost-effective third-tier option
- Build CRM context assembly (Salesforce Einstein pattern)

**Phase 3 — FUTURE: Scale and Optimize**
- Evaluate self-hosting open-source models for high-volume low-complexity tasks
- Implement MLflow or equivalent for prompt version control
- Build model evaluation pipeline for objective provider comparison
- Evaluate Vertex AI or Bedrock for managed RAG at scale
- Add AI governance layer as LatAm AI regulations develop
- Explore fine-tuning for LatAm-specific business language and patterns

### 5.3 Cost Optimization for LatAm SMB Pricing

LatAm SMB pricing is fundamentally different from US SaaS. Kitz must optimize AI costs aggressively to maintain viable unit economics at LatAm price points.

**Current estimated cost structure (per active business per month):**
| Tier | Model | Est. Requests/mo | Avg Tokens/req | Cost/1M input | Cost/1M output | Est. Monthly Cost |
|---|---|---|---|---|---|---|
| Opus | claude-opus-4-6 | ~50 | ~3,000 | $15.00 | $75.00 | ~$2.50-5.00 |
| Sonnet | claude-sonnet-4 | ~200 | ~1,500 | $3.00 | $15.00 | ~$1.50-3.00 |
| Haiku | claude-haiku-4.5 | ~500 | ~800 | $0.80 | $4.00 | ~$0.80-1.50 |
| **Total** | | **~750** | | | | **~$5-10/business/mo** |

**Cost optimization levers (ordered by impact):**

1. **Prompt caching (30-50% reduction on system prompt tokens):**
   Kitz's system prompts repeat identically across requests. Anthropic's prompt caching charges 10% of normal input token price for cached tokens. With system prompts comprising 40-60% of input tokens, this yields 30-50% input cost reduction.

2. **Aggressive tier routing (20-30% reduction):**
   Audit which requests currently go to Sonnet that could use Haiku. Classification, entity extraction, yes/no decisions, and formatting tasks should all use Haiku. Only complex analysis, multi-step reasoning, and creative content should use Sonnet.

3. **Batch API for non-real-time work (50% reduction on batch-eligible requests):**
   Content scheduled for future posting, nightly analytics summaries, and weekly reports can use OpenAI's Batch API at 50% discount. Estimated 15-20% of total requests are batch-eligible.

4. **Response caching (10-20% reduction):**
   Cache identical or near-identical requests. Common patterns: same classification prompt with same input, repeated FAQ-style questions, template-based content with same parameters. Use a Redis cache with prompt+input hash as key.

5. **Token-aware context assembly (10-15% reduction):**
   Replace `contextStr.slice(0, 8000)` with intelligent context assembly that prioritizes relevant information and respects token boundaries. Reduces wasted tokens from truncated or irrelevant context.

6. **Gemini Flash as cost tier (future, 40-60% reduction on applicable tasks):**
   Gemini 2.0 Flash pricing is significantly lower than Haiku for comparable quality on simple tasks. Evaluating this as a fourth tier for the lowest-complexity work could substantially reduce costs.

**Target cost structure after optimization:**
| Optimization | Estimated Savings | New Est. Cost/Business/Mo |
|---|---|---|
| Baseline (current) | -- | $5.00-10.00 |
| + Prompt caching | -35% | $3.25-6.50 |
| + Better tier routing | -25% | $2.45-4.90 |
| + Batch API | -10% | $2.20-4.40 |
| + Response caching | -15% | $1.85-3.75 |
| + Token-aware context | -10% | $1.65-3.35 |
| **Optimized total** | **~65% reduction** | **$1.65-3.35** |

At $1.65-3.35/business/month in AI costs, Kitz can sustainably price its AI features within a $15-30/month LatAm SMB subscription.

---

## 6. Provider Quick Reference

| Provider | Primary Use Case for Kitz | API Endpoint | Key Model | Priority |
|---|---|---|---|---|
| **Anthropic** | Primary LLM (reasoning, content, classification) | api.anthropic.com | Claude Opus/Sonnet/Haiku | NOW (current) |
| **OpenAI** | Fallback LLM + Whisper + DALL-E + Embeddings | api.openai.com | GPT-4o + Whisper + DALL-E 3 | NOW (expand) |
| **Cohere** | Multilingual embeddings + Rerank for RAG | api.cohere.com | Embed v3 + Rerank | Next Quarter |
| **Google Gemini** | Cost-effective classification tier + long context | generativelanguage.googleapis.com | Gemini 2.0 Flash | Next Quarter |
| **Azure AI** | Translation + enterprise compliance path | Various Azure endpoints | Azure Translator + Azure OpenAI | Next Quarter / Future |
| **AWS Bedrock** | Managed RAG pipeline (if on AWS) | bedrock-runtime.amazonaws.com | Knowledge Bases + Claude | Next Quarter / Future |
| **Salesforce Einstein** | CRM AI patterns (study, not integrate) | N/A (pattern reference) | N/A | NOW (patterns) |
| **NVIDIA** | Self-hosted inference (at scale) | N/A (infrastructure) | NIM + TensorRT | Future |
| **IBM watsonx** | AI governance patterns | N/A (pattern reference) | N/A | Future |
| **Databricks** | Prompt management (MLflow) | N/A (MLflow is OSS) | MLflow | Future |

---

## 7. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-24 | Claude remains primary LLM | Best instruction following, tool use, safety. Kitz's prompts are already tuned for Claude. |
| 2026-02-24 | OpenAI expands beyond fallback | Whisper (voice), DALL-E (images), embeddings fill capability gaps Claude does not cover. |
| 2026-02-24 | Cohere for multilingual embeddings | Superior Spanish/Portuguese embedding quality vs. OpenAI for LatAm market. |
| 2026-02-24 | No self-hosting until >$10K/mo AI spend | API-based approach is operationally simpler and more appropriate for current scale. |
| 2026-02-24 | Gemini Flash evaluation for Q2 | Potential 40-60% cost reduction on classification tier. Needs quality benchmarking. |

---

*This document should be reviewed quarterly and updated as the AI platform landscape evolves. Next review: 2026-05-24.*
