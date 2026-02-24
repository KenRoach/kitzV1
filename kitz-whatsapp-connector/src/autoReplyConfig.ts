/**
 * Auto-Reply Config — Per-user configurable auto-reply settings.
 *
 * In-memory Map (resets on restart). Stores enabled/disabled, message template,
 * cooldown, and owner name for {{owner}} placeholder.
 */

export interface AutoReplyConfig {
  enabled: boolean;
  message: string;
  cooldownMs: number;
  ownerName: string;
}

const DEFAULT_CONFIG: AutoReplyConfig = {
  enabled: true,
  message: '🟣 *KITZ*\n─────────\nThanks for your message! {{owner}} will get back to you soon. 🙏',
  cooldownMs: 4 * 60 * 60 * 1000, // 4 hours
  ownerName: 'Kenneth',
};

const configs = new Map<string, AutoReplyConfig>();

export function getAutoReplyConfig(userId: string): AutoReplyConfig {
  return configs.get(userId) || { ...DEFAULT_CONFIG };
}

export function setAutoReplyConfig(userId: string, patch: Partial<AutoReplyConfig>): AutoReplyConfig {
  const current = getAutoReplyConfig(userId);
  const updated: AutoReplyConfig = {
    enabled: patch.enabled ?? current.enabled,
    message: patch.message ?? current.message,
    cooldownMs: patch.cooldownMs ?? current.cooldownMs,
    ownerName: patch.ownerName ?? current.ownerName,
  };
  // Enforce minimum cooldown of 5 minutes
  if (updated.cooldownMs < 5 * 60 * 1000) {
    updated.cooldownMs = 5 * 60 * 1000;
  }
  configs.set(userId, updated);
  return updated;
}

export function renderMessage(config: AutoReplyConfig): string {
  return config.message.replace(/\{\{owner\}\}/g, config.ownerName);
}
