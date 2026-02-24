# KITZ AI Business OS -- Privacy Policy

**Effective Date:** February 2026
**Jurisdiction:** Republic of Panama
**Service:** KITZ AI Business Operating System
**Contact:** privacy@kitz.services

---

## 1. Overview

KITZ ("we", "our", "us") is an AI-powered Business Operating System designed for small businesses in Latin America. This Privacy Policy describes how we collect, use, store, and protect your personal and business data when you use our services.

## 2. Data We Collect

We collect the following categories of data:

**Personal Information**
- Name, email address, and phone number (provided during registration)
- Authentication credentials (hashed and salted, never stored in plain text)

**Business Data**
- CRM contacts, orders, invoices, and payment transaction metadata
- Storefront configurations and product catalogs
- Task lists, calendar events, and business notes
- Business performance metrics and analytics

**Communication Data**
- WhatsApp messages processed through KITZ (self-chat and business conversations routed through our connector)
- Email drafts and templates created via the platform
- Voice notes processed through our TTS/STT pipeline

**Usage Data**
- AI Battery consumption (credits, tokens, API calls)
- Feature usage patterns and session metadata
- Error logs and system diagnostics (with PII redacted)

## 3. How We Use Your Data

We use your data to:

- Provide and operate the KITZ platform and its features
- Process AI-powered business insights, recommendations, and automations
- Generate cadence reports (daily, weekly, monthly, quarterly)
- Route and deliver WhatsApp messages through the connector
- Process payments via integrated payment providers
- Improve service quality and develop new features
- Comply with legal obligations under Panamanian law

**We never sell your data.** AI processes your data solely to provide business insights and automations within the platform.

## 4. Data Storage and Security

- **Database:** All structured data is stored in PostgreSQL via Supabase, encrypted at rest using AES-256 encryption
- **File Storage:** Temporary media files (voice notes, documents) are processed in memory and not retained after processing
- **Authentication State:** WhatsApp authentication state is stored locally in encrypted session files
- **Audit Trail:** All system actions are logged with trace IDs for accountability, with PII redacted from logs
- **Rate Limiting:** API endpoints are rate-limited (120 req/min global) to prevent abuse
- **Draft-First:** All outbound messages require explicit user approval before sending

## 5. Data Retention

- **Active Accounts:** Your data is retained for the duration of your active account
- **Account Closure:** Upon account closure, all personal and business data is permanently deleted within 30 days
- **AI Battery Ledger:** Spend tracking data is retained for billing reconciliation for up to 90 days after account closure
- **Audit Logs:** System audit logs (with PII redacted) are retained for 12 months for security purposes
- **Backups:** Database backups are retained for 30 days and then permanently destroyed

## 6. Third-Party Data Sharing

We share data only with the following categories of third-party service providers, and only to the extent necessary to operate the platform:

**Payment Processors**
- Stripe (international card payments)
- PayPal (international payments)
- Yappy / Banco General (Panama domestic payments)
- BAC Compra Click (Central American payments)

Payment processors receive only transaction-specific data (amount, currency, reference IDs). They do not receive your full business data.

**AI Providers**
- Anthropic (Claude API -- text analysis, content generation, semantic routing)
- OpenAI (GPT API -- tool-routing execution)
- ElevenLabs (text-to-speech voice generation)

AI providers process message content to generate responses. We use API-level agreements that prohibit these providers from training on your data.

**Infrastructure**
- Supabase (database hosting and edge functions)
- Railway (application hosting)

We do not share your data with advertisers, data brokers, or any other third parties.

## 7. Your Rights

Under Panamanian data protection law (Law 81 of 2019), you have the right to:

- **Access:** Request a copy of all personal data we hold about you
- **Correction:** Request correction of inaccurate or incomplete data
- **Deletion:** Request permanent deletion of your personal data
- **Data Portability:** Request an export of your data in a standard machine-readable format (JSON/CSV)
- **Objection:** Object to specific processing activities
- **Withdrawal of Consent:** Withdraw consent for data processing at any time

To exercise any of these rights, contact us at privacy@kitz.services. We will respond within 15 business days.

## 8. AI Usage Disclosure

KITZ uses artificial intelligence to:

- Classify and route incoming messages (5-phase semantic router)
- Generate business insights, reports, and recommendations
- Automate CRM operations, order management, and scheduling
- Process voice notes and documents
- Generate content drafts (subject to user approval before sending)

All AI-generated actions follow the draft-first principle: no outbound communication is sent without explicit user approval. The AI Battery system tracks all AI consumption for transparency.

## 9. Cookies and Tracking

KITZ uses minimal session cookies required for authentication and platform functionality. We do not use:

- Third-party tracking cookies
- Advertising cookies
- Analytics cookies from third-party providers
- Browser fingerprinting

## 10. Children's Privacy

KITZ is designed for business use by adults (18 years and older). We do not knowingly collect data from individuals under 18 years of age.

## 11. International Data Transfers

Your data may be processed in servers located outside of Panama (including the United States) through our infrastructure and AI providers. All such transfers are governed by appropriate data processing agreements that ensure equivalent levels of data protection.

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. When we make material changes, we will notify you via:

- WhatsApp message to your registered number
- Email to your registered email address
- In-app notification on the KITZ dashboard

The updated policy will take effect 30 days after notification.

## 13. Contact Us

For privacy-related inquiries, data requests, or complaints:

- **Email:** privacy@kitz.services
- **Response Time:** 15 business days

---

*This policy is governed by the laws of the Republic of Panama, including Law 81 of 2019 on Personal Data Protection.*
