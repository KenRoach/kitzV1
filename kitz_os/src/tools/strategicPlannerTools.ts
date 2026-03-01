/**
 * Strategic Planner Tools — Rumelt + Sun Tzu + Musashi + Machiavelli.
 *
 * 1 tool:
 *   - strategy_plan (medium) — Create a strategic plan combining 4 master strategists
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('strategicPlannerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM = `You are a strategic advisor combining the greatest strategists in history.
RUMELT (Good Strategy Bad Strategy): (1) DIAGNOSIS — what's really going on. (2) GUIDING POLICY — overall approach. (3) COHERENT ACTIONS — coordinated steps. Bad strategy = fluff + avoiding the problem + goals disguised as strategy.
SUN TZU (Art of War): Know yourself and enemy. Win without fighting when possible. Speed and surprise beat force. Attack weakness, avoid strength. Choose terrain.
MUSASHI (Book of Five Rings): Earth (fundamentals), Water (adaptability), Fire (intensity), Wind (competitors), Void (mastery).
MACHIAVELLI (The Prince): Judge by results. Be both lion and fox. Fortune favors the prepared.
Context: SMB founders competing in LatAm markets. Be ruthlessly practical. Default language: Spanish.

Respond with valid JSON:
{ "diagnosis": string, "guiding_policy": string, "coherent_actions": ["string"],
  "bad_strategy_check": ["string"],
  "competitive_analysis": { "your_strengths": ["string"], "enemy_weaknesses": ["string"], "terrain": string, "timing": string },
  "five_rings": { "earth": string, "water": string, "fire": string, "wind": string, "void": string },
  "power_moves": ["string"], "risks": ["string"],
  "timeline": [{ "phase": string, "actions": ["string"], "duration": string }] }`;



export function getAllStrategicPlannerTools(): ToolSchema[] {
  return [{
    name: 'strategy_plan',
    description: 'Create a strategic plan combining Rumelt (diagnosis + guiding policy + actions), Sun Tzu (competitive positioning), Musashi (Five Rings fundamentals), and Machiavelli (pragmatic power). Returns full strategy with timeline.',
    parameters: {
      type: 'object',
      properties: {
        objective: { type: 'string', description: 'Strategic objective' },
        current_situation: { type: 'string', description: 'Where you are now' },
        competitors: { type: 'string', description: 'Key competitors' },
        resources: { type: 'string', description: 'Available resources' },
        constraints: { type: 'string', description: 'Limitations and constraints' },
        industry: { type: 'string', description: 'Industry/market' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['objective'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const objective = String(args.objective || '').trim();
      if (!objective) return { error: 'Strategic objective is required.' };
      const input = `Create a strategic plan:\nObjective: "${objective}"\nSituation: ${args.current_situation || 'unknown'}\nCompetitors: ${args.competitors || 'unknown'}\nResources: ${args.resources || 'limited (SMB)'}\nConstraints: ${args.constraints || 'none'}\nIndustry: ${args.industry || 'general'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(SYSTEM, input, { temperature: 0.5 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { diagnosis: objective, guiding_policy: 'Analysis unavailable', coherent_actions: [], bad_strategy_check: [], competitive_analysis: {}, five_rings: {}, power_moves: [], risks: [], timeline: [] };
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
