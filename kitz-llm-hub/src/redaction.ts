export const redact = (input: string): string => input
  .replace(/(sk-[a-zA-Z0-9]+)/g, '[REDACTED_KEY]')
  .replace(/\b\d{12,16}\b/g, '[REDACTED_NUMBER]')
  .replace(/\b([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})\b/g, '[REDACTED_EMAIL]');
