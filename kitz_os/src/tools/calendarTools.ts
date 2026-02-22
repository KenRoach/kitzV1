/**
 * Calendar Tools — Full Google Calendar CRUD via WhatsApp.
 *
 * Tools:
 *   1. calendar_listEvents   — List upcoming events (default 7 days)
 *   2. calendar_addEvent     — Create a new event
 *   3. calendar_updateEvent  — Update an existing event
 *   4. calendar_deleteEvent  — Delete an event
 *   5. calendar_findSlot     — Find free time slots
 *   6. calendar_addTask      — Create an all-day task/reminder
 *   7. calendar_today        — Quick view of today's schedule
 *
 * All tools auto-detect timezone from env (default: America/Panama).
 */

import type { ToolSchema } from './registry.js';
import {
  isGoogleOAuthConfigured,
  hasStoredTokens,
  getCalendarClient,
  getAuthUrl,
} from '../auth/googleOAuth.js';

const TIMEZONE = process.env.TZ || 'America/Panama';
const SETUP_MSG = 'Google Calendar not connected. Visit the setup link to connect your calendar.';

// ── Helpers ──

/** Check auth state and return error object if not ready. */
async function checkAuth(): Promise<{ error: string; setup_url?: string } | null> {
  if (!isGoogleOAuthConfigured()) {
    return {
      error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
    };
  }
  if (!(await hasStoredTokens())) {
    return {
      error: SETUP_MSG,
      setup_url: getAuthUrl(),
    };
  }
  return null;
}

/** Format a Google Calendar event for WhatsApp display. */
function formatEvent(event: any): string {
  const title = event.summary || '(no title)';
  const start = event.start?.dateTime || event.start?.date || '';
  const end = event.end?.dateTime || event.end?.date || '';
  const location = event.location || '';
  const description = event.description || '';

  // Parse dates
  let timeStr = '';
  if (event.start?.dateTime) {
    const s = new Date(event.start.dateTime);
    const e = new Date(event.end.dateTime);
    const dateStr = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TIMEZONE });
    const startTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE });
    const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE });
    timeStr = `${dateStr} ${startTime}–${endTime}`;
  } else if (event.start?.date) {
    const s = new Date(event.start.date + 'T00:00:00');
    timeStr = `${s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (All day)`;
  }

  let result = `• *${title}*\n  ${timeStr}`;
  if (location) result += `\n  📍 ${location}`;
  if (description) result += `\n  ${description.slice(0, 100)}`;
  return result;
}

/** Build RFC 3339 datetime from date + time strings. */
function buildDateTime(date: string, time?: string): string {
  if (!time) return date; // All-day event
  // Handle various time formats
  const cleanTime = time.replace(/\s?(am|pm)/i, (_, m) => ` ${m.toUpperCase()}`);
  const dt = new Date(`${date}T${to24h(cleanTime)}`);
  return dt.toISOString();
}

/** Convert 12h or 24h time string to HH:MM format. */
function to24h(time: string): string {
  // Already 24h format like "14:30"
  if (/^\d{1,2}:\d{2}$/.test(time.trim())) return time.trim().padStart(5, '0');
  // 12h format like "2:30 PM"
  const match = time.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (!match) return time;
  let h = parseInt(match[1], 10);
  const m = match[2] || '00';
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

// ── Tools ──

export function getAllCalendarTools(): ToolSchema[] {
  return [
    // 1. LIST EVENTS
    {
      name: 'calendar_listEvents',
      description: 'List upcoming Google Calendar events. Default: next 7 days. Can filter by query.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days ahead to check (default 7)' },
          query: { type: 'string', description: 'Search query to filter events by title/description' },
          max_results: { type: 'number', description: 'Max events to return (default 20)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const cal = await getCalendarClient();
          const days = (args.days as number) || 7;
          const now = new Date();
          const until = new Date(now.getTime() + days * 86400000);

          const res = await cal.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: until.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: (args.max_results as number) || 20,
            q: (args.query as string) || undefined,
          });

          const events = res.data.items || [];
          if (events.length === 0) {
            return { message: `No events found in the next ${days} days.`, count: 0 };
          }

          return {
            count: events.length,
            period: `Next ${days} days`,
            events: events.map(e => ({
              id: e.id,
              title: e.summary,
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              location: e.location || null,
              description: e.description?.slice(0, 200) || null,
              status: e.status,
              htmlLink: e.htmlLink,
            })),
            formatted: events.map(formatEvent).join('\n\n'),
          };
        } catch (err) {
          if ((err as Error).message === 'NOT_AUTHENTICATED') return { error: SETUP_MSG, setup_url: getAuthUrl() };
          return { error: `Calendar error: ${(err as Error).message}` };
        }
      },
    },

    // 2. ADD EVENT
    {
      name: 'calendar_addEvent',
      description: 'Create a new Google Calendar event. Supports timed events, all-day events, location, description, and attendees.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title/summary' },
          date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
          time: { type: 'string', description: 'Start time (e.g. "2:30 PM" or "14:30"). Omit for all-day event.' },
          duration_minutes: { type: 'number', description: 'Duration in minutes (default 60)' },
          end_date: { type: 'string', description: 'End date for multi-day events (YYYY-MM-DD)' },
          description: { type: 'string', description: 'Event description/notes' },
          location: { type: 'string', description: 'Event location' },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'Email addresses of attendees',
          },
          reminder_minutes: { type: 'number', description: 'Reminder N minutes before (default 30)' },
          color: { type: 'string', description: 'Event color ID (1-11). 1=lavender, 2=sage, 4=flamingo, 5=banana, 9=blueberry, 11=tomato' },
        },
        required: ['title', 'date'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const cal = await getCalendarClient();
          const title = args.title as string;
          const date = args.date as string;
          const time = args.time as string | undefined;
          const duration = (args.duration_minutes as number) || 60;

          let eventBody: any = {
            summary: title,
            description: (args.description as string) || undefined,
            location: (args.location as string) || undefined,
            colorId: (args.color as string) || undefined,
          };

          if (time) {
            // Timed event
            const startDt = buildDateTime(date, time);
            const endDt = new Date(new Date(startDt).getTime() + duration * 60000).toISOString();
            eventBody.start = { dateTime: startDt, timeZone: TIMEZONE };
            eventBody.end = { dateTime: endDt, timeZone: TIMEZONE };
          } else {
            // All-day event
            const endDate = (args.end_date as string) || date;
            // Google Calendar all-day end is exclusive, so add 1 day
            const end = new Date(endDate + 'T00:00:00');
            end.setDate(end.getDate() + 1);
            eventBody.start = { date };
            eventBody.end = { date: end.toISOString().split('T')[0] };
          }

          // Attendees
          const attendees = args.attendees as string[] | undefined;
          if (attendees?.length) {
            eventBody.attendees = attendees.map(email => ({ email }));
          }

          // Reminder
          const reminderMin = (args.reminder_minutes as number) ?? 30;
          eventBody.reminders = {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: reminderMin }],
          };

          const res = await cal.events.insert({
            calendarId: 'primary',
            requestBody: eventBody,
            sendUpdates: attendees?.length ? 'all' : 'none',
          });

          const created = res.data;
          return {
            status: 'created',
            id: created.id,
            title: created.summary,
            start: created.start?.dateTime || created.start?.date,
            end: created.end?.dateTime || created.end?.date,
            link: created.htmlLink,
            message: `Event "${title}" created successfully.`,
          };
        } catch (err) {
          if ((err as Error).message === 'NOT_AUTHENTICATED') return { error: SETUP_MSG, setup_url: getAuthUrl() };
          return { error: `Failed to create event: ${(err as Error).message}` };
        }
      },
    },

    // 3. UPDATE EVENT
    {
      name: 'calendar_updateEvent',
      description: 'Update an existing Google Calendar event. Provide the event ID and fields to change.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'Event ID to update (from calendar_listEvents)' },
          title: { type: 'string', description: 'New title' },
          date: { type: 'string', description: 'New start date (YYYY-MM-DD)' },
          time: { type: 'string', description: 'New start time' },
          duration_minutes: { type: 'number', description: 'New duration in minutes' },
          description: { type: 'string', description: 'New description' },
          location: { type: 'string', description: 'New location' },
          color: { type: 'string', description: 'New color ID (1-11)' },
        },
        required: ['event_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const cal = await getCalendarClient();
          const eventId = args.event_id as string;

          // Get existing event first
          const existing = await cal.events.get({ calendarId: 'primary', eventId });
          const event = existing.data;

          // Apply updates
          if (args.title) event.summary = args.title as string;
          if (args.description !== undefined) event.description = args.description as string;
          if (args.location !== undefined) event.location = args.location as string;
          if (args.color) event.colorId = args.color as string;

          // Date/time updates
          if (args.date || args.time) {
            const date = (args.date as string) || event.start?.dateTime?.split('T')[0] || event.start?.date || '';
            const time = args.time as string | undefined;
            const duration = (args.duration_minutes as number) || 60;

            if (time) {
              const startDt = buildDateTime(date, time);
              const endDt = new Date(new Date(startDt).getTime() + duration * 60000).toISOString();
              event.start = { dateTime: startDt, timeZone: TIMEZONE };
              event.end = { dateTime: endDt, timeZone: TIMEZONE };
            } else if (args.date) {
              event.start = { date };
              const end = new Date(date + 'T00:00:00');
              end.setDate(end.getDate() + 1);
              event.end = { date: end.toISOString().split('T')[0] };
            }
          }

          const res = await cal.events.update({
            calendarId: 'primary',
            eventId,
            requestBody: event,
          });

          return {
            status: 'updated',
            id: res.data.id,
            title: res.data.summary,
            start: res.data.start?.dateTime || res.data.start?.date,
            message: `Event "${res.data.summary}" updated.`,
          };
        } catch (err) {
          if ((err as Error).message === 'NOT_AUTHENTICATED') return { error: SETUP_MSG, setup_url: getAuthUrl() };
          return { error: `Failed to update event: ${(err as Error).message}` };
        }
      },
    },

    // 4. DELETE EVENT
    {
      name: 'calendar_deleteEvent',
      description: 'Delete a Google Calendar event by ID.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'Event ID to delete (from calendar_listEvents)' },
        },
        required: ['event_id'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const cal = await getCalendarClient();
          const eventId = args.event_id as string;

          // Get event details before deleting (for confirmation message)
          let eventTitle = eventId;
          try {
            const existing = await cal.events.get({ calendarId: 'primary', eventId });
            eventTitle = existing.data.summary || eventId;
          } catch {}

          await cal.events.delete({ calendarId: 'primary', eventId });

          return {
            status: 'deleted',
            id: eventId,
            message: `Event "${eventTitle}" deleted.`,
          };
        } catch (err) {
          if ((err as Error).message === 'NOT_AUTHENTICATED') return { error: SETUP_MSG, setup_url: getAuthUrl() };
          return { error: `Failed to delete event: ${(err as Error).message}` };
        }
      },
    },

    // 5. FIND FREE SLOTS
    {
      name: 'calendar_findSlot',
      description: 'Find free time slots in the calendar. Useful for scheduling meetings.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to check (YYYY-MM-DD). Default: today.' },
          duration_minutes: { type: 'number', description: 'Desired slot duration in minutes (default 60)' },
          start_hour: { type: 'number', description: 'Earliest hour to consider (default 8 = 8 AM)' },
          end_hour: { type: 'number', description: 'Latest hour to consider (default 18 = 6 PM)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const cal = await getCalendarClient();
          const date = (args.date as string) || new Date().toISOString().split('T')[0];
          const duration = (args.duration_minutes as number) || 60;
          const startHour = (args.start_hour as number) || 8;
          const endHour = (args.end_hour as number) || 18;

          const dayStart = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00`);
          const dayEnd = new Date(`${date}T${String(endHour).padStart(2, '0')}:00:00`);

          // Get all events for the day
          const res = await cal.events.list({
            calendarId: 'primary',
            timeMin: dayStart.toISOString(),
            timeMax: dayEnd.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = (res.data.items || [])
            .filter(e => e.start?.dateTime) // Only timed events
            .map(e => ({
              start: new Date(e.start!.dateTime!).getTime(),
              end: new Date(e.end!.dateTime!).getTime(),
            }))
            .sort((a, b) => a.start - b.start);

          // Find gaps
          const slots: { start: string; end: string }[] = [];
          let cursor = dayStart.getTime();
          const durationMs = duration * 60000;

          for (const event of events) {
            if (event.start - cursor >= durationMs) {
              slots.push({
                start: new Date(cursor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE }),
                end: new Date(cursor + durationMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE }),
              });
            }
            cursor = Math.max(cursor, event.end);
          }

          // Check gap after last event
          if (dayEnd.getTime() - cursor >= durationMs) {
            slots.push({
              start: new Date(cursor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE }),
              end: new Date(cursor + durationMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE }),
            });
          }

          if (slots.length === 0) {
            return { message: `No free ${duration}-minute slots on ${date} between ${startHour}:00 and ${endHour}:00.`, slots: [] };
          }

          return {
            date,
            duration_minutes: duration,
            available_slots: slots,
            count: slots.length,
            formatted: slots.map(s => `  ${s.start} – ${s.end}`).join('\n'),
          };
        } catch (err) {
          if ((err as Error).message === 'NOT_AUTHENTICATED') return { error: SETUP_MSG, setup_url: getAuthUrl() };
          return { error: `Failed to find slots: ${(err as Error).message}` };
        }
      },
    },

    // 6. ADD TASK (all-day reminder)
    {
      name: 'calendar_addTask',
      description: 'Add a task or reminder as an all-day calendar event. Use for to-dos, deadlines, and reminders.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task/reminder title' },
          date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          description: { type: 'string', description: 'Task details/notes' },
          reminder_minutes: { type: 'number', description: 'Reminder N minutes before midnight (default: 480 = 8 AM)' },
          color: { type: 'string', description: 'Color ID (1-11). 5=banana (yellow) is good for tasks.' },
        },
        required: ['title', 'date'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const cal = await getCalendarClient();
          const title = `📋 ${args.title as string}`;
          const date = args.date as string;

          const end = new Date(date + 'T00:00:00');
          end.setDate(end.getDate() + 1);

          const res = await cal.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: title,
              description: (args.description as string) || undefined,
              start: { date },
              end: { date: end.toISOString().split('T')[0] },
              colorId: (args.color as string) || '5', // Banana yellow for tasks
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: (args.reminder_minutes as number) ?? 480 },
                ],
              },
              transparency: 'transparent', // Tasks don't block time
            },
          });

          return {
            status: 'created',
            id: res.data.id,
            title: res.data.summary,
            date,
            message: `Task "${args.title}" added for ${date}.`,
          };
        } catch (err) {
          if ((err as Error).message === 'NOT_AUTHENTICATED') return { error: SETUP_MSG, setup_url: getAuthUrl() };
          return { error: `Failed to add task: ${(err as Error).message}` };
        }
      },
    },

    // 7. TODAY'S SCHEDULE
    {
      name: 'calendar_today',
      description: 'Quick view of today\'s schedule — all events and tasks for today.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const cal = await getCalendarClient();
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(todayStart.getTime() + 86400000);

          const res = await cal.events.list({
            calendarId: 'primary',
            timeMin: todayStart.toISOString(),
            timeMax: todayEnd.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = res.data.items || [];
          if (events.length === 0) {
            return { message: 'No events today. Your day is clear!', count: 0, events: [] };
          }

          // Separate timed events and all-day events
          const timed = events.filter(e => e.start?.dateTime);
          const allDay = events.filter(e => e.start?.date && !e.start?.dateTime);

          return {
            count: events.length,
            timed_count: timed.length,
            allday_count: allDay.length,
            events: events.map(e => ({
              id: e.id,
              title: e.summary,
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              location: e.location || null,
              allDay: !e.start?.dateTime,
            })),
            formatted: events.map(formatEvent).join('\n\n'),
          };
        } catch (err) {
          if ((err as Error).message === 'NOT_AUTHENTICATED') return { error: SETUP_MSG, setup_url: getAuthUrl() };
          return { error: `Failed to get today's schedule: ${(err as Error).message}` };
        }
      },
    },
  ];
}
