/** Employee onboarding plans, first-day checklists, training schedules */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('employeeOnboardingBuilderTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Employee onboarding specialist for LatAm SMBs. Structured onboarding plans. Spanish default. Respond with JSON.';
export function getAllEmployeeOnboardingBuilderTools(): ToolSchema[] {
  return [{ name: 'employee_onboarding_build', description: 'Employee onboarding plans, first-day checklists, training schedules', parameters: { type: "object", properties: { role: { type: "string", description: "Role being onboarded" }, business: { type: "string", description: "Business name" }, team_size: { type: "number", description: "Team size" } }, required: ["role", "business"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
