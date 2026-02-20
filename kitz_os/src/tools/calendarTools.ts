/**
 * Calendar Tools — Google Calendar read + add.
 * Requires OAuth tokens stored in Supabase.
 */
import type { ToolSchema } from './registry.js';

export function getAllCalendarTools(): ToolSchema[] {
  return [
    {
      name: 'calendar_listEvents',
      description: 'List upcoming Google Calendar events (next 7 days by default)',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days ahead to check (default 7)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        return { status: 'not_configured', message: 'Google Calendar OAuth not set up yet. Connect at /setup/calendar.' };
      },
    },
    {
      name: 'calendar_addEvent',
      description: 'Add a new Google Calendar event',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          time: { type: 'string', description: 'Time in HH:MM format' },
          duration_minutes: { type: 'number', description: 'Duration in minutes (default 60)' },
          description: { type: 'string' },
        },
        required: ['title', 'date'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        return { status: 'not_configured', message: 'Google Calendar OAuth not set up yet. Connect at /setup/calendar.' };
      },
    },
  ];
}
