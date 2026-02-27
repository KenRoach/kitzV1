/**
 * Team Culture Builder skill — Values, rituals, communication norms.
 * Owner: CEO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface CulturePlan {
  values: Array<{ value: string; behavior: string; antiPattern: string }>;
  rituals: Array<{ name: string; frequency: string; purpose: string; format: string }>;
  communicationNorms: string[]; recognitionProgram: string[]; conflictResolution: string[]; actionSteps: string[];
}
export interface CultureOptions { business: string; teamSize: number; currentChallenges?: string[]; language?: string; }

const SYSTEM = 'You are a team culture builder for LatAm SMBs. Design practical culture systems (values, rituals, norms) that work for small teams. Spanish default.';
const FORMAT = 'Respond with JSON: { "values": [{ "value": string, "behavior": string, "antiPattern": string }], "rituals": [object], "communicationNorms": [string], "recognitionProgram": [string], "conflictResolution": [string], "actionSteps": [string] }';

export async function buildTeamCulture(options: CultureOptions, llmClient?: LLMClient): Promise<CulturePlan> {
  if (llmClient) {
    const prompt = `Culture for: ${options.business} (${options.teamSize} people)\nChallenges: ${(options.currentChallenges ?? []).join(', ') || 'growing team'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as CulturePlan; } catch { /* fall through */ }
  }
  return {
    values: [
      { value: 'Ownership', behavior: 'Toma decisiones sin esperar permiso', antiPattern: 'Esperar que alguien más resuelva' },
      { value: 'Transparencia', behavior: 'Comparte problemas temprano, pide ayuda', antiPattern: 'Esconder errores o bloqueos' },
      { value: 'Cliente primero', behavior: 'Prioriza la experiencia del cliente en cada decisión', antiPattern: 'Optimizar internamente sin pensar en el cliente' },
    ],
    rituals: [
      { name: 'Standup diario', frequency: 'Diario 9am', purpose: 'Alineación y bloqueos', format: '15 min por WhatsApp o presencial' },
      { name: 'Retro semanal', frequency: 'Viernes 4pm', purpose: 'Mejora continua', format: '30 min: qué salió bien, qué mejorar, acciones' },
      { name: 'All-hands mensual', frequency: 'Primer lunes del mes', purpose: 'Celebrar logros, compartir métricas, alinear', format: '45 min con Q&A' },
    ],
    communicationNorms: ['WhatsApp para urgente, email para importante no urgente', 'Responde en < 2h en horario laboral', 'Usa @menciones para claridad', 'No mensajes de trabajo después de las 8pm'],
    recognitionProgram: ['Shoutout semanal en grupo de WhatsApp', 'Empleado del mes con reconocimiento público', 'Feedback positivo en 1:1s, no solo en reviews'],
    conflictResolution: ['Habla directo con la persona primero', 'Si no se resuelve, involucra al manager', 'Nunca hables mal de alguien sin hablar con ellos primero', 'Documenta acuerdos por escrito'],
    actionSteps: ['Define 3 valores con tu equipo (no solos)', 'Implementa 1 ritual esta semana (standup diario)', 'Escribe las normas de comunicación y comparte', 'Celebra públicamente un logro del equipo hoy'],
  };
}
