/**
 * Power Dynamics Advisor — Robert Greene's 4 masterworks applied to business.
 *
 * The 48 Laws of Power (PKB-314 through PKB-316):
 *  - 48 laws for navigating power dynamics
 *  - Never outshine the master, conceal intentions, win through actions
 *
 * The 33 Strategies of War (PKB-317 through PKB-318):
 *  - Offensive, defensive, unconventional warfare applied to business
 *  - Identify end-state before engaging
 *
 * The Laws of Human Nature (PKB-319):
 *  - Self-awareness, behavior decoding, influence without force
 *  - Emotional intelligence, reading people
 *
 * Mastery (PKB-320):
 *  - Apprenticeship → Creative-Active → Mastery progression
 *  - Deep practice, 10,000+ hours, finding your life's task
 *
 * Source: KB_FOUNDER_MINDSET.md
 */

import type { LLMClient } from './callTranscription.js';

export interface PowerAnalysis {
  situation_read: string;
  power_dynamics: Array<{ player: string; power_level: string; motivations: string; vulnerabilities: string }>;
  applicable_laws: Array<{ law_number: number; law: string; application: string; caution: string }>;
  strategy: {
    approach: string;
    offensive_moves: string[];
    defensive_moves: string[];
    unconventional_moves: string[];
  };
  human_nature_read: {
    their_emotional_state: string;
    hidden_motivations: string;
    influence_approach: string;
  };
  mastery_path?: {
    current_phase: string;
    next_milestone: string;
    practice_plan: string;
  };
  warnings: string[];
  action_plan: string[];
}

export interface PowerOptions {
  situation: string;
  players?: string;
  your_goal?: string;
  your_position?: 'stronger' | 'equal' | 'weaker' | 'unknown';
  context_type?: 'negotiation' | 'partnership' | 'competition' | 'team' | 'leadership';
  language?: string;
}

const SYSTEM =
  'You are a power dynamics advisor trained on Robert Greene\'s four masterworks. ' +
  '48 LAWS OF POWER: Key laws include: Never outshine the master (Law 1), Conceal your intentions (Law 3), ' +
  'Always say less than necessary (Law 4), Guard your reputation (Law 5), Win through actions not argument (Law 9), ' +
  'Learn to use enemies (Law 2), Make others come to you (Law 8), Crush your enemy totally (Law 15 — when needed), ' +
  'Use selective honesty (Law 12), Concentrate your forces (Law 23), Re-create yourself (Law 25). ' +
  '33 STRATEGIES OF WAR: Identify end-state first. Use unconventional approaches. Know when to retreat. ' +
  'Controlled aggression. Alliance strategy. Adapt or die. ' +
  'LAWS OF HUMAN NATURE: Read emotional patterns. Understand hidden motivations. Influence through empathy, not force. ' +
  'Everyone wears masks — look beneath. Manage your own shadow side. ' +
  'MASTERY: Find your life\'s task. Apprenticeship is essential. Creative-Active phase is where breakthroughs happen. ' +
  'Context: SMB founders navigating business relationships, partnerships, and competition in Latin America. ' +
  'Be strategic but ethical — power for building, not destroying. Default language: Spanish.';

export async function analyzePowerDynamics(options: PowerOptions, llmClient?: LLMClient): Promise<PowerAnalysis> {
  if (llmClient) {
    const prompt = `Analyze power dynamics in this situation:\n"${options.situation}"\n` +
      `Players: ${options.players ?? 'unknown'}\nYour goal: ${options.your_goal ?? 'unknown'}\n` +
      `Your position: ${options.your_position ?? 'unknown'}\nContext: ${options.context_type ?? 'general'}\n` +
      `Language: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "situation_read": string, "power_dynamics": [{ "player": string, "power_level": string, "motivations": string, "vulnerabilities": string }], ' +
      '"applicable_laws": [{ "law_number": number, "law": string, "application": string, "caution": string }], ' +
      '"strategy": { "approach": string, "offensive_moves": ["string"], "defensive_moves": ["string"], "unconventional_moves": ["string"] }, ' +
      '"human_nature_read": { "their_emotional_state": string, "hidden_motivations": string, "influence_approach": string }, ' +
      '"warnings": ["string"], "action_plan": ["string"] }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as PowerAnalysis; } catch { /* fall through */ }
  }
  return {
    situation_read: options.situation,
    power_dynamics: [],
    applicable_laws: [
      { law_number: 4, law: 'Always say less than necessary', application: 'Listen more, reveal less', caution: 'Don\'t appear secretive' },
      { law_number: 9, law: 'Win through actions, not argument', application: 'Demonstrate, don\'t debate', caution: 'Requires patience' },
    ],
    strategy: { approach: '[Analysis unavailable — no LLM]', offensive_moves: [], defensive_moves: ['Guard your reputation'], unconventional_moves: [] },
    human_nature_read: { their_emotional_state: 'Assess in person', hidden_motivations: 'Look beneath the surface', influence_approach: 'Lead with empathy' },
    warnings: ['Power without ethics is self-destructive'],
    action_plan: ['Map the players', 'Identify power imbalances', 'Choose your strategy'],
  };
}
