/**
 * Response Formatter — Transforms a single AI response into channel-appropriate formats.
 *
 * Each channel has different formatting rules:
 * - WhatsApp: *bold*, bullets, emoji, max 4096 chars
 * - Email: HTML with <strong>, <li>, <br>, subject line extraction
 * - SMS: Plain text, max 155 chars + ellipsis
 * - Voice: TTS-optimized, no markdown, max 5000 chars
 * - Web: Pass-through (already markdown)
 */

import type { OutputChannel, ChannelFormattedOutput } from 'kitz-schemas';

const CHANNEL_LIMITS: Record<OutputChannel, number> = {
  whatsapp: 4096,
  email: 50_000,
  sms: 155,
  voice: 5000,
  web: 8192,
};

/** Convert markdown bold to WhatsApp bold */
function markdownToWhatsApp(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '*$1*');
}

/** Convert markdown to basic HTML */
function markdownToHtml(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');

  // Convert bullet lists
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-•]\s+(.+)/);
    if (bulletMatch) {
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inList) { result.push('</ul>'); inList = false; }
      if (line.trim()) {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) result.push('</ul>');

  return result.join('\n');
}

/** Strip all markdown formatting for plain text */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '');
}

/** Strip markdown and flatten bullets for TTS */
function markdownToTts(text: string): string {
  let tts = stripMarkdown(text);
  // Collapse multiple newlines to single
  tts = tts.replace(/\n{2,}/g, '. ');
  tts = tts.replace(/\n/g, ', ');
  // Clean up punctuation
  tts = tts.replace(/,\s*,/g, ',');
  tts = tts.replace(/\.\s*\./g, '.');
  return tts.trim();
}

/** Extract a subject line from the first line of the response */
function extractSubject(text: string): string {
  const firstLine = text.split('\n')[0] || '';
  const clean = stripMarkdown(firstLine).trim();
  if (clean.length > 0 && clean.length <= 80) return clean;
  if (clean.length > 80) return clean.slice(0, 77) + '...';
  return 'KITZ Update';
}

/** Truncate text to limit with ellipsis */
function truncate(text: string, limit: number): { text: string; truncated: boolean } {
  if (text.length <= limit) return { text, truncated: false };
  return { text: text.slice(0, limit - 1) + '…', truncated: true };
}

export function formatForChannel(
  rawResponse: string,
  channel: OutputChannel,
): ChannelFormattedOutput {
  const limit = CHANNEL_LIMITS[channel];

  switch (channel) {
    case 'whatsapp': {
      const body = markdownToWhatsApp(rawResponse);
      const t = truncate(body, limit);
      return { channel, body: t.text, truncated: t.truncated };
    }

    case 'email': {
      const subject = extractSubject(rawResponse);
      const html = markdownToHtml(rawResponse);
      const body = stripMarkdown(rawResponse);
      const t = truncate(body, limit);
      return { channel, body: t.text, html, subject, truncated: t.truncated };
    }

    case 'sms': {
      const plain = stripMarkdown(rawResponse);
      // Take first sentence or truncate
      const firstSentence = plain.match(/^[^.!?]+[.!?]/)?.[0] || plain;
      const t = truncate(firstSentence.trim(), limit);
      return { channel, body: t.text, truncated: t.truncated };
    }

    case 'voice': {
      const ttsText = markdownToTts(rawResponse);
      const t = truncate(ttsText, limit);
      return { channel, body: t.text, ttsText: t.text, truncated: t.truncated };
    }

    case 'web':
    default: {
      const t = truncate(rawResponse, limit);
      return { channel, body: t.text, truncated: t.truncated };
    }
  }
}
