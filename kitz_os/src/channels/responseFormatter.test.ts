import { describe, it, expect } from 'vitest';
import { formatForChannel } from './responseFormatter.js';

const SAMPLE_RESPONSE = `**Revenue Report**

Here's your summary:

- Total revenue: $5,200
- Active orders: 12
- Follow-ups needed: 3

> Keep pushing, boss!`;

describe('formatForChannel', () => {
  describe('web', () => {
    it('passes through markdown as-is', () => {
      const result = formatForChannel(SAMPLE_RESPONSE, 'web');
      expect(result.channel).toBe('web');
      expect(result.body).toBe(SAMPLE_RESPONSE);
      expect(result.truncated).toBe(false);
    });
  });

  describe('whatsapp', () => {
    it('converts **bold** to *bold*', () => {
      const result = formatForChannel('**Hello World**', 'whatsapp');
      expect(result.body).toBe('*Hello World*');
    });

    it('converts bullet dashes to dots', () => {
      const result = formatForChannel('- Item one\n- Item two', 'whatsapp');
      expect(result.body).toContain('Item one');
      expect(result.body).toContain('Item two');
    });

    it('truncates at 4096 chars', () => {
      const long = 'x'.repeat(5000);
      const result = formatForChannel(long, 'whatsapp');
      expect(result.body.length).toBeLessThanOrEqual(4096);
      expect(result.truncated).toBe(true);
    });
  });

  describe('email', () => {
    it('produces HTML output', () => {
      const result = formatForChannel(SAMPLE_RESPONSE, 'email');
      expect(result.html).toBeDefined();
      expect(result.html).toContain('<strong>');
    });

    it('extracts subject from first line', () => {
      const result = formatForChannel(SAMPLE_RESPONSE, 'email');
      expect(result.subject).toBeTruthy();
    });
  });

  describe('sms', () => {
    it('strips markdown and keeps under 155 chars', () => {
      const result = formatForChannel(SAMPLE_RESPONSE, 'sms');
      expect(result.body.length).toBeLessThanOrEqual(155);
      expect(result.body).not.toContain('**');
      expect(result.body).not.toContain('*');
    });

    it('handles short messages', () => {
      const result = formatForChannel('Done!', 'sms');
      expect(result.body).toBe('Done!');
      expect(result.truncated).toBe(false);
    });
  });

  describe('voice', () => {
    it('strips markdown formatting', () => {
      const result = formatForChannel('**Hello** world', 'voice');
      expect(result.ttsText).toBeDefined();
      expect(result.ttsText).not.toContain('**');
      expect(result.ttsText).not.toContain('*');
    });

    it('truncates at 5000 chars', () => {
      const long = 'word '.repeat(1500);
      const result = formatForChannel(long, 'voice');
      expect(result.ttsText!.length).toBeLessThanOrEqual(5000);
      expect(result.truncated).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      const result = formatForChannel('', 'web');
      expect(result.body).toBe('');
    });

    it('handles unknown channel gracefully', () => {
      const result = formatForChannel('test', 'web');
      expect(result.channel).toBe('web');
    });
  });
});
