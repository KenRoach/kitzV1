/**
 * Hiring Advisor skill — Job postings, interview questions, evaluation frameworks.
 * Owner: HeadEngineering agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface HiringPlan {
  jobPosting: { title: string; description: string; requirements: string[]; benefits: string[]; salary: string };
  interviewQuestions: Array<{ question: string; category: string; whatToLookFor: string }>;
  evaluationCriteria: string[]; channels: string[]; redFlags: string[]; timeline: string; actionSteps: string[];
}
export interface HiringOptions { role: string; business: string; industry?: string; budget?: string; country?: string; language?: string; }

const SYSTEM = 'You are a hiring advisor for LatAm SMBs. Create job postings, interview frameworks, evaluation criteria. Consider local labor laws. Spanish default.';
const FORMAT = 'Respond with JSON: { "jobPosting": object, "interviewQuestions": [object], "evaluationCriteria": [string], "channels": [string], "redFlags": [string], "timeline": string, "actionSteps": [string] }';

export async function adviseHiring(options: HiringOptions, llmClient?: LLMClient): Promise<HiringPlan> {
  if (llmClient) {
    const prompt = `Hiring plan for: ${options.role} at ${options.business}\nIndustry: ${options.industry ?? 'general'}\nBudget: ${options.budget ?? 'market rate'}\nCountry: ${options.country ?? 'LatAm'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as HiringPlan; } catch { /* fall through */ }
  }
  return {
    jobPosting: { title: options.role, description: `Buscamos ${options.role} para ${options.business}. Somos un equipo en crecimiento que valora la iniciativa y el aprendizaje.`, requirements: ['Experiencia relevante', 'Proactividad', 'Comunicación clara'], benefits: ['Ambiente flexible', 'Crecimiento profesional', 'Equipo dinámico'], salary: 'Competitivo — según experiencia' },
    interviewQuestions: [
      { question: 'Cuéntame de un proyecto donde tuviste que resolver un problema sin ayuda', category: 'Autonomía', whatToLookFor: 'Iniciativa, resolución de problemas' },
      { question: '¿Cuál fue tu mayor error profesional y qué aprendiste?', category: 'Growth mindset', whatToLookFor: 'Honestidad, capacidad de aprendizaje' },
      { question: '¿Cómo manejas múltiples prioridades con deadline?', category: 'Organización', whatToLookFor: 'Proceso claro, priorización' },
    ],
    evaluationCriteria: ['Habilidades técnicas', 'Culture fit', 'Autonomía', 'Comunicación', 'Motivación'],
    channels: ['LinkedIn', 'Computrabajo', 'Referidos (mejor fuente)', 'Universidades locales', 'Grupos de WhatsApp del sector'],
    redFlags: ['Habla mal de empleadores anteriores', 'No investiga sobre tu empresa', 'No hace preguntas', 'Llega tarde sin avisar'],
    timeline: '2-4 semanas: publicar → filtrar → entrevistar → decidir → onboarding',
    actionSteps: ['Define exactamente qué necesitas (no un unicornio)', 'Publica en 2-3 canales', 'Filtra CVs con criterios claros', 'Entrevista a 3-5 candidatos, elige al mejor'],
  };
}
