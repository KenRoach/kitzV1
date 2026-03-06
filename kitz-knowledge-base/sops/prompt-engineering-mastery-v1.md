# Prompt Engineering Mastery SOP v1

**Owner:** CTO Agent
**Type:** technical

## Summary
Kitz has 124+ tool modules that all depend on well-crafted prompts. This SOP codifies prompt engineering best practices from Anthropic's official courses and tutorials.

## The 80/20 Rules

### 1. Be Specific
Bad: "Write an email"
Good: "Write a 3-paragraph follow-up email in Spanish to a customer who placed their first order yesterday. Tone: warm, congratulatory."

### 2. Assign a Role
"You are a PMI-certified project manager advising LatAm SMBs. You speak Spanish by default. Be practical, not academic."

### 3. Separate Data from Instructions
Use XML tags to separate:
```
<customer_data>
Name: Maria Garcia
Business: Panaderia La Esperanza
Last order: March 1, 2026
</customer_data>

<instructions>
Write a follow-up WhatsApp message (max 15 words) checking if she's happy with her order.
</instructions>
```

### 4. Format Outputs
- JSON for structured data (tool responses)
- Markdown for human-readable content
- Always specify the exact JSON shape in the prompt

### 5. Chain of Thought
"Think step by step" for complex reasoning:
1. First analyze the customer's situation
2. Then identify the top 3 opportunities
3. Finally recommend one specific action

### 6. Provide Examples
2-3 input/output pairs for pattern matching:
```
Example 1:
Input: "Quiero facturar mas"
Output: { "intent": "revenue_growth", "urgency": "medium" }

Example 2:
Input: "No puedo pagar la renta"
Output: { "intent": "cash_flow_crisis", "urgency": "critical" }
```

### 7. Avoid Hallucinations
"If you don't know, say 'No tengo esa informacion.' Don't guess. Don't make up data."

## Model Selection (Kitz Tiers)

| Task Type | Model | Why |
|-----------|-------|-----|
| Intent classification | Haiku | Fast, cheap, accurate for simple tasks |
| Entity extraction | Haiku | Structured output, low latency |
| Content generation | Sonnet | Creative, nuanced, good balance |
| Strategic analysis | Sonnet | Complex reasoning at reasonable cost |
| C-suite decisions | Opus | Maximum capability, use sparingly |
| Tool execution | GPT-4o-mini (preferred) | Cheapest for tool-use loops |

### Cost Optimization
- Always try Haiku first — upgrade only if quality insufficient
- Prompt caching for repeated system prompts (saves 90% on input tokens)
- Shorter prompts = less cost. Every word costs money.
- Batch similar requests when possible

## System Prompt Patterns (Kitz-Specific)

### The Kitz Pattern
```
You are [ROLE] for LatAm SMBs.
[DOMAIN KNOWLEDGE — frameworks, rules, constraints]
[SMB ADAPTATIONS — lean, practical, no bureaucracy]
Default language: Spanish. Be practical, not academic.
Respond with valid JSON: { [EXACT SHAPE] }
```

### Anti-Patterns to Avoid
- Don't put examples in the system prompt (put in user prompt)
- Don't make system prompts too long (>2000 tokens gets expensive)
- Don't use vague instructions ("be helpful" — means nothing)
- Don't forget to specify the output format
- Don't assume the model knows Kitz-specific terminology

## Tool Description Quality
Claude selects tools based on description quality. Better descriptions = better tool selection.

Good: "Create a risk register with top 5 risks scored by probability x impact. Includes response strategies (Mitigar/Transferir/Aceptar/Evitar), owners, and triggers."

Bad: "Risk management tool"

## Evaluation (Before Deploying)
1. Test with 10+ diverse inputs
2. Check for hallucinations on edge cases
3. Verify JSON output parses correctly every time
4. Test in Spanish AND English
5. Measure latency and cost per call

## Rules
- Every tool module must have a specific system prompt (not generic)
- JSON output format must be specified in every prompt
- Spanish first, always
- Test before deploying — bad prompts waste AI Battery credits
- Shortest prompt that works is the best prompt
