/**
 * Sales Funnel Tools — Pipeline stages, lead scoring, and funnel analytics.
 *
 * 6 tools:
 *   - funnel_defineStages       (medium) — Define/update funnel stages for the business
 *   - funnel_moveContact        (medium) — Move a contact to a new funnel stage
 *   - funnel_scoreLeads         (medium) — AI-powered lead scoring via Claude
 *   - funnel_getStatus          (low)    — Get current funnel/pipeline snapshot
 *   - funnel_suggestNextAction  (low)    — AI suggests next action for a lead
 *   - funnel_stageReport        (low)    — Conversion report across funnel stages
 *
 * Funnel stages are stored in CRM contact tags with prefix "stage:".
 * Lead scores stored in contact.lead_score field.
 * All mutations are draft-first safe — they update CRM data, not send messages.
 */

import type { ToolSchema } from './registry.js';

/** Default funnel stages for KITZ SMB users */
const DEFAULT_STAGES = [
  { name: 'new-lead', order: 0, description: 'Just captured — no interaction yet' },
  { name: 'contacted', order: 1, description: 'First outreach sent (WA/email/SMS)' },
  { name: 'engaged', order: 2, description: 'Responded or opened content' },
  { name: 'qualified', order: 3, description: 'Confirmed interest, fit assessed' },
  { name: 'proposal-sent', order: 4, description: 'Quote or checkout link sent' },
  { name: 'negotiation', order: 5, description: 'Discussing terms, pricing, or customization' },
  { name: 'closed-won', order: 6, description: 'Deal closed — order placed' },
  { name: 'closed-lost', order: 7, description: 'Deal lost — reason tracked' },
];

// In-memory stage config (per-org in production via Supabase)
let currentStages = [...DEFAULT_STAGES];

export function getAllSalesFunnelTools(): ToolSchema[] {
  return [
    // ── funnel_defineStages ──
    {
      name: 'funnel_defineStages',
      description:
        'Define or update the sales funnel stages for this business. ' +
        'Default stages: new-lead → contacted → engaged → qualified → proposal-sent → negotiation → closed-won/lost.',
      parameters: {
        type: 'object',
        properties: {
          stages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Stage slug (e.g., "qualified")' },
                order: { type: 'number', description: 'Sort order (0-based)' },
                description: { type: 'string', description: 'What this stage means' },
              },
              required: ['name', 'order'],
            },
            description: 'Array of funnel stages in order',
          },
          reset_to_default: {
            type: 'boolean',
            description: 'Reset to default KITZ stages (ignores stages array)',
          },
        },
      },
      riskLevel: 'medium',
      execute: async (args) => {
        if (args.reset_to_default) {
          currentStages = [...DEFAULT_STAGES];
          return { stages: currentStages, message: 'Reset to default 8-stage funnel.' };
        }

        const stages = args.stages as Array<{ name: string; order: number; description?: string }>;
        if (!stages || !Array.isArray(stages) || stages.length < 2) {
          return { error: 'At least 2 funnel stages are required.' };
        }

        currentStages = stages
          .map((s) => ({
            name: String(s.name).toLowerCase().replace(/\s+/g, '-'),
            order: Number(s.order),
            description: String(s.description || ''),
          }))
          .sort((a, b) => a.order - b.order);

        return {
          stages: currentStages,
          count: currentStages.length,
          message: `Funnel updated: ${currentStages.map((s) => s.name).join(' → ')}`,
        };
      },
    },

    // ── funnel_moveContact ──
    {
      name: 'funnel_moveContact',
      description:
        'Move a CRM contact to a new funnel stage. Updates the contact\'s tags with the stage prefix. ' +
        'Tracks stage history in contact notes.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact UUID' },
          new_stage: { type: 'string', description: 'Target stage slug (e.g., "qualified")' },
          reason: { type: 'string', description: 'Why this contact moved (e.g., "responded to outreach")' },
          lost_reason: {
            type: 'string',
            description: 'Reason for closed-lost (only if new_stage is "closed-lost")',
          },
        },
        required: ['contact_id', 'new_stage'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const contactId = String(args.contact_id);
        const newStage = String(args.new_stage).toLowerCase().replace(/\s+/g, '-');
        const reason = (args.reason as string) || '';
        const lostReason = (args.lost_reason as string) || '';

        const validStage = currentStages.find((s) => s.name === newStage);
        if (!validStage) {
          return {
            error: `Invalid stage "${newStage}". Valid stages: ${currentStages.map((s) => s.name).join(', ')}`,
          };
        }

        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');

          // Get current contact to read existing tags
          const contact = (await callWorkspaceMcp('get_contact', { contact_id: contactId }, traceId)) as Record<
            string,
            unknown
          >;
          if (!contact || contact.error) {
            return { error: `Contact ${contactId} not found.` };
          }

          // Remove old stage tags, add new one
          const existingTags = Array.isArray(contact.tags) ? (contact.tags as string[]) : [];
          const filteredTags = existingTags.filter((t) => !t.startsWith('stage:'));
          filteredTags.push(`stage:${newStage}`);

          // Build stage movement note
          const oldStageTag = existingTags.find((t) => t.startsWith('stage:'));
          const oldStage = oldStageTag ? oldStageTag.replace('stage:', '') : 'unknown';
          const timestamp = new Date().toISOString().split('T')[0];
          const moveNote = `[${timestamp}] ${oldStage} → ${newStage}${reason ? `: ${reason}` : ''}${lostReason ? ` (lost: ${lostReason})` : ''}`;

          const existingNotes = String(contact.notes || '');
          const updatedNotes = existingNotes
            ? `${existingNotes}\n${moveNote}`
            : moveNote;

          // Update the contact
          await callWorkspaceMcp(
            'update_contact',
            {
              contact_id: contactId,
              tags: filteredTags,
              notes: updatedNotes,
              status: newStage === 'closed-won' ? 'active' : newStage === 'closed-lost' ? 'inactive' : contact.status,
            },
            traceId,
          );

          return {
            contact_id: contactId,
            previous_stage: oldStage,
            new_stage: newStage,
            reason,
            lost_reason: lostReason || undefined,
            message: `Moved ${contact.name || contactId}: ${oldStage} → ${newStage}`,
          };
        } catch (err) {
          return { error: `Stage move failed: ${(err as Error).message}` };
        }
      },
    },

    // ── funnel_scoreLeads ──
    {
      name: 'funnel_scoreLeads',
      description:
        'AI-powered lead scoring. Analyzes CRM contacts and assigns scores (0-100) based on engagement signals, ' +
        'business type, and interaction history. Updates lead_score field in CRM.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter contacts by status (default: "lead")' },
          limit: { type: 'number', description: 'Max leads to score (default: 20, max: 50)' },
        },
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const status = (args.status as string) || 'lead';
        const limit = Math.min(Number(args.limit) || 20, 50);

        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');
          const { claudeChat } = await import('../llm/claudeClient.js');

          const contacts = (await callWorkspaceMcp('list_contacts', { status, limit }, traceId)) as Array<
            Record<string, unknown>
          >;
          if (!Array.isArray(contacts) || contacts.length === 0) {
            return { message: `No contacts with status "${status}" found.`, scored: 0 };
          }

          // Batch score via Claude
          const contactSummary = contacts
            .map(
              (c) =>
                `- ${c.name || 'Unknown'} (${c.phone || 'no phone'}, ${c.email || 'no email'}) tags:[${(c.tags as string[])?.join(',') || ''}] notes:"${String(c.notes || '').slice(0, 100)}"`,
            )
            .join('\n');

          const scoringResult = await claudeChat(
            [
              {
                role: 'user',
                content: `Score these leads 0-100 for a LatAm SMB SaaS (KITZ).

Scoring criteria:
- Has phone (WhatsApp-ready): +20
- Has email: +10
- Has business-related tags: +15
- Has interaction notes: +15
- Recently active (notes mention recent dates): +20
- Business type mentioned: +10
- Multiple channels available: +10

Contacts:
${contactSummary}

Return JSON array: [{ "name": "...", "score": N, "tier": "hot|warm|cold", "reason": "..." }]
hot >= 70, warm >= 40, cold < 40.`,
              },
            ],
            'haiku',
            traceId,
            'You are a lead scoring engine. Return only valid JSON array.',
          );

          // Parse scores and update CRM
          let scores: Array<{ name: string; score: number; tier: string; reason: string }>;
          try {
            const cleaned = scoringResult.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            scores = JSON.parse(cleaned);
          } catch {
            return { error: 'Failed to parse scoring result.', raw: scoringResult };
          }

          // Update each contact's lead_score
          let updated = 0;
          for (const score of scores) {
            const match = contacts.find(
              (c) => String(c.name).toLowerCase() === score.name.toLowerCase(),
            );
            if (match?.id) {
              try {
                await callWorkspaceMcp(
                  'update_contact',
                  {
                    contact_id: String(match.id),
                    lead_score: String(score.score),
                  },
                  traceId,
                );
                updated++;
              } catch {
                // skip failed updates
              }
            }
          }

          return {
            scored: scores.length,
            updated,
            results: scores,
            summary: {
              hot: scores.filter((s) => s.tier === 'hot').length,
              warm: scores.filter((s) => s.tier === 'warm').length,
              cold: scores.filter((s) => s.tier === 'cold').length,
            },
          };
        } catch (err) {
          return { error: `Lead scoring failed: ${(err as Error).message}` };
        }
      },
    },

    // ── funnel_getStatus ──
    {
      name: 'funnel_getStatus',
      description:
        'Get the current sales funnel snapshot — how many contacts are in each stage, overall conversion rates.',
      parameters: {
        type: 'object',
        properties: {
          include_contacts: {
            type: 'boolean',
            description: 'Include contact names in each stage (default: false)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const includeContacts = Boolean(args.include_contacts);

        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');

          const contacts = (await callWorkspaceMcp(
            'list_contacts',
            { limit: 200 },
            traceId,
          )) as Array<Record<string, unknown>>;

          // Group by funnel stage
          const stageMap: Record<string, Array<Record<string, unknown>>> = {};
          for (const stage of currentStages) {
            stageMap[stage.name] = [];
          }
          stageMap['unassigned'] = [];

          for (const c of contacts) {
            const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
            const stageTag = tags.find((t) => t.startsWith('stage:'));
            const stageName = stageTag ? stageTag.replace('stage:', '') : 'unassigned';
            if (stageMap[stageName]) {
              stageMap[stageName].push(c);
            } else {
              stageMap['unassigned'].push(c);
            }
          }

          const stages = currentStages.map((s) => ({
            stage: s.name,
            order: s.order,
            count: stageMap[s.name].length,
            ...(includeContacts
              ? {
                  contacts: stageMap[s.name].slice(0, 10).map((c) => ({
                    name: c.name,
                    phone: c.phone,
                    score: c.lead_score,
                  })),
                }
              : {}),
          }));

          const total = contacts.length;
          const closedWon = stageMap['closed-won']?.length || 0;
          const closedLost = stageMap['closed-lost']?.length || 0;

          return {
            stages,
            unassigned: stageMap['unassigned'].length,
            total_contacts: total,
            conversion_rate: total > 0 ? `${Math.round((closedWon / total) * 100)}%` : '0%',
            win_rate:
              closedWon + closedLost > 0
                ? `${Math.round((closedWon / (closedWon + closedLost)) * 100)}%`
                : 'N/A',
            defined_stages: currentStages.map((s) => s.name),
          };
        } catch (err) {
          return { error: `Funnel status failed: ${(err as Error).message}` };
        }
      },
    },

    // ── funnel_suggestNextAction ──
    {
      name: 'funnel_suggestNextAction',
      description:
        'AI suggests the next best action for a lead based on their funnel stage, score, and history. ' +
        'Returns recommended channel, message type, and timing.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact UUID' },
        },
        required: ['contact_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const contactId = String(args.contact_id);

        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');
          const { claudeChat } = await import('../llm/claudeClient.js');

          const contact = (await callWorkspaceMcp(
            'get_contact',
            { contact_id: contactId },
            traceId,
          )) as Record<string, unknown>;
          if (!contact || contact.error) {
            return { error: `Contact ${contactId} not found.` };
          }

          const tags = Array.isArray(contact.tags) ? (contact.tags as string[]) : [];
          const stageTag = tags.find((t) => t.startsWith('stage:'));
          const stage = stageTag ? stageTag.replace('stage:', '') : 'unassigned';
          const score = contact.lead_score || 'unknown';

          const suggestion = await claudeChat(
            [
              {
                role: 'user',
                content: `Suggest the next best action for this lead.

Contact: ${contact.name} (${contact.phone || 'no phone'}, ${contact.email || 'no email'})
Stage: ${stage}
Score: ${score}
Tags: ${tags.join(', ')}
Notes: ${String(contact.notes || '').slice(0, 300)}

Return JSON: {
  "action": "send_whatsapp|send_email|send_sms|make_call|send_voice_note|create_quote|schedule_meeting|move_stage",
  "channel": "whatsapp|email|sms|voice",
  "message_brief": "2-sentence description of what to say",
  "timing": "now|tomorrow|in_3_days|next_week",
  "reason": "why this action",
  "suggested_stage": "stage to move to after action (if applicable)"
}`,
              },
            ],
            'haiku',
            traceId,
            'You are a sales advisor for LatAm SMBs. Return only valid JSON.',
          );

          try {
            const cleaned = suggestion.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return { contact: { name: contact.name, stage, score }, suggestion: parsed };
          } catch {
            return { contact: { name: contact.name, stage, score }, suggestion, raw: true };
          }
        } catch (err) {
          return { error: `Next action suggestion failed: ${(err as Error).message}` };
        }
      },
    },

    // ── funnel_stageReport ──
    {
      name: 'funnel_stageReport',
      description:
        'Generate a funnel conversion report showing drop-off between stages and recommendations.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'all'],
            description: 'Report period (default: all)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const period = (args.period as string) || 'all';

        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');
          const { claudeChat } = await import('../llm/claudeClient.js');

          const contacts = (await callWorkspaceMcp(
            'list_contacts',
            { limit: 200 },
            traceId,
          )) as Array<Record<string, unknown>>;

          // Count per stage
          const stageCounts: Record<string, number> = {};
          for (const stage of currentStages) {
            stageCounts[stage.name] = 0;
          }
          stageCounts['unassigned'] = 0;

          for (const c of contacts) {
            const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
            const stageTag = tags.find((t) => t.startsWith('stage:'));
            const stageName = stageTag ? stageTag.replace('stage:', '') : 'unassigned';
            stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
          }

          const report = await claudeChat(
            [
              {
                role: 'user',
                content: `Generate a sales funnel conversion report for a LatAm SMB.

Funnel data:
${currentStages.map((s) => `${s.name}: ${stageCounts[s.name] || 0} contacts`).join('\n')}
Unassigned: ${stageCounts['unassigned']}
Total contacts: ${contacts.length}
Period: ${period}

Include:
1. Stage-by-stage conversion rates
2. Biggest drop-off point
3. 3 actionable recommendations
4. Suggested automations (drip campaigns, follow-ups)

Keep it concise — 5-8 bullet points.`,
              },
            ],
            'haiku',
            traceId,
            'You are KITZ analytics. Generate concise funnel reports.',
          );

          return {
            report,
            data: stageCounts,
            total: contacts.length,
            period,
            stages: currentStages.map((s) => s.name),
          };
        } catch (err) {
          return { error: `Funnel report failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
