# Anthropic Claude Mastery SOP v1

**Owner:** CTO Agent
**Type:** technical

## Summary
Kitz's comprehensive knowledge of Anthropic's Claude ecosystem — APIs, SDKs, skills, plugins, prompt engineering, agent patterns, and CI/CD automation. This knowledge powers Kitz's AI capabilities and enables SMB users to leverage Claude effectively.

## Source Repositories (github.com/anthropics)

### 1. Skills Framework (`anthropics/skills`)
- **18 reusable skill templates** for extending Claude with domain expertise
- **Pattern:** YAML frontmatter + markdown instructions per skill folder
- **Categories:** Creative (art, design), Technical (testing, MCP), Enterprise (comms, branding), Documents (DOCX, PDF, PPTX, XLSX)
- **Key skills:** `claude-api`, `mcp-builder`, `brand-guidelines`, `frontend-design`, `webapp-testing`, `skill-creator`
- **For Kitz:** Create Spanish-language SMB skills (invoice generation, tax compliance, WhatsApp automation)

### 2. Claude Code CLI (`anthropics/claude-code`)
- **Terminal IDE** — reads codebase, executes git workflows, bash, file operations via natural language
- **Plugin system:** `.claude-plugin/plugin.json` + commands/ + skills/ + agents/ + hooks/
- **Hooks:** PreToolUse, PostToolUse, SessionStart — intercept and validate actions
- **14+ official plugins** for dev tools, code review, security
- **For Kitz:** Build Claude Code plugins for LatAm SMB verticals

### 3. Cookbooks (`anthropics/claude-cookbooks`)
- **20+ Jupyter notebooks** with working Python examples
- **Recipes:** RAG (Pinecone/Wikipedia), Classification, Summarization, Text-to-SQL, Tool Use
- **Vision:** Image analysis, chart reading, form extraction
- **Sub-agents:** Haiku as lightweight worker + Opus as decision-maker
- **Advanced:** Prompt caching, JSON mode, evaluations, moderation filters, PDF parsing
- **For Kitz:** Invoice OCR, customer inquiry classification, multi-language summarization

### 4. Prompt Engineering Tutorial (`anthropics/prompt-eng-interactive-tutorial`)
- **9-chapter interactive tutorial** from basics to industry-specific use cases
- **Beginner (1-3):** Structure, clarity, role assignment
- **Intermediate (4-7):** Data/instruction separation, output formatting, chain-of-thought, examples
- **Advanced (8-9):** Avoiding hallucinations, complex prompts (legal, financial, coding)
- **For Kitz:** Train SMB customers on prompt best practices, especially for multilingual contexts

### 5. Courses (`anthropics/courses`)
- **5 structured courses** in Jupyter notebooks:
  1. API Fundamentals — keys, messages, vision, streaming, parameters
  2. Prompt Engineering — complements the interactive tutorial
  3. Real World Prompting — production scenarios
  4. Prompt Evaluations — measuring prompt quality systematically
  5. Tool Use — 6 lessons from overview to multi-tool chatbots
- **For Kitz:** Ready-made curriculum for SMB team training

### 6. Quickstarts (`anthropics/claude-quickstarts`)
- **6 complete runnable projects:**
  - Customer Support Agent — knowledge base search + multi-turn + escalation
  - Financial Data Analyst — data visualization + chart generation
  - Computer Use Demo — desktop control (click, type, scroll)
  - Browser Tools API — web automation (navigation, DOM, forms, screenshots)
  - Autonomous Coding Agent — two-agent pattern (initializer + coder)
- **For Kitz:** Adapt Customer Support Agent for LatAm (Spanish, WhatsApp via Twilio)

### 7. Knowledge Work Plugins (`anthropics/knowledge-work-plugins`)
- **11 domain-specific plugins** — Sales, Marketing, Finance, Legal, Product, Engineering, HR, Data, Operations, Enterprise Search, Bio Research
- **Plugin architecture:** Skills (auto-triggered) + Commands (slash actions) + MCP connectors
- **Sales plugin example:**
  - Skills: account-research, call-prep, competitive-intelligence, draft-outreach
  - Commands: /call-summary, /forecast, /pipeline-review
  - Connectors: HubSpot, Slack, Clay, ZoomInfo, Gmail, Calendar
- **Standalone + supercharged pattern:** Works without integrations (free), better with tools (paid)
- **For Kitz:** Build LatAm-specific sales/finance/HR plugins

### 8. Official Plugins (`anthropics/claude-plugins-official`)
- **31 official Claude Code plugins:**
  - LSP integrations (Clang, Go, Java, Kotlin, TypeScript)
  - Code Review — 5 parallel Sonnet agents (compliance, bugs, history, patterns, comments)
  - Feature Dev — 7-phase workflow (plan > design > implement > test > review > refactor > docs)
  - Hookify — custom hooks to prevent bad behaviors
  - Security guidance — XSS, SQL injection, pickle deserialization detection
  - Ralph Loop — self-iterating agent (loops until task done)
- **For Kitz:** Multi-agent patterns for complex validation

### 9. Agent SDK Python (`anthropics/claude-agent-sdk-python`)
- **Python SDK** (3.10+) for programmatic Claude Code control
- **query():** Simple async one-off invocations
- **ClaudeSDKClient:** Bidirectional stateful conversations
- **Custom tools:** `@tool` decorator, in-process MCP servers
- **Hooks:** PreToolUse, PostToolUse — intercept tool calls
- **Options:** cwd, system_prompt, allowed_tools, permission_mode
- **For Kitz:** Build backend automation with custom tools (WhatsApp MCP, CRM MCP)

### 10. Claude Code Action (`anthropics/claude-code-action`)
- **GitHub Action** for CI/CD automation with Claude
- **Auto-detects** @claude mentions, issue assignments, or explicit prompts
- **Capabilities:** Code review, implementation, bug fixes, security analysis, PR inline comments
- **8 ready-to-use workflows:** PR review, path-specific reviews, security, issue triage, doc sync, maintenance
- **For Kitz:** Automated code review for SMB dev agencies, doc generation, security checks

## Key Architecture Patterns

### Pattern 1: Skills (No-Code Knowledge)
```
skill-folder/
  SKILL.md          # YAML frontmatter + instructions
  reference.md      # Additional knowledge (optional)
```
Best for: Domain expertise, best practices, role-specific guidance.

### Pattern 2: Plugins (Full Workflows)
```
.claude-plugin/
  plugin.json       # Metadata + config
  commands/         # /slash commands
  skills/           # Auto-triggered domain knowledge
  agents/           # Specialized sub-agents
  hooks/            # Pre/Post tool use validation
  .mcp.json         # External tool connectors
```
Best for: Complete vertical solutions with tool integrations.

### Pattern 3: Multi-Agent (Parallel Specialists)
```
Agent 1 (Compliance) ──┐
Agent 2 (Bugs)      ──┤
Agent 3 (Patterns)  ──├─→ Aggregator → Final Output
Agent 4 (History)   ──┤
Agent 5 (Comments)  ──┘
```
Best for: Complex analysis requiring multiple perspectives.

### Pattern 4: Hooks (Safety/Compliance)
```
PreToolUse:  validate before execution (payment limits, approval workflows)
PostToolUse: audit after execution (logging, compliance checks)
```
Best for: Enforcing business rules, preventing unauthorized actions.

### Pattern 5: Standalone + Supercharged
```
Free tier:  Works with web search only (no integrations)
Paid tier:  Connected to CRM, email, calendar, payment tools
```
Best for: Kitz's freemium model — value without setup, power with tools.

## Prompt Engineering Best Practices

### The 80/20 Rules
1. **Be specific** — "Write a 3-paragraph email" not "Write an email"
2. **Assign a role** — "You are a LatAm tax advisor for SMBs"
3. **Separate data from instructions** — Use XML tags: `<data>` `<instructions>`
4. **Format outputs** — JSON for structured data, markdown for human reading
5. **Chain of thought** — "Think step by step" for complex reasoning
6. **Provide examples** — 2-3 input/output pairs for pattern matching
7. **Avoid hallucinations** — "If you don't know, say so. Don't guess."

### Claude Model Tiers (for Kitz)
| Tier | Model | Use Case | Cost |
|------|-------|----------|------|
| Opus | claude-opus-4-6 | Strategy, C-suite, complex analysis | $$$ |
| Sonnet | claude-sonnet-4-6 | Content, analysis, project planning | $$ |
| Haiku | claude-haiku-4-5 | Classification, extraction, formatting | $ |

### Tool Use Pattern
```json
{
  "name": "tool_name",
  "description": "What this tool does — be specific",
  "input_schema": { "type": "object", "properties": {...}, "required": [...] }
}
```
Claude selects tools based on description quality. Better descriptions = better tool selection.

## Steps (Leveraging Claude Knowledge in Kitz)
1. **Use tiered models** — Haiku for triage/classification, Sonnet for analysis/content, Opus for strategy
2. **Build skills as markdown** — No code needed, pure instructions the LLM follows
3. **Wire plugins for verticals** — Sales, Finance, Operations per LatAm market
4. **Enforce rules via hooks** — Draft-first, AI Battery limits, scope control
5. **Offer standalone + supercharged** — Free tier works, paid tier integrates

## Rules
- Always use the cheapest model that can do the job (Haiku first)
- Spanish first for all user-facing outputs
- Every tool description must be specific enough for Claude to select correctly
- Prompt caching for repeated system prompts (saves 90% on input tokens)
- Never expose API keys — use environment variables
- Test prompts with evaluations before deploying to production
