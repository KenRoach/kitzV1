/**
 * Homebrew Calendar Tools — Kitz's own calendar system.
 * Stores events in workspace DB (Supabase + in-memory fallback).
 * Independent of Google Calendar — Google remains optional sync.
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('homebrewCalendarTools');

const WORKSPACE_URL = process.env.WORKSPACE_URL || 'http://localhost:3001';
const SERVICE_SECRET = process.env.DEV_TOKEN_SECRET || '';

async function calendarFetch(path: string, method = 'GET', body?: unknown): Promise<unknown> {
  const url = `${WORKSPACE_URL}/api/workspace/calendar${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_SECRET}`,
      'x-user-id': 'system',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    return { error: `Calendar API error (${res.status}): ${text.slice(0, 200)}` };
  }
  return res.json();
}

export function getAllHomebrewCalendarTools(): ToolSchema[] {
  return [
    {
      name: 'kitz_calendar_list',
      description: 'List events from Kitz homebrew calendar. Supports date range filtering.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const params = new URLSearchParams();
        if (args.from) params.set('from', String(args.from));
        if (args.to) params.set('to', String(args.to));
        const result = await calendarFetch(`?${params}`);
        log.info('kitz_calendar_list', { trace_id: traceId });
        return result;
      },
    },
    {
      name: 'kitz_calendar_create',
      description: 'Create a new event in Kitz homebrew calendar.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          start_time: { type: 'string', description: 'Start time (ISO 8601)' },
          end_time: { type: 'string', description: 'End time (ISO 8601)' },
          all_day: { type: 'boolean', description: 'All-day event (default: false)' },
          type: { type: 'string', enum: ['call', 'meeting', 'task', 'follow-up', 'reminder', 'other'], description: 'Event type' },
          location: { type: 'string', description: 'Event location' },
          description: { type: 'string', description: 'Event description' },
          color: { type: 'string', description: 'Event color (hex)' },
          recurrence: { type: 'string', enum: ['', 'daily', 'weekly', 'monthly'], description: 'Recurrence pattern' },
        },
        required: ['title', 'start_time'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const result = await calendarFetch('', 'POST', args);
        log.info('kitz_calendar_create', { title: args.title, trace_id: traceId });
        return result;
      },
    },
    {
      name: 'kitz_calendar_update',
      description: 'Update an existing event in Kitz homebrew calendar.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Event ID to update' },
          title: { type: 'string' },
          start_time: { type: 'string' },
          end_time: { type: 'string' },
          type: { type: 'string' },
          location: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled'] },
        },
        required: ['id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const { id, ...updates } = args as Record<string, unknown>;
        const result = await calendarFetch(`/${id}`, 'PATCH', updates);
        log.info('kitz_calendar_update', { id, trace_id: traceId });
        return result;
      },
    },
    {
      name: 'kitz_calendar_delete',
      description: 'Delete an event from Kitz homebrew calendar.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Event ID to delete' },
        },
        required: ['id'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const result = await calendarFetch(`/${args.id}`, 'DELETE');
        log.info('kitz_calendar_delete', { id: args.id, trace_id: traceId });
        return result;
      },
    },
    {
      name: 'kitz_calendar_today',
      description: 'Get today\'s events from Kitz homebrew calendar.',
      parameters: { type: 'object', properties: {} },
      riskLevel: 'low',
      execute: async (_args, traceId) => {
        const today = new Date().toISOString().split('T')[0];
        const result = await calendarFetch(`?from=${today}&to=${today}`);
        log.info('kitz_calendar_today', { trace_id: traceId });
        return result;
      },
    },
    {
      name: 'kitz_calendar_findSlot',
      description: 'Find free time slots in Kitz homebrew calendar for a given date.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to check (YYYY-MM-DD, default: today)' },
          duration_minutes: { type: 'number', description: 'Desired slot duration in minutes (default: 60)' },
          start_hour: { type: 'number', description: 'Earliest hour to consider (default: 8)' },
          end_hour: { type: 'number', description: 'Latest hour to consider (default: 18)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const date = String(args.date || new Date().toISOString().split('T')[0]);
        const duration = Number(args.duration_minutes) || 60;
        const startHour = Number(args.start_hour) || 8;
        const endHour = Number(args.end_hour) || 18;

        const events = await calendarFetch(`?from=${date}&to=${date}`) as Array<Record<string, unknown>>;
        if (!Array.isArray(events)) return { error: 'Could not fetch events', slots: [] };

        // Find free slots
        const slots: Array<{ start: string; end: string }> = [];
        let current = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00`);
        const dayEnd = new Date(`${date}T${String(endHour).padStart(2, '0')}:00:00`);

        const busyRanges = events
          .filter((e: Record<string, unknown>) => e.status !== 'cancelled')
          .map((e: Record<string, unknown>) => ({ start: new Date(e.startTime as string || e.start_time as string), end: new Date(e.endTime as string || e.end_time as string) }))
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        for (const busy of busyRanges) {
          if (current < busy.start) {
            const gapMinutes = (busy.start.getTime() - current.getTime()) / 60000;
            if (gapMinutes >= duration) {
              slots.push({ start: current.toISOString(), end: busy.start.toISOString() });
            }
          }
          if (busy.end > current) current = busy.end;
        }
        if (current < dayEnd) {
          const gapMinutes = (dayEnd.getTime() - current.getTime()) / 60000;
          if (gapMinutes >= duration) {
            slots.push({ start: current.toISOString(), end: dayEnd.toISOString() });
          }
        }

        log.info('kitz_calendar_findSlot', { date, slots: slots.length, trace_id: traceId });
        return { date, duration_minutes: duration, available_slots: slots };
      },
    },
  ];
}
