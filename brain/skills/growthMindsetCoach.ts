/**
 * Growth Mindset Coach — Carol Dweck's Mindset + James Clear's Atomic Habits.
 *
 * Dweck frameworks (PKB-218 through PKB-222):
 *  - Fixed vs Growth Mindset identification
 *  - "Not yet" reframing
 *  - Effort-based praise methodology
 *  - 10 Big Ideas from Mindset
 *
 * Clear frameworks (PKB-248):
 *  - 1% better daily compound effect
 *  - Systems > Goals
 *  - Identity-based habits
 *  - Four Laws: Make it obvious, attractive, easy, satisfying
 *  - Habit stacking
 *  - Environment design
 *
 * Source: KB_FOUNDER_MINDSET.md
 */

import type { LLMClient } from './callTranscription.js';

export interface MindsetAssessment {
  current_mindset: 'fixed' | 'growth' | 'mixed';
  fixed_patterns: string[];
  growth_opportunities: string[];
  reframes: Array<{ fixed_thought: string; growth_reframe: string }>;
  habit_plan: Array<{
    habit: string;
    cue: string;
    craving: string;
    response: string;
    reward: string;
    stack_after?: string;
  }>;
  identity_shift: string;
  daily_1_percent: string[];
  reflection_prompts: string[];
}

export interface MindsetOptions {
  challenge: string;
  current_habits?: string;
  goal?: string;
  blockers?: string;
  language?: string;
}

const SYSTEM =
  'You are a mindset and habits coach combining Carol Dweck\'s Growth Mindset with James Clear\'s Atomic Habits. ' +
  'DWECK: (1) Identify fixed mindset triggers. (2) Reframe to growth ("not yet"). (3) Praise effort, not talent. ' +
  '(4) Embrace challenges as learning. (5) See failure as information. ' +
  'CLEAR: (1) Systems > Goals — focus on process. (2) Identity-based habits — "I am the type of person who...". ' +
  '(3) Four Laws — Make it obvious (cue), attractive (craving), easy (response), satisfying (reward). ' +
  '(4) Habit stacking — "After I [CURRENT HABIT], I will [NEW HABIT]." (5) 1% daily improvement compounds. ' +
  '(6) Environment design — make good habits obvious, bad habits invisible. ' +
  'Context: SMB founders in Latin America. Practical, actionable, no fluff. Default language: Spanish.';

export async function coachMindset(options: MindsetOptions, llmClient?: LLMClient): Promise<MindsetAssessment> {
  if (llmClient) {
    const prompt = `Coach this founder on mindset and habits:\nChallenge: "${options.challenge}"\n` +
      `Current habits: ${options.current_habits ?? 'unknown'}\nGoal: ${options.goal ?? 'general growth'}\n` +
      `Blockers: ${options.blockers ?? 'none stated'}\nLanguage: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "current_mindset": "fixed"|"growth"|"mixed", "fixed_patterns": ["string"], ' +
      '"growth_opportunities": ["string"], "reframes": [{ "fixed_thought": string, "growth_reframe": string }], ' +
      '"habit_plan": [{ "habit": string, "cue": string, "craving": string, "response": string, "reward": string, "stack_after": string }], ' +
      '"identity_shift": string, "daily_1_percent": ["string"], "reflection_prompts": ["string"] }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as MindsetAssessment; } catch { /* fall through */ }
  }
  return {
    current_mindset: 'mixed',
    fixed_patterns: ['[Assessment unavailable — no LLM]'],
    growth_opportunities: ['Reframe challenges as learning opportunities'],
    reframes: [{ fixed_thought: 'I can\'t do this', growth_reframe: 'I can\'t do this YET' }],
    habit_plan: [{ habit: 'Daily reflection', cue: 'After morning coffee', craving: 'Clarity', response: '5 min journal', reward: 'Progress feeling' }],
    identity_shift: 'I am the type of person who learns from every setback',
    daily_1_percent: ['Read 10 pages', 'One sales call', 'Review one metric'],
    reflection_prompts: ['What did I learn today?', 'Where did I avoid a challenge?'],
  };
}
