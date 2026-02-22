/**
 * Web Tools — Scraping, search, and URL fetching for Kitz OS.
 *
 * Tools:
 *   1. web_scrape     — Fetch a URL and extract text/structured content
 *   2. web_search     — Google search and return top results
 *   3. web_summarize  — Fetch a URL and AI-summarize the content
 *   4. web_extract    — Fetch a URL and extract specific data (prices, contacts, etc.)
 *
 * All responses are trimmed for WhatsApp delivery (max ~3500 chars).
 */

import * as cheerio from 'cheerio';
import type { ToolSchema } from './registry.js';

const MAX_CONTENT_LENGTH = 15_000;  // Max chars to process from a page
const MAX_RESPONSE_LENGTH = 3500;   // Max chars for WhatsApp response
const FETCH_TIMEOUT_MS = 15_000;    // 15 second timeout
const USER_AGENT = 'Mozilla/5.0 (compatible; KitzBot/1.0; +https://kitz.services)';

// ── Helpers ──

/** Fetch a URL and return raw HTML. */
async function fetchPage(url: string): Promise<{ html: string; finalUrl: string; status: number }> {
  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const res = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();
  return { html, finalUrl: res.url, status: res.status };
}

/** Extract clean text content from HTML. */
function htmlToText(html: string): { title: string; text: string; links: string[]; meta: Record<string, string> } {
  const $ = cheerio.load(html);

  // Remove noise elements
  $('script, style, nav, footer, header, iframe, noscript, svg, [role="navigation"], .nav, .footer, .header, .sidebar, .menu, .cookie-banner, .ad, .advertisement').remove();

  // Extract metadata
  const title = $('title').text().trim() || $('h1').first().text().trim() || '';
  const meta: Record<string, string> = {};
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  if (description) meta.description = description;
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  if (ogTitle) meta.og_title = ogTitle;
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  if (ogImage) meta.og_image = ogImage;

  // Extract main content — prioritize article/main tags
  let mainContent = $('article, main, [role="main"], .content, .post, .article').first();
  if (!mainContent.length || mainContent.text().trim().length < 100) {
    mainContent = $('body');
  }

  // Get text, preserving some structure
  const text = mainContent
    .text()
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);

  // Extract links
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const linkText = $(el).text().trim();
    if (href && linkText && !href.startsWith('#') && !href.startsWith('javascript:') && links.length < 10) {
      links.push(`${linkText}: ${href}`);
    }
  });

  return { title, text, links, meta };
}

/** Extract structured data (prices, emails, phones, addresses). */
function extractStructuredData(html: string, text: string): Record<string, string[]> {
  const data: Record<string, string[]> = {};

  // Prices
  const prices = text.match(/\$[\d,]+\.?\d{0,2}|\d+\.\d{2}\s*(?:USD|EUR|PAB)/g) || [];
  if (prices.length) data.prices = [...new Set(prices)].slice(0, 10);

  // Emails
  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  if (emails.length) data.emails = [...new Set(emails)].slice(0, 5);

  // Phone numbers
  const phones = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g) || [];
  if (phones.length) data.phones = [...new Set(phones)].slice(0, 5);

  // Social media handles
  const socials = text.match(/@[a-zA-Z0-9_]{2,30}/g) || [];
  if (socials.length) data.social_handles = [...new Set(socials)].slice(0, 5);

  return data;
}

/** Perform a Google search and return results. */
async function googleSearch(query: string, numResults: number = 5): Promise<Array<{ title: string; url: string; snippet: string }>> {
  // Use Google's search page and parse results
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://www.google.com/search?q=${encodedQuery}&num=${numResults}&hl=en`;

  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Google search failed: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: Array<{ title: string; url: string; snippet: string }> = [];

  // Parse Google search result divs
  $('div.g, div[data-hveid]').each((_, el) => {
    const titleEl = $(el).find('h3').first();
    const linkEl = $(el).find('a[href^="http"]').first();
    const snippetEl = $(el).find('div[data-sncf], div.VwiC3b, span.aCOpRe').first();

    const title = titleEl.text().trim();
    const url = linkEl.attr('href') || '';
    const snippet = snippetEl.text().trim();

    if (title && url && !url.includes('google.com/search')) {
      results.push({ title, url, snippet: snippet.slice(0, 200) });
    }
  });

  return results.slice(0, numResults);
}

// Claude API for summarization
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';

async function aiSummarize(content: string, instruction: string): Promise<string> {
  const truncated = content.slice(0, 8000);

  if (CLAUDE_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: `${instruction}\n\nContent:\n${truncated}` }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const data = await res.json() as any;
      return data.content?.[0]?.text || 'Could not summarize.';
    }
  }

  if (OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You summarize web content concisely for WhatsApp delivery. Keep it brief.' },
          { role: 'user', content: `${instruction}\n\nContent:\n${truncated}` },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content || 'Could not summarize.';
    }
  }

  // No AI available — return truncated text
  return truncated.slice(0, MAX_RESPONSE_LENGTH);
}

// ── Tools ──

export function getAllWebTools(): ToolSchema[] {
  return [
    // 1. WEB SCRAPE
    {
      name: 'web_scrape',
      description: 'Fetch a URL and extract its text content, title, metadata, and links. Use for reading articles, checking pages, or getting raw content from any website.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to scrape (e.g. "example.com" or "https://example.com/page")' },
          extract_links: { type: 'boolean', description: 'Whether to include links found on the page (default false)' },
        },
        required: ['url'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const { html, finalUrl, status } = await fetchPage(args.url as string);
          const { title, text, links, meta } = htmlToText(html);
          const structured = extractStructuredData(html, text);

          const result: Record<string, unknown> = {
            url: finalUrl,
            title,
            content: text.slice(0, MAX_RESPONSE_LENGTH),
            meta,
          };

          if (Object.keys(structured).length) result.extracted_data = structured;
          if (args.extract_links) result.links = links;

          return result;
        } catch (err) {
          return { error: `Failed to scrape: ${(err as Error).message}` };
        }
      },
    },

    // 2. WEB SEARCH
    {
      name: 'web_search',
      description: 'Search the web using Google and return top results with titles, URLs, and snippets. Use for finding information, competitors, prices, or anything online.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g. "best restaurants in Panama City")' },
          num_results: { type: 'number', description: 'Number of results to return (default 5, max 10)' },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const query = args.query as string;
          const numResults = Math.min((args.num_results as number) || 5, 10);
          const results = await googleSearch(query, numResults);

          if (results.length === 0) {
            return { message: `No results found for "${query}".`, results: [] };
          }

          return {
            query,
            count: results.length,
            results,
            formatted: results.map((r, i) => `${i + 1}. *${r.title}*\n   ${r.snippet}\n   ${r.url}`).join('\n\n'),
          };
        } catch (err) {
          return { error: `Search failed: ${(err as Error).message}` };
        }
      },
    },

    // 3. WEB SUMMARIZE
    {
      name: 'web_summarize',
      description: 'Fetch a URL and return an AI-generated summary of the page content. Great for quickly understanding articles, blog posts, or product pages.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to summarize' },
          focus: { type: 'string', description: 'What to focus on in the summary (e.g. "pricing", "features", "main argument")' },
        },
        required: ['url'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const { html, finalUrl } = await fetchPage(args.url as string);
          const { title, text } = htmlToText(html);
          const focus = (args.focus as string) || '';

          const instruction = focus
            ? `Summarize this web page in 3-5 bullet points, focusing on: ${focus}. Be concise — this will be read on WhatsApp.`
            : 'Summarize this web page in 3-5 bullet points. Be concise — this will be read on WhatsApp.';

          const summary = await aiSummarize(`Title: ${title}\n\n${text}`, instruction);

          return {
            url: finalUrl,
            title,
            summary,
          };
        } catch (err) {
          return { error: `Failed to summarize: ${(err as Error).message}` };
        }
      },
    },

    // 4. WEB EXTRACT
    {
      name: 'web_extract',
      description: 'Fetch a URL and extract specific structured data like prices, emails, phone numbers, social handles, or custom data points. Use for competitive research, lead generation, or price checking.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to extract data from' },
          extract: {
            type: 'string',
            description: 'What to extract (e.g. "prices", "contact info", "product names and prices", "opening hours")',
          },
        },
        required: ['url'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const { html, finalUrl } = await fetchPage(args.url as string);
          const { title, text } = htmlToText(html);
          const structured = extractStructuredData(html, text);
          const extractFocus = (args.extract as string) || '';

          let aiExtracted: string | null = null;
          if (extractFocus && (CLAUDE_API_KEY || OPENAI_API_KEY)) {
            aiExtracted = await aiSummarize(
              `Title: ${title}\n\n${text}`,
              `Extract the following data from this web page: ${extractFocus}\n\nReturn ONLY the extracted data in a clean, structured format. No commentary.`
            );
          }

          return {
            url: finalUrl,
            title,
            auto_extracted: structured,
            ...(aiExtracted ? { extracted: aiExtracted } : {}),
          };
        } catch (err) {
          return { error: `Failed to extract: ${(err as Error).message}` };
        }
      },
    },
  ];
}
