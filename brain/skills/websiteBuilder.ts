/**
 * Website builder skill — generate landing pages and websites.
 *
 * Use cases: product landing pages, business homepages, checkout pages, link-in-bio.
 */

import type { LLMClient } from './callTranscription.js';

export interface WebsiteSection {
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'faq' | 'contact' | 'footer';
  heading: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface WebsiteResult {
  title: string;
  sections: WebsiteSection[];
  seoMeta: { title: string; description: string; keywords: string[] };
  htmlCode: string;
}

export interface WebsiteOptions {
  purpose: 'landing' | 'homepage' | 'checkout' | 'link-in-bio' | 'portfolio';
  businessName: string;
  description: string;
  brandColor?: string;
  ctaGoal?: string;
  language?: string;
}

const WEBSITE_SYSTEM =
  'You are a landing page builder for small businesses in Latin America. ' +
  'Create mobile-first, conversion-optimized pages. Default language: Spanish. ' +
  'Include SEO meta tags. Bold CTA above the fold. Fast-loading, simple HTML.';

export async function buildWebsite(options: WebsiteOptions, llmClient?: LLMClient): Promise<WebsiteResult> {
  if (llmClient) {
    const prompt = `Build a ${options.purpose} page for ${options.businessName}:\n${options.description}\nCTA goal: ${options.ctaGoal ?? 'WhatsApp contact'}\nColor: ${options.brandColor ?? '#FF6B35'}\nLanguage: ${options.language ?? 'es'}`;
    const response = await llmClient.complete({ prompt, system: WEBSITE_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as WebsiteResult; } catch { return { title: options.businessName, sections: [], seoMeta: { title: options.businessName, description: options.description, keywords: [] }, htmlCode: response.text }; }
  }
  return { title: options.businessName, sections: [], seoMeta: { title: options.businessName, description: options.description, keywords: [] }, htmlCode: '[Website generation unavailable]' };
}
