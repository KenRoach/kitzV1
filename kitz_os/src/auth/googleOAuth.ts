/**
 * Google OAuth2 Manager — Token storage, refresh, and calendar client.
 *
 * Flow:
 *   1. User visits /api/kitz/oauth/google/authorize → redirected to Google consent
 *   2. Google redirects back to /api/kitz/oauth/google/callback with auth code
 *   3. We exchange code for access_token + refresh_token, store locally
 *   4. Calendar tools use getCalendarClient() which auto-refreshes tokens
 *
 * Tokens stored in: data/auth/google-tokens.json (gitignored)
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { google, type calendar_v3 } from 'googleapis';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createSubsystemLogger('googleOAuth');

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data', 'auth');
const TOKEN_FILE = join(DATA_DIR, 'google-tokens.json');

// ── Config from env ──
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3012/api/kitz/oauth/google/callback';

// Calendar scopes
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// ── Types ──
interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

// ── OAuth2 Client ──
function createOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

// ── Token Storage ──
async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const data = await readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(data) as StoredTokens;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: StoredTokens): Promise<void> {
  await ensureDataDir();
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  log.info('Tokens saved');
}

// ── Public API ──

/**
 * Check if Google OAuth is configured (client ID + secret set).
 */
export function isGoogleOAuthConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

/**
 * Check if we have valid (possibly expired) tokens stored.
 */
export async function hasStoredTokens(): Promise<boolean> {
  const tokens = await loadTokens();
  return tokens !== null && !!tokens.refresh_token;
}

/**
 * Generate the Google OAuth consent URL.
 */
export function getAuthUrl(): string {
  const oauth2 = createOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force refresh_token on every auth
  });
}

/**
 * Exchange authorization code for tokens and store them.
 */
export async function exchangeCode(code: string): Promise<void> {
  const oauth2 = createOAuth2Client();
  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error('No refresh_token received. Re-authorize with prompt=consent.');
  }

  await saveTokens({
    access_token: tokens.access_token || '',
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || 0,
    scope: tokens.scope || SCOPES.join(' '),
    token_type: tokens.token_type || 'Bearer',
  });
}

/**
 * Get an authenticated Google Calendar client.
 * Auto-refreshes expired tokens.
 */
export async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  const tokens = await loadTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error('NOT_AUTHENTICATED');
  }

  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
  });

  // Auto-refresh handler — saves new tokens when refreshed
  oauth2.on('tokens', async (newTokens) => {
    const updated: StoredTokens = {
      access_token: newTokens.access_token || tokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
      expiry_date: newTokens.expiry_date || tokens.expiry_date,
      scope: newTokens.scope || tokens.scope,
      token_type: newTokens.token_type || tokens.token_type,
    };
    await saveTokens(updated);
  });

  return google.calendar({ version: 'v3', auth: oauth2 });
}

/**
 * Revoke stored tokens and delete the file.
 */
export async function revokeTokens(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens?.access_token) {
    try {
      const oauth2 = createOAuth2Client();
      await oauth2.revokeToken(tokens.access_token);
    } catch {
      // Token may already be expired/revoked
    }
  }
  try {
    const { unlink } = await import('node:fs/promises');
    await unlink(TOKEN_FILE);
  } catch {
    // File may not exist
  }
  log.info('Tokens revoked and deleted');
}
