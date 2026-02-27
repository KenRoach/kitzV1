/**
 * Channel Preferences — In-memory storage for user echo channel settings.
 *
 * Stores which additional channels a user wants responses echoed to.
 * Matches the existing in-memory Map pattern used in kitz-gateway.
 */

import type { OutputChannel, UserChannelPreferences } from 'kitz-schemas';

const store = new Map<string, UserChannelPreferences>();

export function getUserPreferences(userId: string): UserChannelPreferences {
  return store.get(userId) || {
    userId,
    echoChannels: [],
    updatedAt: new Date().toISOString(),
  };
}

export function setUserPreferences(
  userId: string,
  prefs: Partial<Pick<UserChannelPreferences, 'echoChannels' | 'phone' | 'email'>>,
): UserChannelPreferences {
  const existing = getUserPreferences(userId);
  const updated: UserChannelPreferences = {
    ...existing,
    ...prefs,
    userId,
    updatedAt: new Date().toISOString(),
  };
  store.set(userId, updated);
  return updated;
}

export function getUserEchoChannels(userId: string): OutputChannel[] {
  return getUserPreferences(userId).echoChannels;
}
