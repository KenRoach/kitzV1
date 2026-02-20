/**
 * OpenClaw Bridge — Connects local KITZ OS to deployed Supabase OpenClaw.
 *
 * Submits runs, checks status, approves/cancels via Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export interface OpenClawRunConfig {
  businessId: string;
  goal: string;
  agentType?: string;
  mode: 'auto' | 'supervised';
  maxLoops?: number;
}

export class OpenClawBridge {
  async submitRun(config: OpenClawRunConfig): Promise<{ runId: string }> {
    const sb = getSupabase();
    if (!sb) return { runId: `local-${crypto.randomUUID()}` };

    const { data, error } = await sb
      .from('openclaw_runs')
      .insert({
        business_id: config.businessId,
        goal: config.goal,
        agent_type: config.agentType,
        mode: config.mode,
        status: 'pending',
        triggered_by: 'kitz_os',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[openclawBridge] submitRun error:', error.message);
      return { runId: `local-${crypto.randomUUID()}` };
    }

    return { runId: data.id };
  }

  async getRun(runId: string): Promise<unknown> {
    const sb = getSupabase();
    if (!sb) return null;

    const { data } = await sb
      .from('openclaw_runs')
      .select('*')
      .eq('id', runId)
      .single();

    return data;
  }

  async listRuns(filters?: { status?: string; limit?: number }): Promise<unknown[]> {
    const sb = getSupabase();
    if (!sb) return [];

    let query = sb
      .from('openclaw_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 20);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data } = await query;
    return data || [];
  }

  async approveRun(runId: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;

    await sb
      .from('openclaw_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', runId);
  }

  async cancelRun(runId: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;

    await sb
      .from('openclaw_runs')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', runId);
  }
}
