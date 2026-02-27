/**
 * Psychological Safety Advisor skill — Trust, feedback culture, team dynamics.
 * Owner: CEO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface PsychSafetyPlan {
  assessment: { score: number; strengths: string[]; gaps: string[] };
  practices: Array<{ practice: string; frequency: string; impact: string }>;
  feedbackFramework: string; meetingNorms: string[];
  conflictTools: string[]; leaderBehaviors: string[]; actionSteps: string[];
}
export interface PsychSafetyOptions { business: string; teamSize: number; challenges?: string[]; language?: string; }

const SYSTEM = 'You are a psychological safety advisor (Amy Edmondson framework) for LatAm SMBs. Build trust, normalize failure, encourage speaking up. Spanish default.';
const FORMAT = 'Respond with JSON: { "assessment": { "score": number, "strengths": [string], "gaps": [string] }, "practices": [object], "feedbackFramework": string, "meetingNorms": [string], "conflictTools": [string], "leaderBehaviors": [string], "actionSteps": [string] }';

export async function advisePsychologicalSafety(options: PsychSafetyOptions, llmClient?: LLMClient): Promise<PsychSafetyPlan> {
  if (llmClient) {
    const prompt = `Psych safety for: ${options.business} (${options.teamSize} people)\nChallenges: ${(options.challenges ?? []).join(', ') || 'building trust'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as PsychSafetyPlan; } catch { /* fall through */ }
  }
  return {
    assessment: { score: 6, strengths: ['Equipo pequeño = cercanía natural'], gaps: ['Puede faltar estructura para dar feedback', 'El fundador puede dominar las conversaciones'] },
    practices: [
      { practice: 'Ronda de inicio en reuniones (¿cómo llegas hoy?)', frequency: 'Cada reunión', impact: 'Humaniza, conecta antes de trabajar' },
      { practice: 'Retrospectiva sin culpa', frequency: 'Semanal', impact: 'Normaliza hablar de errores' },
      { practice: 'Celebrar "buenos errores"', frequency: 'Mensual', impact: 'Refuerza que experimentar es válido' },
    ],
    feedbackFramework: 'SBI: Situación → Comportamiento → Impacto. "En la reunión de hoy (S), cuando interrumpiste a Ana (B), ella dejó de compartir ideas (I). ¿Cómo lo ves?"',
    meetingNorms: ['Todos hablan antes de decidir', 'Está bien decir "no sé"', 'Las preguntas son bienvenidas — siempre', 'Desacuerdo ≠ falta de respeto', 'El último en hablar es el líder'],
    conflictTools: ['Conversación 1:1 dentro de 24h', 'Usa "yo siento/observo" en vez de "tú hiciste"', 'Mediador neutral si es necesario', 'Documenta acuerdos por escrito'],
    leaderBehaviors: ['Admite tus propios errores públicamente', 'Pregunta antes de dar respuestas', 'Agradece cuando alguien señala un problema', 'No reacciones negativamente a malas noticias', 'Pide feedback sobre tu propio liderazgo'],
    actionSteps: ['Empieza tu próxima reunión con una ronda de check-in', 'Comparte un error tuyo reciente con el equipo', 'Pide feedback anónimo a tu equipo', 'Implementa retrospectivas semanales sin culpa'],
  };
}
