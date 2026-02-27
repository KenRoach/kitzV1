/**
 * Employee Onboarding Builder skill — First-day plans, training schedules, checklists.
 * Owner: HeadEngineering agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface OnboardingPlan {
  preboarding: string[]; day1: string[]; week1: string[]; month1: string[];
  trainingTopics: string[]; mentorChecklist: string[]; successMetrics: string[]; actionSteps: string[];
}
export interface EmployeeOnboardingOptions { role: string; business: string; teamSize?: number; language?: string; }

const SYSTEM = 'You are an employee onboarding specialist for LatAm SMBs. Create structured onboarding that gets new hires productive fast. Spanish default.';
const FORMAT = 'Respond with JSON: { "preboarding": [string], "day1": [string], "week1": [string], "month1": [string], "trainingTopics": [string], "mentorChecklist": [string], "successMetrics": [string], "actionSteps": [string] }';

export async function buildEmployeeOnboarding(options: EmployeeOnboardingOptions, llmClient?: LLMClient): Promise<OnboardingPlan> {
  if (llmClient) {
    const prompt = `Onboarding for: ${options.role} at ${options.business}\nTeam size: ${options.teamSize ?? 'small'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as OnboardingPlan; } catch { /* fall through */ }
  }
  return {
    preboarding: ['Enviar contrato y documentos por email', 'Crear accesos (email, herramientas, WhatsApp grupo)', 'Enviar mensaje de bienvenida del equipo', 'Preparar espacio de trabajo'],
    day1: ['Bienvenida del fundador/líder (30 min)', 'Tour del espacio/herramientas', 'Presentación del equipo', 'Configurar herramientas (Kitz, email, etc.)', 'Almuerzo con el equipo', 'Asignar primera tarea simple'],
    week1: ['Capacitación en producto/servicio', 'Shadowing con compañero experimentado', 'Reunión diaria de 15 min con manager', 'Completar primera tarea real', 'Feedback informal viernes'],
    month1: ['Independencia en tareas principales', 'Reunión 1:1 semanal con manager', 'Completar capacitación formal', 'Primer proyecto independiente', 'Evaluación 30 días'],
    trainingTopics: ['Producto/servicio del negocio', 'Herramientas y procesos', 'Cultura y valores', 'Atención al cliente', 'Seguridad y privacidad'],
    mentorChecklist: ['Presentar al equipo', 'Explicar procesos no escritos', 'Responder preguntas diarias', 'Dar feedback constructivo', 'Celebrar primeros logros'],
    successMetrics: ['Productividad al 80% en 30 días', 'Satisfacción del nuevo empleado (encuesta)', 'Retención a 90 días', 'Tiempo hasta primera contribución'],
    actionSteps: ['Crea un documento de onboarding (checklist)', 'Asigna un compañero/mentor', 'Programa reuniones 1:1 semanales el primer mes', 'Pide feedback al nuevo empleado al día 7 y 30'],
  };
}
