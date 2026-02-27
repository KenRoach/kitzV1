/**
 * Google OAuth2 for Login — Exchanges Google consent code for user profile.
 *
 * Reuses pattern from kitz_os/src/auth/googleOAuth.ts but with login scopes
 * (openid, email, profile) instead of calendar scopes.
 *
 * Flow:
 *   1. Frontend calls GET /auth/google/url → returns Google consent URL
 *   2. User consents, Google redirects to frontend /login?code=...
 *   3. Frontend sends code to POST /auth/google/callback
 *   4. Gateway exchanges code → gets userinfo → returns JWT
 */

import { google } from 'googleapis';
import type { GoogleUserProfile } from 'kitz-schemas';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_LOGIN_REDIRECT_URI || 'http://localhost:5173/login';

const LOGIN_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

function createOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function isGoogleLoginConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

export function getLoginAuthUrl(): string {
  const oauth2 = createOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'online',
    scope: LOGIN_SCOPES,
    prompt: 'select_account',
  });
}

export async function exchangeLoginCode(code: string): Promise<GoogleUserProfile> {
  const oauth2 = createOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
  const { data } = await oauth2Api.userinfo.get();

  if (!data.id || !data.email) {
    throw new Error('Failed to get user profile from Google');
  }

  return {
    googleId: data.id,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    picture: data.picture || undefined,
  };
}
