/**
 * Structured Logging with PII Redaction — shared across all Kitz services.
 *
 * Ported from OpenClaw logging/ module.
 * Provides subsystem-scoped loggers with consistent JSON output
 * and automatic PII redaction for phone numbers, emails, tokens.
 */

import { createHash } from 'node:crypto';

// ── Log Levels ──

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5,
};

// ── PII Redaction Patterns ──

const REDACT_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Phone numbers: +507 6XXX-XXXX, +1 234-567-8901, etc.
  { pattern: /\+?\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{0,4}/g, replacement: '+XX-XXXX-XXXX' },
  // WhatsApp JIDs: 50761234567@s.whatsapp.net
  { pattern: /\d{8,15}@s\.whatsapp\.net/g, replacement: 'XXXX@s.whatsapp.net' },
  // Email addresses
  { pattern: /[\w.-]+@[\w.-]+\.\w{2,}/g, replacement: '***@***.***' },
  // Bearer tokens
  { pattern: /Bearer\s+[\w.-]{20,}/gi, replacement: 'Bearer ***REDACTED***' },
  // API keys (sk-, xox-, gsk_, AIza, pplx-)
  { pattern: /(?:sk-|xox[bpas]-|gsk_|AIza|pplx-)[A-Za-z0-9_-]{10,}/g, replacement: '***KEY***' },
  // Generic env-style secrets: KEY=value
  { pattern: /(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)[\s]*=[\s]*["']?[^\s"']{8,}["']?/gi, replacement: '$1=***REDACTED***' },
];

/**
 * Redact PII and secrets from a string.
 */
export function redactSensitiveText(text: string): string {
  let result = text;
  for (const { pattern, replacement } of REDACT_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Hash an identifier (phone, email, userId) for safe logging.
 * Returns "sha256:<12-char-prefix>" — enough for debugging, not reversible.
 */
export function redactIdentifier(value?: string): string {
  if (!value) return 'sha256:null';
  const hash = createHash('sha256').update(value).digest('hex');
  return `sha256:${hash.slice(0, 12)}`;
}

// ── Subsystem Logger ──

export interface SubsystemLogger {
  subsystem: string;
  trace(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  fatal(message: string, meta?: Record<string, unknown>): void;
  child(name: string): SubsystemLogger;
}

let globalLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

/**
 * Set the global log level for all subsystem loggers.
 */
export function setLogLevel(level: LogLevel): void {
  globalLevel = level;
}

/**
 * Create a subsystem-scoped logger with structured JSON output.
 *
 * Usage:
 *   const log = createSubsystemLogger('whatsapp-connector');
 *   log.info('connected', { phone: redactIdentifier(phoneJid) });
 */
export function createSubsystemLogger(subsystem: string): SubsystemLogger {
  const emit = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[globalLevel]) return;

    const entry = {
      ts: new Date().toISOString(),
      level,
      subsystem,
      msg: message,
      ...meta,
    };

    // Redact any string values in meta
    const safeEntry = JSON.stringify(entry, (_key, val) => {
      if (typeof val === 'string' && val.length > 20) {
        return redactSensitiveText(val);
      }
      return val;
    });

    if (level === 'error' || level === 'fatal') {
      console.error(safeEntry);
    } else if (level === 'warn') {
      console.warn(safeEntry);
    } else {
      console.log(safeEntry);
    }
  };

  return {
    subsystem,
    trace: (msg, meta?) => emit('trace', msg, meta),
    debug: (msg, meta?) => emit('debug', msg, meta),
    info: (msg, meta?) => emit('info', msg, meta),
    warn: (msg, meta?) => emit('warn', msg, meta),
    error: (msg, meta?) => emit('error', msg, meta),
    fatal: (msg, meta?) => emit('fatal', msg, meta),
    child(name: string): SubsystemLogger {
      return createSubsystemLogger(`${subsystem}/${name}`);
    },
  };
}
