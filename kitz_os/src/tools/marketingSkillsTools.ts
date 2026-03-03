/**
 * Marketing Skills Tools — 32 expert marketing skills adapted from coreyhaines31/marketingskills.
 *
 * Skills organized into 9 categories:
 *   - Conversion Optimization (6): page CRO, signup flow, onboarding, forms, popups, paywalls
 *   - Content & Copy (5): copywriting, copy editing, cold email, email sequences, social content
 *   - SEO & Discovery (6): SEO audit, AI SEO, programmatic SEO, site architecture, competitor pages, schema markup
 *   - Paid & Distribution (2): paid ads, ad creative
 *   - Measurement (2): analytics tracking, A/B test setup
 *   - Strategy (4): marketing ideas, marketing psychology, launch strategy, pricing strategy
 *   - Growth & Retention (3): churn prevention, free tool strategy, referral program
 *   - Sales & RevOps (2): revops, sales enablement
 *   - Foundation (2): product marketing context, content strategy
 *
 * Each skill uses callLLM with expert system prompts adapted for LatAm SMBs.
 * Spanish-first, WhatsApp-first. Falls back to advisory if no LLM available.
 *
 * Source: https://github.com/coreyhaines31/marketingskills (MIT license)
 */

import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('marketingSkillsTools');

// ── Helper: Parse JSON from LLM response ──
function parseJSON(raw: string): Record<string, unknown> {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { raw_output: raw };
  } catch {
    return { raw_output: raw };
  }
}

// ── System Prompts by Category ──

const CRO_SYSTEM = `You are an expert conversion rate optimization (CRO) strategist for small businesses in Latin America.
You apply frameworks from: Flint McGlaughlin (MECLABS), Peep Laja (CXL), conversion.com methodology.
Default language: Spanish. Adapt all advice for WhatsApp-first, mobile-first LatAm businesses.
Always respond with valid JSON.`;

const COPY_SYSTEM = `You are an expert marketing copywriter trained in Copyhackers (Joanna Wiebe), Claude Hopkins, David Ogilvy, and Eugene Schwartz.
Write copy that converts. Lead with benefits. Use voice-of-customer data. Headlines stop scrolling. CTAs reduce friction.
Default language: Spanish. Adapt for WhatsApp-first LatAm businesses.
Always respond with valid JSON.`;

const SEO_SYSTEM = `You are an expert SEO strategist covering technical SEO, on-page optimization, content SEO, and AI search optimization.
You apply frameworks from: Ahrefs, SEMrush, Google Search Central guidelines, and AEO/GEO/LLMO best practices.
Default language: Spanish. Adapt for LatAm markets and Spanish-language search.
Always respond with valid JSON.`;

const ADS_SYSTEM = `You are an expert paid acquisition strategist for Google Ads, Meta Ads, LinkedIn Ads, and TikTok Ads.
You optimize for ROAS, CAC, and LTV. You understand audience targeting, creative testing, and budget allocation.
Default language: Spanish. Adapt for LatAm ad markets and WhatsApp-first conversion funnels.
Always respond with valid JSON.`;

const ANALYTICS_SYSTEM = `You are an expert marketing analytics and measurement strategist.
You specialize in GA4, GTM, event tracking, UTM strategy, A/B testing, and attribution modeling.
Default language: Spanish. Adapt for small businesses with limited analytics maturity.
Always respond with valid JSON.`;

const STRATEGY_SYSTEM = `You are an expert marketing strategist who combines growth hacking, behavioral psychology, and proven SaaS/SMB frameworks.
You draw from: Cialdini (influence), Kahneman (behavioral economics), April Dunford (positioning), and 139+ proven marketing tactics.
Default language: Spanish. Adapt for LatAm SMBs selling via WhatsApp and Instagram.
Always respond with valid JSON.`;

const GROWTH_SYSTEM = `You are an expert growth and retention strategist for small businesses.
You specialize in: churn prevention, referral programs, viral loops, free tools for lead gen, and customer lifecycle optimization.
Default language: Spanish. Adapt for LatAm SMBs with WhatsApp as primary channel.
Always respond with valid JSON.`;

const SALES_SYSTEM = `You are an expert revenue operations and sales enablement strategist.
You specialize in: lead lifecycle management, scoring, routing, pipeline management, sales decks, objection handling, and demo scripts.
Default language: Spanish. Adapt for LatAm SMBs with informal sales processes.
Always respond with valid JSON.`;

export function getAllMarketingSkillsTools(): ToolSchema[] {
  return [
    // ═══════════════════════════════════
    // CONVERSION OPTIMIZATION (6 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_pageCRO',
      description: 'Optimize any marketing page (homepage, landing, pricing, feature) for conversions. Analyzes layout, copy, CTAs, trust signals, and mobile experience.',
      parameters: {
        type: 'object',
        properties: {
          page_type: { type: 'string', enum: ['homepage', 'landing', 'pricing', 'feature', 'about', 'product'], description: 'Type of page' },
          page_url: { type: 'string', description: 'URL of the page to analyze (optional)' },
          current_conversion_rate: { type: 'number', description: 'Current conversion rate % (optional)' },
          goal: { type: 'string', description: 'Primary conversion goal (signups, purchases, leads, etc.)' },
          audience: { type: 'string', description: 'Target audience description' },
        },
        required: ['page_type', 'goal'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Page CRO audit:\nPage type: ${args.page_type}\nGoal: ${args.goal}` +
          (args.audience ? `\nAudience: ${args.audience}` : '') +
          (args.page_url ? `\nURL: ${args.page_url}` : '') +
          (args.current_conversion_rate ? `\nCurrent rate: ${args.current_conversion_rate}%` : '') +
          `\n\nRespond with JSON: { "score": number (1-100), "issues": [{ "element": string, "problem": string, "fix": string, "impact": "high"|"medium"|"low" }], "quick_wins": [string], "headline_rewrites": [string], "cta_suggestions": [string], "trust_signals_needed": [string] }`;
        const raw = await callLLM(CRO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_pageCRO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_signupFlowCRO',
      description: 'Optimize signup, registration, or trial activation flows. Reduce friction, improve completion rates, optimize form fields.',
      parameters: {
        type: 'object',
        properties: {
          flow_type: { type: 'string', enum: ['signup', 'registration', 'trial', 'freemium', 'waitlist'], description: 'Type of signup flow' },
          current_steps: { type: 'number', description: 'Number of current steps in flow' },
          completion_rate: { type: 'number', description: 'Current completion rate % (optional)' },
          fields_required: { type: 'string', description: 'Current required fields (comma-separated)' },
          product: { type: 'string', description: 'Product/service name' },
        },
        required: ['flow_type', 'product'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Signup flow CRO:\nType: ${args.flow_type}\nProduct: ${args.product}` +
          (args.current_steps ? `\nSteps: ${args.current_steps}` : '') +
          (args.fields_required ? `\nFields: ${args.fields_required}` : '') +
          `\n\nRespond with JSON: { "optimized_steps": [{ "step": number, "title": string, "fields": [string], "cta": string }], "removed_friction": [string], "social_proof_placements": [string], "estimated_lift": string }`;
        const raw = await callLLM(CRO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_signupFlowCRO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_onboardingCRO',
      description: 'Optimize post-signup activation and time-to-value. Design onboarding sequences that get users to their "aha moment" fast.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service name' },
          aha_moment: { type: 'string', description: 'What is the "aha moment" for users?' },
          current_activation_rate: { type: 'number', description: 'Current activation rate % (optional)' },
          user_type: { type: 'string', description: 'Target user persona' },
        },
        required: ['product', 'aha_moment'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Onboarding CRO:\nProduct: ${args.product}\nAha moment: ${args.aha_moment}` +
          (args.user_type ? `\nUser type: ${args.user_type}` : '') +
          `\n\nRespond with JSON: { "onboarding_steps": [{ "step": number, "action": string, "message": string, "channel": string }], "activation_checklist": [string], "time_to_value_target": string, "drop_off_prevention": [string] }`;
        const raw = await callLLM(CRO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_onboardingCRO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_popupCRO',
      description: 'Design high-converting popups, modals, slide-ins, and banners. Optimize timing, targeting, copy, and offers.',
      parameters: {
        type: 'object',
        properties: {
          popup_type: { type: 'string', enum: ['exit_intent', 'timed', 'scroll', 'click', 'slide_in', 'banner'], description: 'Type of popup' },
          goal: { type: 'string', description: 'Popup goal (email capture, discount, announcement, etc.)' },
          offer: { type: 'string', description: 'What are you offering?' },
          audience: { type: 'string', description: 'Target audience' },
        },
        required: ['popup_type', 'goal'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Popup CRO:\nType: ${args.popup_type}\nGoal: ${args.goal}` +
          (args.offer ? `\nOffer: ${args.offer}` : '') +
          `\n\nRespond with JSON: { "headline": string, "subheadline": string, "cta_text": string, "design_tips": [string], "timing_rules": { "trigger": string, "delay_seconds": number, "frequency": string }, "targeting": [string], "a_b_test_ideas": [string] }`;
        const raw = await callLLM(CRO_SYSTEM, input, { temperature: 0.4 });
        log.info('executed', { tool: 'mktg_popupCRO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_formCRO',
      description: 'Optimize lead capture forms, contact forms, and any non-signup form for higher completion rates.',
      parameters: {
        type: 'object',
        properties: {
          form_type: { type: 'string', description: 'Type of form (lead capture, contact, quote request, etc.)' },
          current_fields: { type: 'string', description: 'Current form fields (comma-separated)' },
          completion_rate: { type: 'number', description: 'Current completion rate %' },
        },
        required: ['form_type'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Form CRO:\nType: ${args.form_type}` +
          (args.current_fields ? `\nCurrent fields: ${args.current_fields}` : '') +
          `\n\nRespond with JSON: { "optimized_fields": [{ "field": string, "required": boolean, "type": string }], "removed_fields": [string], "multi_step_suggestion": boolean, "copy_improvements": { "headline": string, "cta": string, "helper_text": string }, "social_proof": string }`;
        const raw = await callLLM(CRO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_formCRO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_paywallCRO',
      description: 'Optimize in-app paywalls, upgrade screens, upsell modals, and feature gates for higher conversion.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product name' },
          trigger: { type: 'string', description: 'What triggers the paywall (feature gate, usage limit, etc.)' },
          pricing: { type: 'string', description: 'Current pricing structure' },
          free_to_paid_rate: { type: 'number', description: 'Current free-to-paid conversion rate %' },
        },
        required: ['product', 'trigger'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Paywall CRO:\nProduct: ${args.product}\nTrigger: ${args.trigger}` +
          (args.pricing ? `\nPricing: ${args.pricing}` : '') +
          `\n\nRespond with JSON: { "paywall_copy": { "headline": string, "value_props": [string], "cta": string, "social_proof": string }, "design_principles": [string], "upgrade_triggers": [string], "save_offer": { "discount": string, "urgency": string }, "a_b_tests": [string] }`;
        const raw = await callLLM(CRO_SYSTEM, input, { temperature: 0.4 });
        log.info('executed', { tool: 'mktg_paywallCRO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // CONTENT & COPY (5 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_copywriting',
      description: 'Write or improve marketing copy for any page — headlines, body copy, CTAs, page structure. Copyhackers methodology.',
      parameters: {
        type: 'object',
        properties: {
          page_type: { type: 'string', description: 'Page type (landing, homepage, product, email, ad, etc.)' },
          product: { type: 'string', description: 'Product/service name' },
          audience: { type: 'string', description: 'Target audience' },
          key_benefit: { type: 'string', description: 'Primary benefit/transformation' },
          tone: { type: 'string', enum: ['casual', 'professional', 'urgent', 'playful', 'authoritative'], description: 'Voice/tone' },
          current_copy: { type: 'string', description: 'Existing copy to improve (optional)' },
        },
        required: ['product', 'audience', 'key_benefit'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Write marketing copy:\nProduct: ${args.product}\nAudience: ${args.audience}\nBenefit: ${args.key_benefit}\nTone: ${args.tone || 'casual'}` +
          (args.page_type ? `\nPage: ${args.page_type}` : '') +
          (args.current_copy ? `\nImprove: ${args.current_copy}` : '') +
          `\n\nRespond with JSON: { "headlines": [{ "text": string, "type": string, "hook": string }], "subheadlines": [string], "body_sections": [{ "heading": string, "copy": string }], "ctas": [{ "text": string, "context": string }], "social_proof_copy": string, "urgency_copy": string }`;
        const raw = await callLLM(COPY_SYSTEM, input, { temperature: 0.5 });
        log.info('executed', { tool: 'mktg_copywriting', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_copyEditing',
      description: 'Edit and polish existing marketing copy. Fix clarity, flow, persuasion, grammar, and conversion potential.',
      parameters: {
        type: 'object',
        properties: {
          copy: { type: 'string', description: 'The copy to edit' },
          goal: { type: 'string', description: 'What should the copy achieve?' },
          issues: { type: 'string', description: 'Known issues (optional)' },
        },
        required: ['copy'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Edit this marketing copy:\n\n"${args.copy}"` +
          (args.goal ? `\nGoal: ${args.goal}` : '') +
          `\n\nRespond with JSON: { "edited_copy": string, "changes_made": [{ "original": string, "edited": string, "reason": string }], "clarity_score": number, "persuasion_score": number, "readability_grade": string }`;
        const raw = await callLLM(COPY_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_copyEditing', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_coldEmail',
      description: 'Create B2B cold outreach emails and follow-up sequences. Optimized for open rates, reply rates, and meeting bookings.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service you are selling' },
          target_role: { type: 'string', description: 'Target job title/role' },
          target_company_type: { type: 'string', description: 'Type of company you target' },
          value_prop: { type: 'string', description: 'Your unique value proposition' },
          sequence_length: { type: 'number', description: 'Number of emails in sequence (default: 4)' },
        },
        required: ['product', 'target_role', 'value_prop'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const seqLen = args.sequence_length || 4;
        const input = `Cold email sequence (${seqLen} emails):\nProduct: ${args.product}\nTarget: ${args.target_role}` +
          (args.target_company_type ? `\nCompany type: ${args.target_company_type}` : '') +
          `\nValue prop: ${args.value_prop}` +
          `\n\nRespond with JSON: { "sequence": [{ "email_number": number, "subject": string, "body": string, "send_delay_days": number, "goal": string }], "personalization_variables": [string], "subject_line_variants": [string], "tips": [string] }`;
        const raw = await callLLM(COPY_SYSTEM, input, { temperature: 0.5, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_coldEmail', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_emailSequence',
      description: 'Design automated email flows: welcome sequences, drip campaigns, nurture sequences, re-engagement, and lifecycle emails.',
      parameters: {
        type: 'object',
        properties: {
          sequence_type: { type: 'string', enum: ['welcome', 'nurture', 'onboarding', 'reengagement', 'upsell', 'win_back', 'launch'], description: 'Type of email sequence' },
          product: { type: 'string', description: 'Product/service name' },
          audience: { type: 'string', description: 'Target audience' },
          emails_count: { type: 'number', description: 'Number of emails (default: 5)' },
          goal: { type: 'string', description: 'Sequence goal' },
        },
        required: ['sequence_type', 'product'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const count = args.emails_count || 5;
        const input = `Email sequence (${count} emails):\nType: ${args.sequence_type}\nProduct: ${args.product}` +
          (args.audience ? `\nAudience: ${args.audience}` : '') +
          (args.goal ? `\nGoal: ${args.goal}` : '') +
          `\n\nRespond with JSON: { "sequence": [{ "email_number": number, "subject": string, "preview_text": string, "body_outline": string, "cta": string, "send_timing": string }], "segmentation_rules": [string], "kpis": [string] }`;
        const raw = await callLLM(COPY_SYSTEM, input, { temperature: 0.4, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_emailSequence', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_socialContent',
      description: 'Generate social media content for LinkedIn, X/Twitter, Instagram, TikTok. Platform-specific formats and hooks.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['instagram', 'linkedin', 'twitter', 'tiktok', 'facebook', 'all'], description: 'Target platform' },
          topic: { type: 'string', description: 'Content topic or theme' },
          content_type: { type: 'string', enum: ['post', 'carousel', 'reel_script', 'thread', 'story', 'poll'], description: 'Content format' },
          brand_voice: { type: 'string', description: 'Brand voice description' },
          count: { type: 'number', description: 'Number of content pieces (default: 5)' },
        },
        required: ['platform', 'topic'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const count = args.count || 5;
        const input = `Social content (${count} pieces):\nPlatform: ${args.platform}\nTopic: ${args.topic}` +
          (args.content_type ? `\nFormat: ${args.content_type}` : '') +
          (args.brand_voice ? `\nVoice: ${args.brand_voice}` : '') +
          `\n\nRespond with JSON: { "content": [{ "platform": string, "format": string, "hook": string, "body": string, "hashtags": [string], "cta": string, "best_time": string }], "content_calendar_tip": string }`;
        const raw = await callLLM(COPY_SYSTEM, input, { temperature: 0.6, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_socialContent', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // SEO & DISCOVERY (6 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_seoAudit',
      description: 'Technical and on-page SEO audit. Identifies issues with meta tags, headings, content, page speed, mobile, and more.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to audit' },
          industry: { type: 'string', description: 'Business industry/niche' },
          target_keywords: { type: 'string', description: 'Target keywords (comma-separated)' },
        },
        required: ['url'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `SEO audit:\nURL: ${args.url}` +
          (args.industry ? `\nIndustry: ${args.industry}` : '') +
          (args.target_keywords ? `\nKeywords: ${args.target_keywords}` : '') +
          `\n\nRespond with JSON: { "score": number, "critical_issues": [{ "issue": string, "fix": string, "impact": string }], "warnings": [{ "issue": string, "fix": string }], "opportunities": [string], "meta_suggestions": { "title": string, "description": string }, "heading_structure": string, "content_gaps": [string] }`;
        const raw = await callLLM(SEO_SYSTEM, input, { temperature: 0.2 });
        log.info('executed', { tool: 'mktg_seoAudit', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_aiSEO',
      description: 'AI search optimization — optimize for AI Overviews, ChatGPT, Perplexity, and LLM-powered search engines (AEO, GEO, LLMO).',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic or query to optimize for' },
          current_content: { type: 'string', description: 'Current content (optional, for improvement)' },
          target_ai_platforms: { type: 'string', description: 'AI platforms to target (Google AI, ChatGPT, Perplexity, etc.)' },
        },
        required: ['topic'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `AI SEO optimization:\nTopic: ${args.topic}` +
          (args.target_ai_platforms ? `\nPlatforms: ${args.target_ai_platforms}` : '') +
          `\n\nRespond with JSON: { "ai_seo_score": number, "optimizations": [{ "technique": string, "description": string, "example": string }], "content_structure": { "format": string, "key_elements": [string] }, "citation_strategy": [string], "entity_optimization": [string] }`;
        const raw = await callLLM(SEO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_aiSEO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_programmaticSEO',
      description: 'Design SEO-driven pages at scale using templates and data. Plan programmatic SEO campaigns with thousands of pages.',
      parameters: {
        type: 'object',
        properties: {
          niche: { type: 'string', description: 'Business niche' },
          data_source: { type: 'string', description: 'What data do you have? (cities, products, categories, etc.)' },
          page_type: { type: 'string', description: 'Type of pages to create' },
          example_query: { type: 'string', description: 'Example search query to target' },
        },
        required: ['niche', 'data_source'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Programmatic SEO plan:\nNiche: ${args.niche}\nData: ${args.data_source}` +
          (args.page_type ? `\nPage type: ${args.page_type}` : '') +
          (args.example_query ? `\nQuery: ${args.example_query}` : '') +
          `\n\nRespond with JSON: { "page_template": { "title_pattern": string, "h1_pattern": string, "sections": [string], "dynamic_variables": [string] }, "estimated_pages": number, "keyword_patterns": [string], "internal_linking_strategy": string, "content_quality_rules": [string] }`;
        const raw = await callLLM(SEO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_programmaticSEO', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_siteArchitecture',
      description: 'Plan website page hierarchy, navigation, URL structure, and internal linking for SEO and UX.',
      parameters: {
        type: 'object',
        properties: {
          business_type: { type: 'string', description: 'Type of business' },
          current_pages: { type: 'string', description: 'Current pages (comma-separated)' },
          goals: { type: 'string', description: 'Site goals (lead gen, e-commerce, content, etc.)' },
        },
        required: ['business_type'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Site architecture plan:\nBusiness: ${args.business_type}` +
          (args.current_pages ? `\nCurrent pages: ${args.current_pages}` : '') +
          (args.goals ? `\nGoals: ${args.goals}` : '') +
          `\n\nRespond with JSON: { "sitemap": [{ "path": string, "title": string, "purpose": string, "parent": string }], "navigation": { "primary": [string], "footer": [string] }, "url_structure": string, "internal_linking_rules": [string], "seo_silos": [{ "topic": string, "pages": [string] }] }`;
        const raw = await callLLM(SEO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_siteArchitecture', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_competitorPages',
      description: 'Create competitor comparison and alternative pages for SEO. "X vs Y", "Best alternatives to X" pages.',
      parameters: {
        type: 'object',
        properties: {
          your_product: { type: 'string', description: 'Your product name' },
          competitors: { type: 'string', description: 'Competitor names (comma-separated)' },
          key_differentiators: { type: 'string', description: 'Your key advantages' },
        },
        required: ['your_product', 'competitors'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Competitor comparison pages:\nYour product: ${args.your_product}\nCompetitors: ${args.competitors}` +
          (args.key_differentiators ? `\nDifferentiators: ${args.key_differentiators}` : '') +
          `\n\nRespond with JSON: { "pages_to_create": [{ "title": string, "slug": string, "target_keyword": string, "search_volume_estimate": string }], "comparison_table": { "features": [string], "your_product": [string], "competitor_1": [string] }, "copy_angles": [string], "seo_tips": [string] }`;
        const raw = await callLLM(SEO_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_competitorPages', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_schemaMarkup',
      description: 'Generate structured data / JSON-LD schema markup for any page type (business, product, FAQ, article, etc.).',
      parameters: {
        type: 'object',
        properties: {
          page_type: { type: 'string', enum: ['business', 'product', 'article', 'faq', 'recipe', 'event', 'review', 'howto'], description: 'Schema type' },
          data: { type: 'string', description: 'Page content or data to mark up' },
        },
        required: ['page_type', 'data'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Schema markup:\nType: ${args.page_type}\nData: ${args.data}` +
          `\n\nRespond with JSON: { "json_ld": object, "implementation_notes": [string], "testing_url": "https://search.google.com/test/rich-results" }`;
        const raw = await callLLM(SEO_SYSTEM, input, { temperature: 0.1 });
        log.info('executed', { tool: 'mktg_schemaMarkup', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // PAID & DISTRIBUTION (2 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_paidAds',
      description: 'Plan and optimize paid ad campaigns for Google, Meta, LinkedIn, or TikTok. Strategy, targeting, budgets, and optimization.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['google', 'meta', 'linkedin', 'tiktok', 'all'], description: 'Ad platform' },
          product: { type: 'string', description: 'Product/service' },
          budget_monthly: { type: 'number', description: 'Monthly budget in USD' },
          goal: { type: 'string', enum: ['awareness', 'traffic', 'leads', 'sales', 'app_installs'], description: 'Campaign goal' },
          audience: { type: 'string', description: 'Target audience description' },
        },
        required: ['platform', 'product', 'goal'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Paid ads strategy:\nPlatform: ${args.platform}\nProduct: ${args.product}\nGoal: ${args.goal}` +
          (args.budget_monthly ? `\nBudget: $${args.budget_monthly}/mo` : '') +
          (args.audience ? `\nAudience: ${args.audience}` : '') +
          `\n\nRespond with JSON: { "campaign_structure": [{ "campaign": string, "objective": string, "ad_sets": [{ "name": string, "targeting": string, "budget_split": string }] }], "audience_segments": [string], "budget_allocation": { "testing": string, "scaling": string }, "kpis": [{ "metric": string, "target": string }], "creative_requirements": [string], "optimization_tips": [string] }`;
        const raw = await callLLM(ADS_SYSTEM, input, { temperature: 0.3, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_paidAds', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_adCreative',
      description: 'Generate bulk ad creative: headlines, descriptions, hooks, and copy variations for A/B testing across ad platforms.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service' },
          platform: { type: 'string', description: 'Ad platform' },
          key_benefit: { type: 'string', description: 'Primary benefit' },
          count: { type: 'number', description: 'Number of variations (default: 10)' },
          style: { type: 'string', enum: ['direct', 'storytelling', 'urgency', 'social_proof', 'question'], description: 'Creative style' },
        },
        required: ['product', 'key_benefit'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const count = args.count || 10;
        const input = `Ad creative (${count} variations):\nProduct: ${args.product}\nBenefit: ${args.key_benefit}` +
          (args.platform ? `\nPlatform: ${args.platform}` : '') +
          (args.style ? `\nStyle: ${args.style}` : '') +
          `\n\nRespond with JSON: { "headlines": [string], "descriptions": [string], "hooks": [string], "cta_variations": [string], "image_concepts": [string], "testing_plan": string }`;
        const raw = await callLLM(ADS_SYSTEM, input, { temperature: 0.6, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_adCreative', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // MEASUREMENT & TESTING (2 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_analyticsTracking',
      description: 'Design analytics tracking plans: GA4 events, GTM setup, UTM strategy, and conversion tracking.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', description: 'Analytics platform (GA4, Mixpanel, Amplitude, etc.)' },
          business_type: { type: 'string', description: 'Type of business' },
          key_actions: { type: 'string', description: 'Key user actions to track (comma-separated)' },
          goals: { type: 'string', description: 'Business goals for tracking' },
        },
        required: ['business_type', 'key_actions'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Analytics tracking plan:\nBusiness: ${args.business_type}\nKey actions: ${args.key_actions}` +
          (args.platform ? `\nPlatform: ${args.platform}` : '') +
          (args.goals ? `\nGoals: ${args.goals}` : '') +
          `\n\nRespond with JSON: { "events": [{ "event_name": string, "trigger": string, "parameters": [string], "category": string }], "utm_strategy": { "naming_convention": string, "examples": [string] }, "conversion_goals": [{ "goal": string, "event": string, "value": string }], "dashboard_metrics": [string] }`;
        const raw = await callLLM(ANALYTICS_SYSTEM, input, { temperature: 0.2 });
        log.info('executed', { tool: 'mktg_analyticsTracking', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_abTestSetup',
      description: 'Design A/B tests: hypothesis, sample size, variants, success metrics, and statistical significance requirements.',
      parameters: {
        type: 'object',
        properties: {
          element_to_test: { type: 'string', description: 'What you want to test (headline, CTA, layout, pricing, etc.)' },
          current_version: { type: 'string', description: 'Current version description' },
          hypothesis: { type: 'string', description: 'Your hypothesis' },
          monthly_traffic: { type: 'number', description: 'Monthly page traffic' },
          current_conversion_rate: { type: 'number', description: 'Current conversion rate %' },
        },
        required: ['element_to_test'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `A/B test design:\nElement: ${args.element_to_test}` +
          (args.current_version ? `\nCurrent: ${args.current_version}` : '') +
          (args.hypothesis ? `\nHypothesis: ${args.hypothesis}` : '') +
          (args.monthly_traffic ? `\nTraffic: ${args.monthly_traffic}/mo` : '') +
          `\n\nRespond with JSON: { "hypothesis": string, "variants": [{ "name": string, "description": string, "changes": [string] }], "primary_metric": string, "secondary_metrics": [string], "sample_size_per_variant": number, "estimated_duration_days": number, "significance_level": number, "implementation_steps": [string] }`;
        const raw = await callLLM(ANALYTICS_SYSTEM, input, { temperature: 0.2 });
        log.info('executed', { tool: 'mktg_abTestSetup', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // STRATEGY & MONETIZATION (4 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_marketingIdeas',
      description: 'Get 139+ proven marketing ideas and tactics organized by category. Customized for your business, budget, and goals.',
      parameters: {
        type: 'object',
        properties: {
          business: { type: 'string', description: 'Your business description' },
          budget: { type: 'string', enum: ['$0', 'under_$500', '$500_to_$2000', '$2000_plus'], description: 'Marketing budget range' },
          stage: { type: 'string', enum: ['pre_launch', 'launch', 'growth', 'scale'], description: 'Business stage' },
          channels: { type: 'string', description: 'Current marketing channels (comma-separated)' },
          count: { type: 'number', description: 'Number of ideas to return (default: 15)' },
        },
        required: ['business'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const count = args.count || 15;
        const input = `Marketing ideas (${count}):\nBusiness: ${args.business}` +
          (args.budget ? `\nBudget: ${args.budget}` : '') +
          (args.stage ? `\nStage: ${args.stage}` : '') +
          (args.channels ? `\nCurrent channels: ${args.channels}` : '') +
          `\n\nRespond with JSON: { "ideas": [{ "idea": string, "category": string, "effort": "low"|"medium"|"high", "cost": string, "expected_impact": string, "how_to_start": string }], "priority_matrix": { "quick_wins": [string], "big_bets": [string], "experiments": [string] } }`;
        const raw = await callLLM(STRATEGY_SYSTEM, input, { temperature: 0.5, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_marketingIdeas', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_marketingPsychology',
      description: 'Apply psychological principles and behavioral science to marketing. Cialdini\'s principles, cognitive biases, framing effects.',
      parameters: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Marketing context or challenge' },
          goal: { type: 'string', description: 'What behavior do you want to influence?' },
          audience: { type: 'string', description: 'Target audience' },
        },
        required: ['context', 'goal'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Marketing psychology:\nContext: ${args.context}\nGoal: ${args.goal}` +
          (args.audience ? `\nAudience: ${args.audience}` : '') +
          `\n\nRespond with JSON: { "principles_to_apply": [{ "principle": string, "explanation": string, "application": string, "example": string }], "cognitive_biases": [{ "bias": string, "how_to_use": string }], "implementation_steps": [string], "ethical_considerations": [string] }`;
        const raw = await callLLM(STRATEGY_SYSTEM, input, { temperature: 0.4 });
        log.info('executed', { tool: 'mktg_marketingPsychology', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_launchStrategy',
      description: 'Plan product launches, feature announcements, and release strategy. Pre-launch, launch day, and post-launch tactics.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/feature being launched' },
          launch_type: { type: 'string', enum: ['new_product', 'feature', 'rebrand', 'expansion', 'pricing_change'], description: 'Type of launch' },
          audience_size: { type: 'number', description: 'Current audience/customer base size' },
          launch_date: { type: 'string', description: 'Target launch date' },
          channels: { type: 'string', description: 'Available marketing channels' },
        },
        required: ['product', 'launch_type'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Launch strategy:\nProduct: ${args.product}\nType: ${args.launch_type}` +
          (args.audience_size ? `\nAudience: ${args.audience_size}` : '') +
          (args.launch_date ? `\nDate: ${args.launch_date}` : '') +
          (args.channels ? `\nChannels: ${args.channels}` : '') +
          `\n\nRespond with JSON: { "pre_launch": [{ "action": string, "timing": string, "channel": string }], "launch_day": [{ "action": string, "time": string }], "post_launch": [{ "action": string, "timing": string }], "messaging": { "headline": string, "one_liner": string, "key_benefits": [string] }, "success_metrics": [string] }`;
        const raw = await callLLM(STRATEGY_SYSTEM, input, { temperature: 0.4, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_launchStrategy', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_pricingStrategy',
      description: 'Design pricing, packaging, and monetization strategy. Value-based pricing, tier design, and psychological pricing.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service' },
          current_pricing: { type: 'string', description: 'Current pricing (if any)' },
          costs: { type: 'string', description: 'Cost structure' },
          competitors_pricing: { type: 'string', description: 'Competitor pricing' },
          target_market: { type: 'string', description: 'Target market (LatAm, US, etc.)' },
        },
        required: ['product'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Pricing strategy:\nProduct: ${args.product}` +
          (args.current_pricing ? `\nCurrent: ${args.current_pricing}` : '') +
          (args.competitors_pricing ? `\nCompetitors: ${args.competitors_pricing}` : '') +
          (args.target_market ? `\nMarket: ${args.target_market}` : '') +
          `\n\nRespond with JSON: { "recommended_model": string, "tiers": [{ "name": string, "price": string, "features": [string], "target_user": string }], "psychological_tactics": [string], "pricing_page_tips": [string], "localization_tips": [string] }`;
        const raw = await callLLM(STRATEGY_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_pricingStrategy', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // GROWTH & RETENTION (3 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_churnPrevention',
      description: 'Design cancel flows, save offers, dunning emails, and payment recovery strategies to reduce churn.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service' },
          churn_rate: { type: 'number', description: 'Current monthly churn rate %' },
          common_cancel_reasons: { type: 'string', description: 'Top cancel reasons (comma-separated)' },
          pricing: { type: 'string', description: 'Current pricing' },
        },
        required: ['product'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Churn prevention:\nProduct: ${args.product}` +
          (args.churn_rate ? `\nChurn: ${args.churn_rate}%` : '') +
          (args.common_cancel_reasons ? `\nReasons: ${args.common_cancel_reasons}` : '') +
          `\n\nRespond with JSON: { "cancel_flow": [{ "step": string, "action": string, "copy": string }], "save_offers": [{ "reason": string, "offer": string, "copy": string }], "dunning_sequence": [{ "day": number, "subject": string, "message": string }], "health_score_signals": [string], "proactive_retention": [string] }`;
        const raw = await callLLM(GROWTH_SYSTEM, input, { temperature: 0.3, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_churnPrevention', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_freeToolStrategy',
      description: 'Plan free marketing tools and calculators for lead generation and SEO. Build tools that attract and convert.',
      parameters: {
        type: 'object',
        properties: {
          niche: { type: 'string', description: 'Your business niche' },
          audience_problems: { type: 'string', description: 'Problems your audience faces' },
          count: { type: 'number', description: 'Number of tool ideas (default: 5)' },
        },
        required: ['niche'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const count = args.count || 5;
        const input = `Free tool strategy (${count} ideas):\nNiche: ${args.niche}` +
          (args.audience_problems ? `\nProblems: ${args.audience_problems}` : '') +
          `\n\nRespond with JSON: { "tool_ideas": [{ "name": string, "type": string, "description": string, "lead_capture_mechanism": string, "seo_keywords": [string], "build_effort": "low"|"medium"|"high" }], "prioritized_by_impact": [string], "monetization_path": string }`;
        const raw = await callLLM(GROWTH_SYSTEM, input, { temperature: 0.5 });
        log.info('executed', { tool: 'mktg_freeToolStrategy', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_referralProgram',
      description: 'Design referral and affiliate programs with viral loops. Incentive structures, mechanics, and growth modeling.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service' },
          current_customers: { type: 'number', description: 'Current customer count' },
          average_order_value: { type: 'number', description: 'Average order value ($)' },
          industry: { type: 'string', description: 'Industry' },
        },
        required: ['product'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Referral program:\nProduct: ${args.product}` +
          (args.current_customers ? `\nCustomers: ${args.current_customers}` : '') +
          (args.average_order_value ? `\nAOV: $${args.average_order_value}` : '') +
          `\n\nRespond with JSON: { "program_type": string, "incentive_structure": { "referrer_reward": string, "referee_reward": string, "tiers": [{ "level": string, "requirement": string, "reward": string }] }, "mechanics": [string], "viral_coefficient_target": number, "launch_plan": [string], "messaging": { "invite_copy": string, "share_cta": string } }`;
        const raw = await callLLM(GROWTH_SYSTEM, input, { temperature: 0.4 });
        log.info('executed', { tool: 'mktg_referralProgram', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // SALES & REVOPS (2 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_revops',
      description: 'Revenue operations: lead lifecycle management, scoring, routing, pipeline management, and funnel optimization.',
      parameters: {
        type: 'object',
        properties: {
          business: { type: 'string', description: 'Business description' },
          current_pipeline: { type: 'string', description: 'Current sales pipeline stages' },
          monthly_leads: { type: 'number', description: 'Monthly lead volume' },
          tools_used: { type: 'string', description: 'Current tools (CRM, etc.)' },
        },
        required: ['business'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `RevOps strategy:\nBusiness: ${args.business}` +
          (args.current_pipeline ? `\nPipeline: ${args.current_pipeline}` : '') +
          (args.monthly_leads ? `\nLeads/mo: ${args.monthly_leads}` : '') +
          (args.tools_used ? `\nTools: ${args.tools_used}` : '') +
          `\n\nRespond with JSON: { "pipeline_stages": [{ "stage": string, "criteria": string, "actions": [string], "sla_hours": number }], "lead_scoring": [{ "attribute": string, "points": number }], "routing_rules": [string], "automation_opportunities": [string], "metrics_to_track": [string] }`;
        const raw = await callLLM(SALES_SYSTEM, input, { temperature: 0.3 });
        log.info('executed', { tool: 'mktg_revops', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_salesEnablement',
      description: 'Create sales enablement materials: decks, one-pagers, objection handling scripts, demo scripts, and battle cards.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service' },
          material_type: { type: 'string', enum: ['deck', 'one_pager', 'objection_handling', 'demo_script', 'battle_card', 'case_study_template'], description: 'Type of material' },
          audience: { type: 'string', description: 'Target buyer persona' },
          key_objections: { type: 'string', description: 'Common objections (comma-separated)' },
        },
        required: ['product', 'material_type'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Sales enablement (${args.material_type}):\nProduct: ${args.product}` +
          (args.audience ? `\nAudience: ${args.audience}` : '') +
          (args.key_objections ? `\nObjections: ${args.key_objections}` : '') +
          `\n\nRespond with JSON: { "material_type": string, "content": { "title": string, "sections": [{ "heading": string, "content": string, "notes": string }] }, "objection_responses": [{ "objection": string, "response": string, "evidence": string }], "talk_tracks": [string], "metrics_to_share": [string] }`;
        const raw = await callLLM(SALES_SYSTEM, input, { temperature: 0.4, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_salesEnablement', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    // ═══════════════════════════════════
    // FOUNDATION (2 tools)
    // ═══════════════════════════════════

    {
      name: 'mktg_productContext',
      description: 'Create or update a product marketing context document. Foundation for all other marketing skills — positioning, messaging, audience.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product/service name' },
          problem_solved: { type: 'string', description: 'What problem does it solve?' },
          target_audience: { type: 'string', description: 'Who is this for?' },
          competitors: { type: 'string', description: 'Main competitors' },
          unique_value: { type: 'string', description: 'What makes you different?' },
          price_range: { type: 'string', description: 'Price range' },
        },
        required: ['product', 'problem_solved', 'target_audience'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Product marketing context:\nProduct: ${args.product}\nProblem: ${args.problem_solved}\nAudience: ${args.target_audience}` +
          (args.competitors ? `\nCompetitors: ${args.competitors}` : '') +
          (args.unique_value ? `\nUnique value: ${args.unique_value}` : '') +
          (args.price_range ? `\nPrice: ${args.price_range}` : '') +
          `\n\nRespond with JSON: { "positioning_statement": string, "tagline": string, "elevator_pitch": string, "target_personas": [{ "name": string, "role": string, "pain_points": [string], "goals": [string] }], "messaging_pillars": [{ "pillar": string, "proof_points": [string] }], "competitive_advantages": [string], "brand_voice": { "tone": string, "do": [string], "dont": [string] } }`;
        const raw = await callLLM(STRATEGY_SYSTEM, input, { temperature: 0.4, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_productContext', trace_id: traceId });
        return parseJSON(raw);
      },
    },

    {
      name: 'mktg_contentStrategy',
      description: 'Plan content strategy: topic selection, content calendar, distribution plan, and content pillars.',
      parameters: {
        type: 'object',
        properties: {
          business: { type: 'string', description: 'Business description' },
          audience: { type: 'string', description: 'Target audience' },
          goals: { type: 'string', description: 'Content goals (traffic, leads, authority, etc.)' },
          channels: { type: 'string', description: 'Content channels (blog, social, email, video, etc.)' },
          frequency: { type: 'string', description: 'Publishing frequency (e.g., 3x/week)' },
        },
        required: ['business', 'audience'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Content strategy:\nBusiness: ${args.business}\nAudience: ${args.audience}` +
          (args.goals ? `\nGoals: ${args.goals}` : '') +
          (args.channels ? `\nChannels: ${args.channels}` : '') +
          (args.frequency ? `\nFrequency: ${args.frequency}` : '') +
          `\n\nRespond with JSON: { "content_pillars": [{ "pillar": string, "topics": [string], "formats": [string] }], "calendar_week_1": [{ "day": string, "topic": string, "format": string, "channel": string }], "distribution_plan": [{ "channel": string, "strategy": string }], "repurposing_plan": [string], "kpis": [string] }`;
        const raw = await callLLM(STRATEGY_SYSTEM, input, { temperature: 0.4, maxTokens: 2048 });
        log.info('executed', { tool: 'mktg_contentStrategy', trace_id: traceId });
        return parseJSON(raw);
      },
    },
  ];
}
