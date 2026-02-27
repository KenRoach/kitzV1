/**
 * Workflow Designer skill — n8n templates, automation flows, triggers.
 * Owner: CTO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface WorkflowStep { id: number; name: string; type: string; trigger?: string; action: string; config: string; }
export interface WorkflowDesign {
  name: string; description: string; steps: WorkflowStep[];
  triggers: string[]; estimatedTimeSaved: string; complexity: 'simple' | 'medium' | 'complex';
  n8nTemplate: string; alternatives: string[]; actionSteps: string[];
}
export interface WorkflowOptions { business: string; process: string; currentSteps?: string; tools?: string[]; language?: string; }

const SYSTEM = 'You are a workflow automation designer for LatAm SMBs using n8n, Zapier, and Make. Design simple automations. Spanish default.';
const FORMAT = 'Respond with JSON: { "name": string, "description": string, "steps": [object], "triggers": [string], "estimatedTimeSaved": string, "complexity": string, "n8nTemplate": string, "alternatives": [string], "actionSteps": [string] }';

export async function designWorkflow(options: WorkflowOptions, llmClient?: LLMClient): Promise<WorkflowDesign> {
  if (llmClient) {
    const prompt = `Workflow for: ${options.business}\nProcess: ${options.process}\nCurrent: ${options.currentSteps ?? 'manual'}\nTools: ${(options.tools ?? []).join(', ') || 'n8n'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as WorkflowDesign; } catch { /* fall through */ }
  }
  return {
    name: `Automatización: ${options.process}`, description: `Automatiza ${options.process} para ${options.business}`,
    steps: [{ id: 1, name: 'Trigger', type: 'webhook', trigger: 'Nuevo evento', action: 'Recibir datos', config: 'Webhook URL + filtro' }, { id: 2, name: 'Procesar', type: 'transform', action: 'Formatear datos', config: 'Mapear campos' }, { id: 3, name: 'Actuar', type: 'action', action: 'Enviar notificación/actualizar CRM', config: 'WhatsApp o email' }],
    triggers: ['Webhook', 'Programado (cron)', 'Nuevo registro en CRM'], estimatedTimeSaved: '2-5 horas/semana', complexity: 'simple',
    n8nTemplate: 'Trigger → IF condition → Action (WhatsApp/Email/CRM)',
    alternatives: ['Zapier (más fácil, más caro)', 'Make (intermedio)', 'n8n (gratis, self-hosted)'],
    actionSteps: ['Documenta el proceso manual actual', 'Identifica el trigger y la acción final', 'Crea el workflow en n8n con 3 nodos', 'Prueba con datos reales antes de activar'],
  };
}
