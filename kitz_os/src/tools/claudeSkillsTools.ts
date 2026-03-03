/**
 * Claude Skills Tools — Expert role-based advisory skills adapted from alirezarezvani/claude-skills.
 *
 * 40 curated skills organized into 8 categories:
 *   - C-Level Advisory (4): CEO advisor, CTO advisor, CFO advisor, COO advisor
 *   - Business Growth (4): customer success, sales engineer, contract writer, revenue ops
 *   - Product & UX (5): product manager, product strategist, UX researcher, agile PO, competitive teardown
 *   - Engineering Leadership (6): senior architect, code reviewer, DevOps, security, incident commander, tech debt tracker
 *   - Engineering Specialized (6): database designer, API reviewer, CI/CD builder, RAG architect, agent designer, performance profiler
 *   - Marketing Intelligence (5): demand acquisition, campaign analytics, social media analyzer, content creator, ASO
 *   - Project Management (4): scrum master, senior PM, release manager, runbook generator
 *   - Compliance & Quality (6): GDPR expert, risk management, quality manager, financial analyst, CAPA officer, regulatory affairs
 *
 * Each skill uses callLLM with expert system prompts. Spanish-first for LatAm SMBs.
 *
 * Source: https://github.com/alirezarezvani/claude-skills (MIT license)
 */

import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('claudeSkillsTools');

// ── Helper: Parse JSON from LLM response ──
function parseJSON(raw: string): Record<string, unknown> {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { raw_output: raw };
  } catch {
    return { raw_output: raw };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// System Prompts by Category
// ═══════════════════════════════════════════════════════════════════════════════

const CLEVEL_SYSTEM = `You are a C-level executive advisor for small businesses in Latin America.
You combine McKinsey strategic frameworks, Harvard Business Review insights, and practical LatAm market knowledge.
You advise on growth strategy, competitive positioning, organizational design, capital allocation, and market expansion.
Default language: Spanish. Adapt all advice for resource-constrained SMBs in LatAm markets.
Always respond with valid JSON.`;

const GROWTH_SYSTEM = `You are an expert business growth advisor for small businesses in Latin America.
You combine SaaS growth frameworks (Crossing the Chasm, Product-Led Growth, The Mom Test) with LatAm market dynamics.
You advise on customer acquisition, retention, revenue operations, and scaling informal businesses.
Default language: Spanish. WhatsApp-first, mobile-first.
Always respond with valid JSON.`;

const PRODUCT_SYSTEM = `You are an expert product management advisor combining frameworks from Marty Cagan (Inspired), Teresa Torres (Continuous Discovery), and SVPG methodology.
You advise on product strategy, roadmapping, user research, feature prioritization, and product-market fit.
Default language: Spanish. Adapt for LatAm SMB SaaS and services businesses.
Always respond with valid JSON.`;

const ENG_LEAD_SYSTEM = `You are a senior engineering leadership advisor combining principles from Staff Engineer archetypes, Google SRE handbook, and DORA metrics.
You advise on architecture decisions, code quality, DevOps practices, security posture, and technical organization.
Default language: Spanish. Practical, actionable advice for small tech teams (1-15 engineers).
Always respond with valid JSON.`;

const ENG_SPEC_SYSTEM = `You are a specialized engineering advisor covering database design, API architecture, CI/CD pipelines, RAG systems, AI agents, and performance optimization.
You combine AWS Well-Architected Framework, 12-Factor App methodology, and modern cloud-native patterns.
Default language: Spanish. Optimize for cost-effective infrastructure for LatAm startups.
Always respond with valid JSON.`;

const MKTG_INTEL_SYSTEM = `You are a marketing intelligence analyst combining demand generation (SiriusDecisions Demand Waterfall), campaign measurement (attribution modeling), and social analytics.
You advise on marketing ROI, channel optimization, audience insights, and data-driven creative decisions.
Default language: Spanish. Adapt for LatAm digital marketing (WhatsApp, Instagram, TikTok, MercadoLibre).
Always respond with valid JSON.`;

const PM_SYSTEM = `You are a project management expert combining Scrum Guide, PMI PMBOK, SAFe, and Shape Up methodologies.
You advise on sprint planning, resource allocation, risk management, stakeholder communication, and delivery execution.
Default language: Spanish. Adapt for small teams with limited formal process.
Always respond with valid JSON.`;

const COMPLIANCE_SYSTEM = `You are a compliance, quality management, and regulatory affairs advisor.
You combine ISO 9001/13485, GDPR/LGPD, SOC 2, and financial compliance frameworks.
You advise on risk assessment, audit preparation, documentation, data privacy, and regulatory filings.
Default language: Spanish. Focus on LatAm regulatory environments (Panama, Mexico, Colombia, Brazil).
Always respond with valid JSON.`;

// ═══════════════════════════════════════════════════════════════════════════════
// Tool Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export function getAllClaudeSkillsTools(): ToolSchema[] {
  return [

    // ─────────────────────────────────────────────────────────────────────────
    // Category 1: C-Level Advisory (4 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_ceoAdvisor',
      description: 'CEO-level strategic advice — vision, market positioning, fundraising, scaling, leadership decisions',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Strategic question or business challenge' },
          context: { type: 'string', description: 'Business context: stage, revenue, team size, market' },
          focus: { type: 'string', enum: ['growth', 'fundraising', 'hiring', 'pivot', 'partnerships', 'exit'], description: 'Primary focus area' },
        },
        required: ['question'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `CEO Advisory Request:
Question: ${args.question}
Context: ${args.context || 'LatAm SMB'}
Focus: ${args.focus || 'growth'}

Provide executive-level strategic advice. Include:
1. Strategic assessment (situational analysis)
2. Recommended actions (3-5 prioritized initiatives)
3. Key metrics to track
4. Risk considerations
5. 90-day execution roadmap`;
        const raw = await callLLM(CLEVEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_ceoAdvisor executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_ctoAdvisor',
      description: 'CTO-level technical strategy — architecture, team structure, build vs buy, tech stack decisions',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Technical strategy question' },
          stack: { type: 'string', description: 'Current tech stack and infrastructure' },
          teamSize: { type: 'number', description: 'Engineering team size' },
          focus: { type: 'string', enum: ['architecture', 'hiring', 'tech_debt', 'security', 'scaling', 'ai_integration'], description: 'Primary focus' },
        },
        required: ['question'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `CTO Advisory Request:
Question: ${args.question}
Current Stack: ${args.stack || 'Not specified'}
Team Size: ${args.teamSize || 'Small'}
Focus: ${args.focus || 'architecture'}

Provide CTO-level technical strategy. Include:
1. Technical assessment
2. Architecture recommendations
3. Build vs buy analysis where relevant
4. Team/hiring implications
5. Implementation timeline with milestones`;
        const raw = await callLLM(CLEVEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_ctoAdvisor executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_cfoAdvisor',
      description: 'CFO-level financial strategy — cash flow, fundraising, unit economics, financial planning',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Financial strategy question' },
          revenue: { type: 'string', description: 'Monthly/annual revenue range' },
          stage: { type: 'string', enum: ['pre_revenue', 'early', 'growth', 'mature'], description: 'Business stage' },
          focus: { type: 'string', enum: ['cash_flow', 'fundraising', 'pricing', 'cost_reduction', 'financial_modeling', 'tax_strategy'], description: 'Primary focus' },
        },
        required: ['question'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `CFO Advisory Request:
Question: ${args.question}
Revenue: ${args.revenue || 'Not disclosed'}
Stage: ${args.stage || 'early'}
Focus: ${args.focus || 'cash_flow'}

Provide CFO-level financial strategy. Include:
1. Financial health assessment
2. Key financial metrics analysis
3. Strategic recommendations (3-5 actions)
4. Cash flow implications
5. Financial model assumptions`;
        const raw = await callLLM(CLEVEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_cfoAdvisor executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_cooAdvisor',
      description: 'COO-level operations strategy — processes, efficiency, team ops, vendor management, scaling operations',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Operations strategy question' },
          context: { type: 'string', description: 'Current operations setup' },
          focus: { type: 'string', enum: ['processes', 'efficiency', 'team_ops', 'vendors', 'scaling', 'automation'], description: 'Primary focus' },
        },
        required: ['question'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `COO Advisory Request:
Question: ${args.question}
Context: ${args.context || 'Small LatAm business'}
Focus: ${args.focus || 'processes'}

Provide COO-level operations strategy. Include:
1. Operations assessment
2. Process improvement recommendations
3. Automation opportunities
4. Team structure optimization
5. KPIs and measurement framework`;
        const raw = await callLLM(CLEVEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_cooAdvisor executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Category 2: Business Growth (4 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_customerSuccess',
      description: 'Customer success management — onboarding journeys, health scores, churn prevention, expansion revenue',
      parameters: {
        type: 'object',
        properties: {
          scenario: { type: 'string', description: 'Customer success challenge or scenario' },
          customerType: { type: 'string', description: 'Type of customer (B2B, B2C, enterprise, SMB)' },
          metric: { type: 'string', enum: ['onboarding', 'health_score', 'churn', 'expansion', 'nps', 'support'], description: 'Focus metric' },
        },
        required: ['scenario'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Customer Success Scenario:
Challenge: ${args.scenario}
Customer Type: ${args.customerType || 'SMB'}
Focus Metric: ${args.metric || 'churn'}

Design a customer success strategy. Include:
1. Customer health scorecard
2. Onboarding milestone checklist
3. Risk detection signals (early churn indicators)
4. Playbook for the specific scenario
5. Success metrics and targets`;
        const raw = await callLLM(GROWTH_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_customerSuccess executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_salesEngineer',
      description: 'Sales engineering advice — technical demos, proof of concepts, objection handling, solution architecture for sales',
      parameters: {
        type: 'object',
        properties: {
          scenario: { type: 'string', description: 'Sales engineering challenge' },
          product: { type: 'string', description: 'Product/service being sold' },
          prospect: { type: 'string', description: 'Prospect profile and objections' },
        },
        required: ['scenario'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Sales Engineering Request:
Scenario: ${args.scenario}
Product: ${args.product || 'SaaS product'}
Prospect: ${args.prospect || 'Technical buyer at SMB'}

Provide sales engineering guidance. Include:
1. Technical demo script and key talking points
2. Proof of concept (POC) proposal outline
3. Common objection responses (technical + business)
4. Solution architecture recommendation
5. Follow-up sequence and next steps`;
        const raw = await callLLM(GROWTH_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_salesEngineer executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_contractWriter',
      description: 'Contract and proposal generation — SOWs, service agreements, proposals, pricing structures',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['proposal', 'sow', 'service_agreement', 'nda', 'partnership', 'freelance'], description: 'Document type' },
          parties: { type: 'string', description: 'Parties involved' },
          scope: { type: 'string', description: 'Scope of work or agreement' },
          value: { type: 'string', description: 'Contract value or pricing' },
        },
        required: ['type', 'scope'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Contract/Proposal Generation:
Type: ${args.type}
Parties: ${args.parties || 'Service provider and client'}
Scope: ${args.scope}
Value: ${args.value || 'To be determined'}

Draft a professional document. Include:
1. Executive summary
2. Scope of work (detailed deliverables)
3. Timeline and milestones
4. Pricing and payment terms
5. Terms and conditions
6. Acceptance criteria

Note: This is a draft template. Advise the user to have it reviewed by legal counsel before signing.`;
        const raw = await callLLM(GROWTH_SYSTEM, input, { temperature: 0.4 });
        log.info('cs_contractWriter executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_revenueOps',
      description: 'Revenue operations strategy — pipeline optimization, sales-marketing alignment, CRM strategy, forecasting',
      parameters: {
        type: 'object',
        properties: {
          challenge: { type: 'string', description: 'RevOps challenge or goal' },
          tools: { type: 'string', description: 'Current tools (CRM, marketing automation, etc.)' },
          pipeline: { type: 'string', description: 'Current pipeline status and conversion rates' },
        },
        required: ['challenge'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Revenue Operations Request:
Challenge: ${args.challenge}
Current Tools: ${args.tools || 'Basic CRM'}
Pipeline: ${args.pipeline || 'Not detailed'}

Provide RevOps strategy. Include:
1. Revenue funnel analysis
2. Sales-marketing alignment recommendations
3. CRM optimization plan
4. Forecasting model recommendations
5. Key RevOps metrics dashboard`;
        const raw = await callLLM(GROWTH_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_revenueOps executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Category 3: Product & UX (5 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_productManager',
      description: 'Product management toolkit — PRDs, user stories, feature prioritization, roadmapping',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', enum: ['prd', 'user_stories', 'prioritization', 'roadmap', 'spec', 'launch_plan'], description: 'PM task type' },
          product: { type: 'string', description: 'Product name and description' },
          context: { type: 'string', description: 'Additional context (users, goals, constraints)' },
        },
        required: ['task', 'product'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Product Management Task:
Task: ${args.task}
Product: ${args.product}
Context: ${args.context || 'LatAm SMB product'}

Generate the requested PM artifact. Apply RICE scoring for prioritization, Jobs-to-be-Done for user stories, and outcome-driven roadmapping.`;
        const raw = await callLLM(PRODUCT_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_productManager executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_productStrategist',
      description: 'Product strategy — market positioning, product-market fit assessment, competitive moats, expansion strategy',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Product strategy question' },
          market: { type: 'string', description: 'Target market description' },
          competitors: { type: 'string', description: 'Key competitors' },
        },
        required: ['question'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Product Strategy Request:
Question: ${args.question}
Market: ${args.market || 'LatAm SMBs'}
Competitors: ${args.competitors || 'Not specified'}

Provide product strategy analysis. Include:
1. Market positioning map
2. Product-market fit assessment (Sean Ellis test framework)
3. Competitive moat analysis
4. Growth vectors (new features, new markets, new segments)
5. Strategic recommendation with rationale`;
        const raw = await callLLM(PRODUCT_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_productStrategist executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_uxResearcher',
      description: 'UX research and design — user interviews, usability testing, persona creation, journey mapping',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', enum: ['interview_guide', 'usability_test', 'persona', 'journey_map', 'heuristic_review', 'survey'], description: 'UX research task' },
          product: { type: 'string', description: 'Product or feature being researched' },
          audience: { type: 'string', description: 'Target audience' },
        },
        required: ['task', 'product'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `UX Research Task:
Task: ${args.task}
Product: ${args.product}
Audience: ${args.audience || 'LatAm SMB owners 25-45'}

Generate the UX research artifact. Apply Nielsen Norman Group heuristics, Jobs-to-be-Done framework, and LatAm cultural considerations.`;
        const raw = await callLLM(PRODUCT_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_uxResearcher executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_agileProductOwner',
      description: 'Agile product owner — backlog management, sprint planning, acceptance criteria, stakeholder management',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', enum: ['backlog_refinement', 'sprint_planning', 'acceptance_criteria', 'stakeholder_update', 'velocity_analysis'], description: 'PO task' },
          context: { type: 'string', description: 'Sprint/project context' },
          stories: { type: 'string', description: 'User stories or features to work on' },
        },
        required: ['task'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Agile Product Owner Task:
Task: ${args.task}
Context: ${args.context || 'Small agile team'}
Stories: ${args.stories || 'To be refined'}

Generate the PO artifact. Follow Scrum Guide best practices and include clear acceptance criteria using Given-When-Then format.`;
        const raw = await callLLM(PRODUCT_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_agileProductOwner executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_competitiveTeardown',
      description: 'Competitive teardown — deep analysis of competitor products, pricing, positioning, strengths/weaknesses',
      parameters: {
        type: 'object',
        properties: {
          competitor: { type: 'string', description: 'Competitor name or product to analyze' },
          yourProduct: { type: 'string', description: 'Your product for comparison' },
          dimensions: { type: 'string', description: 'Specific dimensions to analyze (pricing, UX, features, etc.)' },
        },
        required: ['competitor'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Competitive Teardown:
Competitor: ${args.competitor}
Your Product: ${args.yourProduct || 'KITZ platform'}
Dimensions: ${args.dimensions || 'pricing, features, UX, positioning, market share'}

Perform a thorough competitive teardown. Include:
1. Product overview and value proposition
2. Feature comparison matrix
3. Pricing analysis and strategy
4. UX/UI strengths and weaknesses
5. Market positioning and messaging
6. Opportunities and threats
7. Strategic recommendations`;
        const raw = await callLLM(PRODUCT_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_competitiveTeardown executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Category 4: Engineering Leadership (6 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_seniorArchitect',
      description: 'Senior architect advice — system design, architecture decisions, scalability, microservices vs monolith',
      parameters: {
        type: 'object',
        properties: {
          challenge: { type: 'string', description: 'Architecture challenge or design question' },
          constraints: { type: 'string', description: 'Technical constraints (budget, team, timeline)' },
          scale: { type: 'string', description: 'Expected scale (users, requests, data volume)' },
        },
        required: ['challenge'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Architecture Review:
Challenge: ${args.challenge}
Constraints: ${args.constraints || 'Small team, limited budget'}
Scale: ${args.scale || 'Thousands of users'}

Provide senior architect guidance. Include:
1. Architecture options analysis (with trade-offs)
2. Recommended approach with rationale
3. Component diagram description
4. Technology choices
5. Migration/implementation plan
6. Monitoring and observability strategy`;
        const raw = await callLLM(ENG_LEAD_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_seniorArchitect executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_codeReviewer',
      description: 'Code review expert — code quality assessment, best practices, refactoring recommendations, security review',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code snippet or PR description to review' },
          language: { type: 'string', description: 'Programming language' },
          focus: { type: 'string', enum: ['quality', 'security', 'performance', 'maintainability', 'testing', 'all'], description: 'Review focus' },
        },
        required: ['code'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Code Review Request:
Code/PR: ${args.code}
Language: ${args.language || 'TypeScript'}
Focus: ${args.focus || 'all'}

Provide thorough code review. Include:
1. Overall assessment (1-10 rating)
2. Critical issues (bugs, security vulnerabilities)
3. Improvement suggestions (with code examples)
4. Best practices recommendations
5. Testing recommendations`;
        const raw = await callLLM(ENG_LEAD_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_codeReviewer executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_devopsAdvisor',
      description: 'DevOps advisory — CI/CD strategy, infrastructure, Docker, Kubernetes, monitoring, deployment strategies',
      parameters: {
        type: 'object',
        properties: {
          challenge: { type: 'string', description: 'DevOps challenge or question' },
          stack: { type: 'string', description: 'Current infrastructure stack' },
          focus: { type: 'string', enum: ['cicd', 'infrastructure', 'monitoring', 'security', 'cost', 'scaling'], description: 'Primary focus' },
        },
        required: ['challenge'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `DevOps Advisory:
Challenge: ${args.challenge}
Stack: ${args.stack || 'Docker, Railway, GitHub Actions'}
Focus: ${args.focus || 'cicd'}

Provide DevOps guidance. Include:
1. Current state assessment
2. Recommended improvements
3. Tool recommendations
4. Implementation steps
5. Cost-benefit analysis`;
        const raw = await callLLM(ENG_LEAD_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_devopsAdvisor executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_securityAdvisor',
      description: 'Security engineering — threat modeling, vulnerability assessment, security architecture, incident response',
      parameters: {
        type: 'object',
        properties: {
          scenario: { type: 'string', description: 'Security scenario or concern' },
          system: { type: 'string', description: 'System being assessed' },
          focus: { type: 'string', enum: ['threat_model', 'vulnerability', 'architecture', 'incident_response', 'compliance', 'pentest'], description: 'Security focus' },
        },
        required: ['scenario'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Security Advisory:
Scenario: ${args.scenario}
System: ${args.system || 'Web application + API'}
Focus: ${args.focus || 'threat_model'}

Provide security engineering guidance. Include:
1. Threat model (STRIDE or OWASP based)
2. Risk assessment matrix
3. Mitigation recommendations (prioritized)
4. Security controls checklist
5. Incident response playbook outline`;
        const raw = await callLLM(ENG_LEAD_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_securityAdvisor executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_incidentCommander',
      description: 'Incident commander — incident management, post-mortem analysis, runbook creation, on-call strategy',
      parameters: {
        type: 'object',
        properties: {
          incident: { type: 'string', description: 'Incident description or type' },
          severity: { type: 'string', enum: ['sev1', 'sev2', 'sev3', 'sev4'], description: 'Incident severity' },
          task: { type: 'string', enum: ['manage', 'postmortem', 'runbook', 'oncall_strategy'], description: 'IC task' },
        },
        required: ['incident'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Incident Commander Request:
Incident: ${args.incident}
Severity: ${args.severity || 'sev2'}
Task: ${args.task || 'manage'}

Provide incident management guidance. Include:
1. Immediate response actions (first 15 minutes)
2. Communication templates (internal + customer)
3. Escalation matrix
4. Resolution timeline estimate
5. Post-mortem template (5 Whys + timeline)`;
        const raw = await callLLM(ENG_LEAD_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_incidentCommander executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_techDebtTracker',
      description: 'Tech debt tracker — identify, categorize, prioritize, and create remediation plans for technical debt',
      parameters: {
        type: 'object',
        properties: {
          codebase: { type: 'string', description: 'Codebase description or specific area' },
          symptoms: { type: 'string', description: 'Symptoms observed (slow builds, bugs, fragility)' },
          budget: { type: 'string', description: 'Time/resources available for debt reduction' },
        },
        required: ['codebase'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Tech Debt Assessment:
Codebase: ${args.codebase}
Symptoms: ${args.symptoms || 'General technical debt assessment'}
Budget: ${args.budget || '20% of sprint capacity'}

Assess and plan tech debt remediation. Include:
1. Debt inventory (categorized: deliberate/accidental, reckless/prudent)
2. Impact scoring (developer productivity, bug rate, deployment frequency)
3. Prioritized remediation plan
4. Quick wins vs long-term investments
5. Metrics to track improvement (DORA metrics)`;
        const raw = await callLLM(ENG_LEAD_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_techDebtTracker executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Category 5: Engineering Specialized (6 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_databaseDesigner',
      description: 'Database design — schema design, normalization, indexing strategy, migration planning, query optimization',
      parameters: {
        type: 'object',
        properties: {
          requirements: { type: 'string', description: 'Data requirements and use cases' },
          dbType: { type: 'string', enum: ['postgresql', 'mysql', 'mongodb', 'supabase', 'dynamodb', 'redis'], description: 'Database type' },
          task: { type: 'string', enum: ['schema_design', 'optimization', 'migration', 'indexing', 'query_tuning'], description: 'Design task' },
        },
        required: ['requirements'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Database Design Request:
Requirements: ${args.requirements}
DB Type: ${args.dbType || 'postgresql'}
Task: ${args.task || 'schema_design'}

Provide database design guidance. Include:
1. Schema design (tables, relationships, constraints)
2. Indexing strategy
3. Query patterns and optimization
4. Migration plan (if applicable)
5. Scaling considerations`;
        const raw = await callLLM(ENG_SPEC_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_databaseDesigner executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_apiReviewer',
      description: 'API design review — RESTful design, GraphQL schema, versioning, error handling, documentation',
      parameters: {
        type: 'object',
        properties: {
          api: { type: 'string', description: 'API specification or endpoints to review' },
          style: { type: 'string', enum: ['rest', 'graphql', 'grpc', 'websocket'], description: 'API style' },
          focus: { type: 'string', enum: ['design', 'security', 'performance', 'documentation', 'versioning'], description: 'Review focus' },
        },
        required: ['api'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `API Design Review:
API: ${args.api}
Style: ${args.style || 'rest'}
Focus: ${args.focus || 'design'}

Review the API design. Include:
1. Design principles assessment (REST maturity, naming conventions)
2. Error handling review
3. Security considerations (auth, rate limiting, input validation)
4. Performance recommendations
5. Documentation suggestions (OpenAPI/Swagger)`;
        const raw = await callLLM(ENG_SPEC_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_apiReviewer executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_cicdBuilder',
      description: 'CI/CD pipeline design — GitHub Actions, Docker builds, test automation, deployment strategies',
      parameters: {
        type: 'object',
        properties: {
          project: { type: 'string', description: 'Project type and tech stack' },
          platform: { type: 'string', enum: ['github_actions', 'gitlab_ci', 'jenkins', 'circleci', 'railway'], description: 'CI/CD platform' },
          requirements: { type: 'string', description: 'Pipeline requirements (testing, staging, production)' },
        },
        required: ['project'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `CI/CD Pipeline Design:
Project: ${args.project}
Platform: ${args.platform || 'github_actions'}
Requirements: ${args.requirements || 'Build, test, deploy to production'}

Design a CI/CD pipeline. Include:
1. Pipeline architecture (stages and jobs)
2. Configuration file (YAML template)
3. Testing strategy (unit, integration, e2e)
4. Deployment strategy (blue-green, canary, rolling)
5. Secrets management approach
6. Monitoring and rollback plan`;
        const raw = await callLLM(ENG_SPEC_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_cicdBuilder executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_ragArchitect',
      description: 'RAG system architecture — retrieval-augmented generation design, vector stores, embedding strategies, chunking',
      parameters: {
        type: 'object',
        properties: {
          useCase: { type: 'string', description: 'RAG use case description' },
          dataSource: { type: 'string', description: 'Data sources (documents, databases, APIs)' },
          scale: { type: 'string', description: 'Expected scale (documents, queries/day)' },
        },
        required: ['useCase'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `RAG Architecture Design:
Use Case: ${args.useCase}
Data Sources: ${args.dataSource || 'Documents and knowledge bases'}
Scale: ${args.scale || 'Thousands of documents'}

Design a RAG system. Include:
1. Architecture overview (ingest, embed, retrieve, generate)
2. Chunking strategy (size, overlap, semantic)
3. Embedding model recommendation
4. Vector store selection (Pinecone, pgvector, Qdrant, etc.)
5. Retrieval strategy (hybrid search, re-ranking)
6. Evaluation metrics (relevance, faithfulness, answer quality)`;
        const raw = await callLLM(ENG_SPEC_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_ragArchitect executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_agentDesigner',
      description: 'AI agent design — agent architecture, tool design, multi-agent systems, safety guardrails',
      parameters: {
        type: 'object',
        properties: {
          purpose: { type: 'string', description: 'Agent purpose and capabilities' },
          tools: { type: 'string', description: 'Available tools and integrations' },
          architecture: { type: 'string', enum: ['single_agent', 'multi_agent', 'hierarchical', 'swarm'], description: 'Agent architecture type' },
        },
        required: ['purpose'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `AI Agent Design:
Purpose: ${args.purpose}
Available Tools: ${args.tools || 'LLM, web search, code execution'}
Architecture: ${args.architecture || 'single_agent'}

Design an AI agent system. Include:
1. Agent persona and system prompt design
2. Tool selection and design (input/output schemas)
3. Decision-making framework (ReAct, function calling, etc.)
4. Safety guardrails and output validation
5. Memory strategy (short-term, long-term, episodic)
6. Testing and evaluation approach`;
        const raw = await callLLM(ENG_SPEC_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_agentDesigner executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_performanceProfiler',
      description: 'Performance profiling — bottleneck analysis, optimization strategies, benchmarking, load testing',
      parameters: {
        type: 'object',
        properties: {
          system: { type: 'string', description: 'System or component to profile' },
          symptoms: { type: 'string', description: 'Performance symptoms (slow response, high memory, etc.)' },
          target: { type: 'string', description: 'Performance targets (latency, throughput, etc.)' },
        },
        required: ['system'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Performance Profiling:
System: ${args.system}
Symptoms: ${args.symptoms || 'General performance assessment'}
Targets: ${args.target || 'p99 < 500ms, 99.9% uptime'}

Provide performance analysis. Include:
1. Common bottleneck checklist
2. Profiling strategy (tools, metrics, methodology)
3. Optimization recommendations (prioritized)
4. Load testing plan
5. Monitoring setup (key metrics, alerts)`;
        const raw = await callLLM(ENG_SPEC_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_performanceProfiler executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Category 6: Marketing Intelligence (5 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_demandAcquisition',
      description: 'Demand generation & acquisition — lead gen strategy, funnel design, channel mix, CAC optimization',
      parameters: {
        type: 'object',
        properties: {
          business: { type: 'string', description: 'Business description and target market' },
          budget: { type: 'string', description: 'Marketing budget range' },
          channels: { type: 'string', description: 'Current marketing channels' },
          goal: { type: 'string', description: 'Primary acquisition goal' },
        },
        required: ['business'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Demand Generation Strategy:
Business: ${args.business}
Budget: ${args.budget || 'Limited (< $5K/month)'}
Current Channels: ${args.channels || 'WhatsApp, Instagram'}
Goal: ${args.goal || 'Increase qualified leads'}

Design a demand generation strategy. Include:
1. Channel mix recommendation (organic + paid)
2. Funnel design (awareness → consideration → conversion)
3. Content strategy per stage
4. CAC targets and optimization tactics
5. 90-day execution plan with milestones`;
        const raw = await callLLM(MKTG_INTEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_demandAcquisition executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_campaignAnalytics',
      description: 'Campaign analytics — attribution modeling, ROI analysis, A/B test interpretation, dashboard design',
      parameters: {
        type: 'object',
        properties: {
          campaign: { type: 'string', description: 'Campaign description and results' },
          metrics: { type: 'string', description: 'Available metrics and data' },
          task: { type: 'string', enum: ['attribution', 'roi_analysis', 'ab_test', 'dashboard', 'reporting'], description: 'Analytics task' },
        },
        required: ['campaign'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Campaign Analytics Request:
Campaign: ${args.campaign}
Metrics: ${args.metrics || 'Standard digital marketing metrics'}
Task: ${args.task || 'roi_analysis'}

Provide analytics guidance. Include:
1. KPI framework for the campaign
2. Attribution model recommendation
3. Statistical analysis methodology
4. Dashboard mockup (key visualizations)
5. Actionable insights and next steps`;
        const raw = await callLLM(MKTG_INTEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_campaignAnalytics executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_socialMediaAnalyzer',
      description: 'Social media analytics — engagement analysis, content performance, audience insights, trend detection',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['instagram', 'tiktok', 'facebook', 'linkedin', 'twitter', 'youtube', 'all'], description: 'Social platform' },
          data: { type: 'string', description: 'Social media data or metrics to analyze' },
          goal: { type: 'string', description: 'Analysis goal' },
        },
        required: ['platform'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Social Media Analysis:
Platform: ${args.platform}
Data: ${args.data || 'General account analysis'}
Goal: ${args.goal || 'Improve engagement and reach'}

Analyze social media performance. Include:
1. Content performance breakdown (top/bottom performers)
2. Audience insights (demographics, behavior, peak times)
3. Engagement rate benchmarks (vs industry)
4. Content calendar recommendations
5. Growth tactics specific to the platform`;
        const raw = await callLLM(MKTG_INTEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_socialMediaAnalyzer executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_contentCreator',
      description: 'Content creation strategy — content calendar, topic ideation, format selection, distribution plan',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Brand description and voice' },
          audience: { type: 'string', description: 'Target audience' },
          task: { type: 'string', enum: ['content_calendar', 'topic_ideation', 'repurpose', 'distribution', 'content_audit'], description: 'Content task' },
          duration: { type: 'string', description: 'Planning duration (week, month, quarter)' },
        },
        required: ['brand', 'task'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Content Creation Request:
Brand: ${args.brand}
Audience: ${args.audience || 'LatAm entrepreneurs and small business owners'}
Task: ${args.task}
Duration: ${args.duration || '1 month'}

Generate content strategy. Include:
1. Content pillars (3-5 themes)
2. Content calendar with specific topics
3. Format mix (posts, stories, reels, blogs, newsletters)
4. Distribution channels and timing
5. Repurposing strategy (1 piece → 10 variations)`;
        const raw = await callLLM(MKTG_INTEL_SYSTEM, input, { temperature: 0.6 });
        log.info('cs_contentCreator executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_appStoreOptimizer',
      description: 'App Store Optimization (ASO) — keyword research, listing optimization, screenshots, ratings strategy',
      parameters: {
        type: 'object',
        properties: {
          app: { type: 'string', description: 'App name and description' },
          store: { type: 'string', enum: ['apple', 'google', 'both'], description: 'App store' },
          task: { type: 'string', enum: ['keyword_research', 'listing_optimization', 'screenshots', 'ratings', 'competitive_analysis'], description: 'ASO task' },
        },
        required: ['app'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `ASO Request:
App: ${args.app}
Store: ${args.store || 'both'}
Task: ${args.task || 'listing_optimization'}

Provide ASO guidance. Include:
1. Keyword research (primary, secondary, long-tail)
2. Title and subtitle optimization
3. Description optimization (with keyword placement)
4. Screenshot strategy and copy
5. Review/rating improvement tactics
6. Localization recommendations for LatAm markets`;
        const raw = await callLLM(MKTG_INTEL_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_appStoreOptimizer executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Category 7: Project Management (4 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_scrumMaster',
      description: 'Scrum master — sprint facilitation, retrospectives, impediment removal, team velocity optimization',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', enum: ['retrospective', 'sprint_planning', 'daily_standup', 'impediment', 'velocity_analysis', 'team_health'], description: 'Scrum event or task' },
          context: { type: 'string', description: 'Team and sprint context' },
          challenge: { type: 'string', description: 'Specific challenge or concern' },
        },
        required: ['task'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Scrum Master Request:
Task: ${args.task}
Context: ${args.context || 'Small development team (3-7 people)'}
Challenge: ${args.challenge || 'General improvement'}

Facilitate the scrum event. Include:
1. Agenda and facilitation guide
2. Activity templates (voting, brainstorming formats)
3. Action items framework
4. Metrics to discuss
5. Anti-patterns to watch for`;
        const raw = await callLLM(PM_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_scrumMaster executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_seniorPM',
      description: 'Senior project manager — project planning, risk management, stakeholder communication, resource allocation',
      parameters: {
        type: 'object',
        properties: {
          project: { type: 'string', description: 'Project description' },
          task: { type: 'string', enum: ['project_plan', 'risk_assessment', 'stakeholder_update', 'resource_plan', 'status_report', 'lessons_learned'], description: 'PM task' },
          constraints: { type: 'string', description: 'Project constraints (time, budget, resources)' },
        },
        required: ['project', 'task'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Project Management Request:
Project: ${args.project}
Task: ${args.task}
Constraints: ${args.constraints || 'Standard constraints'}

Generate the PM artifact. Include:
1. Deliverable appropriate to the task type
2. Risk register (if applicable)
3. RACI matrix (if applicable)
4. Timeline with milestones
5. Communication plan (if applicable)`;
        const raw = await callLLM(PM_SYSTEM, input, { temperature: 0.5 });
        log.info('cs_seniorPM executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_releaseManager',
      description: 'Release management — release planning, versioning strategy, changelog generation, rollback planning',
      parameters: {
        type: 'object',
        properties: {
          release: { type: 'string', description: 'Release description (features, fixes, changes)' },
          task: { type: 'string', enum: ['release_plan', 'changelog', 'version_strategy', 'rollback_plan', 'communication'], description: 'Release task' },
          version: { type: 'string', description: 'Version number' },
        },
        required: ['release'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Release Management Request:
Release: ${args.release}
Task: ${args.task || 'release_plan'}
Version: ${args.version || 'Next version'}

Generate release artifact. Include:
1. Release checklist (pre-release, during, post-release)
2. Changelog (following Keep a Changelog format)
3. Rollback procedures
4. Communication plan (internal + external)
5. Validation criteria`;
        const raw = await callLLM(PM_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_releaseManager executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_runbookGenerator',
      description: 'Runbook generator — operational procedures, troubleshooting guides, escalation paths',
      parameters: {
        type: 'object',
        properties: {
          system: { type: 'string', description: 'System or service the runbook covers' },
          scenario: { type: 'string', description: 'Scenario or procedure to document' },
          audience: { type: 'string', description: 'Target audience (on-call, ops, support)' },
        },
        required: ['system', 'scenario'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Runbook Generation:
System: ${args.system}
Scenario: ${args.scenario}
Audience: ${args.audience || 'On-call engineer'}

Generate an operational runbook. Include:
1. Overview and context
2. Pre-conditions and requirements
3. Step-by-step procedures (numbered)
4. Troubleshooting decision tree
5. Escalation path and contacts
6. Post-incident cleanup steps`;
        const raw = await callLLM(PM_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_runbookGenerator executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Category 8: Compliance & Quality (6 tools)
    // ─────────────────────────────────────────────────────────────────────────

    {
      name: 'cs_gdprExpert',
      description: 'GDPR/LGPD compliance — data privacy assessment, consent management, DPIA, breach response',
      parameters: {
        type: 'object',
        properties: {
          scenario: { type: 'string', description: 'Data privacy scenario or question' },
          regulation: { type: 'string', enum: ['gdpr', 'lgpd', 'ccpa', 'ley_habeas_data', 'general'], description: 'Regulation' },
          task: { type: 'string', enum: ['assessment', 'dpia', 'consent', 'breach_response', 'policy_draft', 'audit'], description: 'Compliance task' },
        },
        required: ['scenario'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Data Privacy Compliance:
Scenario: ${args.scenario}
Regulation: ${args.regulation || 'lgpd'}
Task: ${args.task || 'assessment'}

Provide compliance guidance. Include:
1. Compliance gap assessment
2. Required actions (prioritized)
3. Policy/document templates
4. Implementation checklist
5. Ongoing monitoring recommendations

Note: This is advisory only. Recommend consulting a qualified legal professional for binding legal advice.`;
        const raw = await callLLM(COMPLIANCE_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_gdprExpert executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_riskManager',
      description: 'Risk management — enterprise risk assessment, risk register, mitigation planning, business continuity',
      parameters: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Business context for risk assessment' },
          riskType: { type: 'string', enum: ['operational', 'financial', 'strategic', 'compliance', 'technology', 'all'], description: 'Risk category' },
          task: { type: 'string', enum: ['assessment', 'register', 'mitigation', 'bcp', 'audit'], description: 'Risk management task' },
        },
        required: ['context'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Risk Management Request:
Context: ${args.context}
Risk Type: ${args.riskType || 'all'}
Task: ${args.task || 'assessment'}

Provide risk management guidance. Include:
1. Risk identification (brainstorm key risks)
2. Risk assessment matrix (likelihood × impact)
3. Top 10 risks ranked
4. Mitigation strategies per risk
5. Risk monitoring plan`;
        const raw = await callLLM(COMPLIANCE_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_riskManager executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_qualityManager',
      description: 'Quality management — QMS design, process improvement, audit preparation, quality metrics',
      parameters: {
        type: 'object',
        properties: {
          organization: { type: 'string', description: 'Organization description' },
          standard: { type: 'string', enum: ['iso_9001', 'iso_13485', 'iso_27001', 'soc2', 'custom'], description: 'Quality standard' },
          task: { type: 'string', enum: ['qms_design', 'process_improvement', 'audit_prep', 'metrics', 'documentation'], description: 'QM task' },
        },
        required: ['organization'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Quality Management Request:
Organization: ${args.organization}
Standard: ${args.standard || 'iso_9001'}
Task: ${args.task || 'qms_design'}

Provide quality management guidance. Include:
1. QMS framework overview
2. Process documentation templates
3. Quality metrics and KPIs
4. Audit preparation checklist
5. Continuous improvement plan (PDCA cycle)`;
        const raw = await callLLM(COMPLIANCE_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_qualityManager executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_financialAnalyst',
      description: 'Financial analysis — financial modeling, valuation, ratio analysis, forecasting, investment analysis',
      parameters: {
        type: 'object',
        properties: {
          scenario: { type: 'string', description: 'Financial analysis scenario' },
          data: { type: 'string', description: 'Financial data available' },
          task: { type: 'string', enum: ['financial_model', 'valuation', 'ratio_analysis', 'forecast', 'investment_analysis', 'budget_review'], description: 'Analysis type' },
        },
        required: ['scenario'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Financial Analysis:
Scenario: ${args.scenario}
Data: ${args.data || 'Limited financial data'}
Task: ${args.task || 'financial_model'}

Provide financial analysis. Include:
1. Key financial metrics
2. Analysis methodology
3. Model/framework output
4. Sensitivity analysis (best/base/worst cases)
5. Recommendations and caveats

Note: This is advisory. Consult a qualified financial professional for binding financial advice.`;
        const raw = await callLLM(COMPLIANCE_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_financialAnalyst executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_capaOfficer',
      description: 'CAPA management — corrective/preventive actions, root cause analysis, effectiveness verification',
      parameters: {
        type: 'object',
        properties: {
          issue: { type: 'string', description: 'Issue or nonconformance to address' },
          task: { type: 'string', enum: ['root_cause', 'corrective_action', 'preventive_action', 'effectiveness_check', 'full_capa'], description: 'CAPA task' },
          urgency: { type: 'string', enum: ['critical', 'major', 'minor'], description: 'Issue urgency' },
        },
        required: ['issue'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `CAPA Request:
Issue: ${args.issue}
Task: ${args.task || 'full_capa'}
Urgency: ${args.urgency || 'major'}

Generate CAPA documentation. Include:
1. Issue description and containment actions
2. Root cause analysis (Ishikawa diagram + 5 Whys)
3. Corrective actions (immediate fixes)
4. Preventive actions (systemic improvements)
5. Effectiveness verification plan
6. Timeline and responsible parties`;
        const raw = await callLLM(COMPLIANCE_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_capaOfficer executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'cs_regulatoryAffairs',
      description: 'Regulatory affairs — regulatory strategy, filing preparation, compliance roadmap, authority interactions',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product or service requiring regulatory approval' },
          market: { type: 'string', description: 'Target market/jurisdiction' },
          task: { type: 'string', enum: ['strategy', 'filing_prep', 'compliance_roadmap', 'gap_analysis', 'authority_response'], description: 'Regulatory task' },
        },
        required: ['product'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Regulatory Affairs Request:
Product: ${args.product}
Market: ${args.market || 'Latin America (Panama, Mexico, Colombia, Brazil)'}
Task: ${args.task || 'compliance_roadmap'}

Provide regulatory guidance. Include:
1. Applicable regulations and requirements
2. Regulatory pathway analysis
3. Documentation requirements
4. Timeline and milestones
5. Risk areas and mitigation strategies

Note: This is advisory. Consult qualified regulatory counsel for binding advice.`;
        const raw = await callLLM(COMPLIANCE_SYSTEM, input, { temperature: 0.3 });
        log.info('cs_regulatoryAffairs executed', { trace_id: traceId });
        return parseJSON(raw);
      },
    },
  ];
}
