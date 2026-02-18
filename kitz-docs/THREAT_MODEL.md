# THREAT_MODEL

## Key Threats and Mitigations

1. **Auth bypass**
   - Threat: direct unauthenticated API calls.
   - Mitigation: gateway auth middleware stub plus mandatory authorization headers.

2. **Cross-tenant data leak**
   - Threat: requests operating on wrong tenant context.
   - Mitigation: enforce `orgId` on gateway requests and schema contracts.

3. **Webhook forgery**
   - Threat: attacker posts fake provider callbacks.
   - Mitigation: webhook signature placeholder checks in payments and connectors.

4. **Replay attacks**
   - Threat: duplicate webhook/send requests execute repeatedly.
   - Mitigation: idempotency key dedupe + retries + dead-letter in notifications queue.

5. **Prompt injection**
   - Threat: adversarial prompt manipulates model behavior.
   - Mitigation: llm-hub task routing policy and conservative prompt handling.

6. **Data exfiltration**
   - Threat: API keys/PII leaked to model providers.
   - Mitigation: redaction policy for keys, card-like numbers, and emails before provider calls.
