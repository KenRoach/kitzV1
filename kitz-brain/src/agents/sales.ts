/**
 * Sales agent — CRM analysis via LLM, follow-up drafts.
 * Called by daily cron. Produces structured sales report.
 */

import { llmHubClient } from '../llm/hubClient.js';
import { toolRegistry } from '../tools/registry.js';

export interface SalesReport {
  date: string;
  leadsReviewed: number;
  warmLeads: string[];
  followUpsDrafted: number;
  summary: string;
}

export const salesAgent = {
  name: 'Sales',

  async run(traceId: string): Promise<SalesReport> {
    const date = new Date().toISOString().slice(0, 10);

    // 1. Get CRM lead summary from kitz_os
    let leadsData: Record<string, unknown> = {};
    try {
      leadsData = (await toolRegistry.invoke('crm.getLeadsSummary', { window: '24h' }, traceId)) as Record<string, unknown>;
    } catch {
      leadsData = { leads: [], total: 0 };
    }

    const leads = Array.isArray(leadsData.leads) ? leadsData.leads : [];
    const warmLeads = leads
      .filter((l: any) => l?.status === 'warm' || l?.score > 50)
      .map((l: any) => String(l?.name || l?.contact || 'unknown'))
      .slice(0, 10);

    // 2. Ask LLM to produce daily sales analysis
    let summary = '';
    try {
      const response = await llmHubClient.complete(
        'summarizing',
        `Analyze today's sales pipeline. Warm leads: ${warmLeads.length}. Total leads reviewed: ${leads.length}. ` +
          `Warm lead names: ${warmLeads.join(', ') || 'none'}. ` +
          `Write a 2-3 sentence daily sales brief focused on priorities and follow-up actions.`,
        traceId,
      );
      summary = (response as { text?: string })?.text || 'Sales review completed.';
    } catch {
      summary = `Sales pipeline reviewed: ${leads.length} leads, ${warmLeads.length} warm. Follow-ups pending.`;
    }

    // 3. Create follow-up tasks for warm leads
    let followUpsDrafted = 0;
    for (const lead of warmLeads.slice(0, 5)) {
      try {
        await toolRegistry.invoke('crm.createTask', {
          title: `Follow up with ${lead}`,
          dueDate: 'today',
        }, traceId);
        followUpsDrafted++;
      } catch {
        // continue on task creation failure
      }
    }

    return {
      date,
      leadsReviewed: leads.length,
      warmLeads,
      followUpsDrafted,
      summary,
    };
  },
};
