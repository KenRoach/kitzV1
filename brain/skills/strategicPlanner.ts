/**
 * Strategic Planner — Rumelt + Sun Tzu + Musashi + Machiavelli.
 *
 * Richard Rumelt — Good Strategy Bad Strategy (PKB-250):
 *  - Good strategy = Diagnosis + Guiding Policy + Coherent Actions
 *  - Bad strategy: fluff, refusing to choose, mistaking goals for strategy
 *
 * Sun Tzu — The Art of War (PKB-310 through PKB-313):
 *  - Know yourself and know your enemy → never defeated
 *  - Win without fighting (subdue enemy by strategy)
 *  - Speed, surprise, concentration of force
 *  - Terrain analysis (market positioning)
 *
 * Miyamoto Musashi — Book of Five Rings (PKB-323):
 *  - Earth (fundamentals), Water (adaptability), Fire (aggression),
 *    Wind (competitors), Void (transcendence/mastery)
 *
 * Machiavelli — The Prince (PKB-322):
 *  - Pragmatic leadership, fortune vs virtue, maintain power through results
 *
 * Source: KB_FOUNDER_MINDSET.md
 */

import type { LLMClient } from './callTranscription.js';

export interface StrategicPlan {
  diagnosis: string;
  guiding_policy: string;
  coherent_actions: string[];
  bad_strategy_check: string[];
  competitive_analysis: {
    your_strengths: string[];
    enemy_weaknesses: string[];
    terrain: string;
    timing: string;
  };
  five_rings: {
    earth: string;
    water: string;
    fire: string;
    wind: string;
    void: string;
  };
  power_moves: string[];
  risks: string[];
  timeline: Array<{ phase: string; actions: string[]; duration: string }>;
}

export interface StrategyOptions {
  objective: string;
  current_situation?: string;
  competitors?: string;
  resources?: string;
  constraints?: string;
  industry?: string;
  language?: string;
}

const SYSTEM =
  'You are a strategic advisor combining frameworks from the greatest strategists in history. ' +
  'RUMELT: Good strategy has 3 parts: (1) DIAGNOSIS — what\'s really going on? (2) GUIDING POLICY — overall approach to overcome obstacles. ' +
  '(3) COHERENT ACTIONS — coordinated steps that implement the policy. Bad strategy = fluff + failure to face the problem + goals disguised as strategy. ' +
  'SUN TZU: (1) Know yourself and your enemy. (2) Win without fighting when possible. (3) Speed and surprise beat brute force. ' +
  '(4) Attack weakness, avoid strength. (5) Choose your terrain (market positioning). (6) "All warfare is based on deception" — competitive misdirection. ' +
  'MUSASHI: (1) Earth — master fundamentals first. (2) Water — be adaptable, flow around obstacles. ' +
  '(3) Fire — fight with intensity when you engage. (4) Wind — study competitors thoroughly. (5) Void — transcend to mastery through practice. ' +
  'MACHIAVELLI: (1) Judge by results, not intentions. (2) Be both lion (force) and fox (cunning). ' +
  '(3) Fortune favors the prepared. (4) Maintain appearances while being pragmatic. ' +
  'Context: SMB founders in Latin America competing in real markets. Be ruthlessly practical. Default language: Spanish.';

export async function createStrategy(options: StrategyOptions, llmClient?: LLMClient): Promise<StrategicPlan> {
  if (llmClient) {
    const prompt = `Create a strategic plan:\nObjective: "${options.objective}"\n` +
      `Current situation: ${options.current_situation ?? 'unknown'}\nCompetitors: ${options.competitors ?? 'unknown'}\n` +
      `Resources: ${options.resources ?? 'limited (SMB)'}\nConstraints: ${options.constraints ?? 'none stated'}\n` +
      `Industry: ${options.industry ?? 'general'}\nLanguage: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "diagnosis": string, "guiding_policy": string, "coherent_actions": ["string"], ' +
      '"bad_strategy_check": ["string"], "competitive_analysis": { "your_strengths": ["string"], ' +
      '"enemy_weaknesses": ["string"], "terrain": string, "timing": string }, ' +
      '"five_rings": { "earth": string, "water": string, "fire": string, "wind": string, "void": string }, ' +
      '"power_moves": ["string"], "risks": ["string"], ' +
      '"timeline": [{ "phase": string, "actions": ["string"], "duration": string }] }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as StrategicPlan; } catch { /* fall through */ }
  }
  return {
    diagnosis: options.objective, guiding_policy: '[Strategy unavailable — no LLM]',
    coherent_actions: ['Define the real problem', 'Choose one guiding policy', 'Align all actions'],
    bad_strategy_check: ['Are you confusing goals with strategy?', 'Are you avoiding hard choices?'],
    competitive_analysis: { your_strengths: ['Identify yours'], enemy_weaknesses: ['Research theirs'], terrain: 'Assess your market', timing: 'Is now the right time?' },
    five_rings: { earth: 'Master your fundamentals', water: 'Stay adaptable', fire: 'Compete with intensity', wind: 'Study competitors', void: 'Aim for mastery' },
    power_moves: ['Concentrate force on one front'], risks: ['Spreading too thin'],
    timeline: [{ phase: 'Phase 1', actions: ['Diagnose', 'Decide policy'], duration: '1-2 weeks' }],
  };
}
