/**
 * Structured Logger — JSON-formatted logging for KITZ OS.
 * Uses pino if available, falls back to structured console.log.
 */

interface Logger {
  info(msg: string, data?: Record<string, unknown>): void
  warn(msg: string, data?: Record<string, unknown>): void
  error(msg: string, data?: Record<string, unknown>): void
  debug(msg: string, data?: Record<string, unknown>): void
}

function formatLog(level: string, name: string, msg: string, data?: Record<string, unknown>): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    module: name,
    msg,
    ...data,
  })
}

export function createLogger(name: string): Logger {
  return {
    info(msg, data) { console.log(formatLog('info', name, msg, data)) },
    warn(msg, data) { console.warn(formatLog('warn', name, msg, data)) },
    error(msg, data) { console.error(formatLog('error', name, msg, data)) },
    debug(msg, data) { if (process.env.DEBUG) console.debug(formatLog('debug', name, msg, data)) },
  }
}
