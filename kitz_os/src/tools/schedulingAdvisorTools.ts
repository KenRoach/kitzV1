/** Appointment booking, calendar management, no-show reduction */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('schedulingAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Scheduling and appointment expert for LatAm SMBs. Booking, optimization. Spanish default. Respond with JSON.';

export function getAllSchedulingAdvisorTools(): ToolSchema[] {
  return [{ name: 'scheduling_advise', description: 'Appointment booking, calendar management, no-show reduction', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, appointments_per_week: { type: "number", description: "Appointments per week" }, challenges: { type: "string", description: "Challenges" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
