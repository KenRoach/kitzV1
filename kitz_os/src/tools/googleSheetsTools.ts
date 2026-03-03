/**
 * Google Sheets Tools — CRUD operations via Google Sheets API.
 *
 * Tools:
 *   1. sheets_create   — Create a new spreadsheet
 *   2. sheets_read     — Read data from a range
 *   3. sheets_write    — Write/append data to a range
 *   4. sheets_list     — List recent spreadsheets from Drive
 */

import { createSubsystemLogger } from 'kitz-schemas';
import {
  isGoogleOAuthConfigured,
  hasStoredTokens,
  getSheetsClient,
  getAuthUrl,
} from '../auth/googleOAuth.js';
import { google } from 'googleapis';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('googleSheetsTools');

const SETUP_MSG = 'Google Sheets not connected. Visit the setup link to connect your Google account.';

async function checkAuth(): Promise<{ error: string; setup_url?: string } | null> {
  if (!isGoogleOAuthConfigured()) {
    return { error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' };
  }
  if (!(await hasStoredTokens())) {
    return { error: SETUP_MSG, setup_url: getAuthUrl() };
  }
  return null;
}

export function getAllGoogleSheetsTools(): ToolSchema[] {
  return [
    // ── 1. Create Spreadsheet ──
    {
      name: 'sheets_create',
      description: 'Create a new Google Spreadsheet with optional initial data. Returns the spreadsheet URL.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Spreadsheet title' },
          headers: { type: 'string', description: 'Comma-separated column headers (e.g., "Name,Email,Phone,Amount")' },
          data: { type: 'string', description: 'JSON array of rows, each row is an array of values. E.g., [["John","john@x.com","555-1234",100]]' },
        },
        required: ['title'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const sheets = await getSheetsClient();
          const title = String(args.title || 'KITZ Spreadsheet');

          // Create the spreadsheet
          const res = await sheets.spreadsheets.create({
            requestBody: {
              properties: { title },
              sheets: [{ properties: { title: 'Sheet1' } }],
            },
          });

          const spreadsheetId = res.data.spreadsheetId!;
          const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

          // Add headers if provided
          const headerStr = String(args.headers || '');
          if (headerStr) {
            const headerRow = headerStr.split(',').map(h => h.trim());
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: 'Sheet1!A1',
              valueInputOption: 'RAW',
              requestBody: { values: [headerRow] },
            });
          }

          // Add initial data if provided
          if (args.data) {
            try {
              const rows = JSON.parse(String(args.data));
              if (Array.isArray(rows) && rows.length > 0) {
                const startRow = headerStr ? 2 : 1;
                await sheets.spreadsheets.values.update({
                  spreadsheetId,
                  range: `Sheet1!A${startRow}`,
                  valueInputOption: 'RAW',
                  requestBody: { values: rows },
                });
              }
            } catch {
              // Invalid JSON data — ignore, spreadsheet still created
            }
          }

          log.info('sheets_created', { spreadsheetId, title, trace_id: traceId });
          return { success: true, spreadsheetId, url, title, source: 'google_sheets' };
        } catch (err) {
          return { error: `Failed to create spreadsheet: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Read Data ──
    {
      name: 'sheets_read',
      description: 'Read data from a Google Spreadsheet. Returns rows as arrays.',
      parameters: {
        type: 'object',
        properties: {
          spreadsheet_id: { type: 'string', description: 'Google Spreadsheet ID (from URL)' },
          range: { type: 'string', description: 'A1 notation range (default: Sheet1!A1:Z100). E.g., "Sheet1!A1:D10"' },
        },
        required: ['spreadsheet_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const sheets = await getSheetsClient();
          const spreadsheetId = String(args.spreadsheet_id);
          const range = String(args.range || 'Sheet1!A1:Z100');

          const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
          const rows = res.data.values || [];

          log.info('sheets_read', { spreadsheetId, rows: rows.length, trace_id: traceId });
          return { success: true, rows, rowCount: rows.length, range, source: 'google_sheets' };
        } catch (err) {
          return { error: `Failed to read spreadsheet: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Write / Append Data ──
    {
      name: 'sheets_write',
      description: 'Write or append data to a Google Spreadsheet.',
      parameters: {
        type: 'object',
        properties: {
          spreadsheet_id: { type: 'string', description: 'Google Spreadsheet ID' },
          range: { type: 'string', description: 'A1 notation range to write to (e.g., "Sheet1!A1")' },
          data: { type: 'string', description: 'JSON array of rows. E.g., [["John",100],["Jane",200]]' },
          append: { type: 'boolean', description: 'Append to the end instead of overwriting (default: false)' },
        },
        required: ['spreadsheet_id', 'data'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const sheets = await getSheetsClient();
          const spreadsheetId = String(args.spreadsheet_id);
          const range = String(args.range || 'Sheet1!A1');
          const append = args.append === true;

          let rows: unknown[][];
          try {
            rows = JSON.parse(String(args.data));
            if (!Array.isArray(rows)) throw new Error('Data must be a JSON array of rows');
          } catch {
            return { error: 'Invalid data format. Provide a JSON array of rows, e.g., [["John",100],["Jane",200]]' };
          }

          if (append) {
            await sheets.spreadsheets.values.append({
              spreadsheetId,
              range,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: rows },
            });
          } else {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: rows },
            });
          }

          log.info('sheets_write', { spreadsheetId, rows: rows.length, append, trace_id: traceId });
          return { success: true, rowsWritten: rows.length, range, append, source: 'google_sheets' };
        } catch (err) {
          return { error: `Failed to write spreadsheet: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. List Spreadsheets ──
    {
      name: 'sheets_list',
      description: 'List recent Google Spreadsheets from your Drive.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default: 10)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          // Use Drive API to list spreadsheets (googleapis already available)
          const sheets = await getSheetsClient();
          // Access the underlying auth client to create a Drive client
          const auth = (sheets as any)._options?.auth;
          if (!auth) return { error: 'Could not get auth client for Drive API' };

          const drive = google.drive({ version: 'v3', auth });
          const maxResults = Math.min(Number(args.limit) || 10, 25);

          const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
            pageSize: maxResults,
            fields: 'files(id,name,createdTime,modifiedTime,webViewLink)',
            orderBy: 'modifiedTime desc',
          });

          const files = (res.data.files || []).map(f => ({
            id: f.id,
            name: f.name,
            url: f.webViewLink,
            created: f.createdTime,
            modified: f.modifiedTime,
          }));

          log.info('sheets_list', { count: files.length, trace_id: traceId });
          return { success: true, spreadsheets: files, count: files.length, source: 'google_drive' };
        } catch (err) {
          return { error: `Failed to list spreadsheets: ${(err as Error).message}` };
        }
      },
    },
  ];
}
