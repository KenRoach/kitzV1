/**
 * PMI Project Manager Tools — PMBOK 7th Edition for SMBs.
 *
 * 7 tools:
 *   - pmi_project_charter (medium) — Lean 1-page project charter
 *   - pmi_wbs (medium) — Work Breakdown Structure (3 levels max)
 *   - pmi_risk_register (low) — Top 5 risks with response strategies
 *   - pmi_stakeholder_analysis (low) — Power/interest stakeholder matrix
 *   - pmi_status_report (low) — Weekly project status report
 *   - pmi_lessons_learned (low) — Post-project retrospective
 *   - pmi_project_plan (high) — Full integrated project plan
 *
 * Uses Claude Sonnet for charter/WBS/full plan, Haiku for the rest.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('pmiProjectManagerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = `You are a PMI-certified project management advisor for LatAm SMBs.
You apply PMBOK 7th Edition principles adapted for lean teams:

12 PRINCIPLES: Stewardship, Team, Stakeholders, Value, Systems Thinking, Leadership, Tailoring, Quality, Complexity, Risk, Adaptability, Change.
8 PERFORMANCE DOMAINS: Stakeholder, Team, Development Approach, Planning, Project Work, Delivery, Measurement, Uncertainty.
5 PROCESS GROUPS: Initiating, Planning, Executing, Monitoring & Controlling, Closing.
10 KNOWLEDGE AREAS: Integration, Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder Management.

SMB RULES:
- No bureaucracy — lean documents, 1-page charters
- WBS max 3 levels: Deliverable > Work Package > Task
- Risk register: 5 risks max (focus on project killers)
- Weekly status, not daily (unless sprinting)
- Every task needs a Definition of Done
- Scope creep is the #1 enemy

Default language: Spanish. Be practical, not academic.
Respond with valid JSON only.`;

export function getAllPmiProjectManagerTools(): ToolSchema[] {
  return [
    {
      name: 'pmi_project_charter',
      description: 'Create a lean PMI project charter: objective, scope (in/out), stakeholders, constraints, assumptions, milestones, success criteria, budget, and duration estimates.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Project name' },
          objective: { type: 'string', description: 'Project objective / business case' },
          context: { type: 'string', description: 'Additional context about the project' },
          budget: { type: 'string', description: 'Estimated budget' },
          timeline: { type: 'string', description: 'Estimated timeline' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['project_name', 'objective'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const name = String(args.project_name || '').trim();
        const objective = String(args.objective || '').trim();
        if (!name || !objective) return { error: 'Project name and objective are required.' };
        const prompt = `Create a lean project charter:\nProject: "${name}"\nObjective: "${objective}"\nContext: ${args.context || 'SMB project'}\nBudget: ${args.budget || 'TBD'}\nTimeline: ${args.timeline || 'TBD'}\nLanguage: ${args.language || 'es'}\n\nJSON: { "project_name": string, "objective": string, "business_case": string, "scope": { "in_scope": [string], "out_of_scope": [string] }, "stakeholders": [{ "name": string, "role": string, "interest": string }], "constraints": [string], "assumptions": [string], "milestones": [{ "milestone": string, "target_date": string }], "success_criteria": [string], "estimated_budget": string, "estimated_duration": string }`;
        const raw = await callLLM(SYSTEM, prompt, { temperature: 0.4 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { project_name: name, objective, business_case: 'Por definir', scope: { in_scope: ['Por definir'], out_of_scope: [] }, stakeholders: [], constraints: [], assumptions: [], milestones: [], success_criteria: [], estimated_budget: args.budget || 'TBD', estimated_duration: args.timeline || 'TBD' };
        log.info('charter created', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'pmi_wbs',
      description: 'Create a Work Breakdown Structure (WBS) with max 3 levels: Deliverable > Work Package > Task. Includes critical path and task count.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Project name' },
          objective: { type: 'string', description: 'Project objective' },
          deliverables: { type: 'string', description: 'Known deliverables (comma-separated)' },
          team_size: { type: 'number', description: 'Team size (default: 1)' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['project_name', 'objective'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const name = String(args.project_name || '').trim();
        const objective = String(args.objective || '').trim();
        if (!name || !objective) return { error: 'Project name and objective are required.' };
        const prompt = `Create a WBS (max 3 levels):\nProject: "${name}"\nObjective: "${objective}"\nDeliverables: ${args.deliverables || 'identify from objective'}\nTeam: ${args.team_size || 1} people\nLanguage: ${args.language || 'es'}\n\nJSON: { "project_name": string, "deliverables": [{ "name": string, "work_packages": [{ "name": string, "tasks": [{ "task": string, "duration": string, "responsible": string }] }] }], "total_tasks": number, "critical_path": [string] }`;
        const raw = await callLLM(SYSTEM, prompt, { temperature: 0.4 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { project_name: name, deliverables: [], total_tasks: 0, critical_path: [] };
        log.info('wbs created', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'pmi_risk_register',
      description: 'Create a risk register with top 5 risks scored by probability x impact. Includes response strategies (Mitigar/Transferir/Aceptar/Evitar), owners, and triggers.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Project name' },
          objective: { type: 'string', description: 'Project objective' },
          industry: { type: 'string', description: 'Industry/sector' },
          constraints: { type: 'string', description: 'Known constraints' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['project_name', 'objective'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const name = String(args.project_name || '').trim();
        const objective = String(args.objective || '').trim();
        if (!name || !objective) return { error: 'Project name and objective are required.' };
        const prompt = `Create a risk register (top 5 risks):\nProject: "${name}"\nObjective: "${objective}"\nIndustry: ${args.industry || 'general SMB'}\nConstraints: ${args.constraints || 'limited budget and team'}\nLanguage: ${args.language || 'es'}\n\nScoring: Alta/Alto=3, Media/Medio=2, Baja/Bajo=1. Score = probability * impact.\nJSON: { "project_name": string, "risks": [{ "id": string, "description": string, "probability": "Alta"|"Media"|"Baja", "impact": "Alto"|"Medio"|"Bajo", "score": number, "response_strategy": "Mitigar"|"Transferir"|"Aceptar"|"Evitar", "response_plan": string, "owner": string, "trigger": string }], "overall_risk_level": string, "top_recommendation": string }`;
        const raw = await callLLM(SYSTEM, prompt, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { project_name: name, risks: [], overall_risk_level: 'Por evaluar', top_recommendation: 'Identificar riesgos antes de iniciar' };
        log.info('risk register created', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'pmi_stakeholder_analysis',
      description: 'Create a stakeholder analysis with power/interest matrix. Strategies: Gestionar de cerca (high power + interest), Mantener satisfecho (high power), Mantener informado (high interest), Monitorear (low both).',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Project name' },
          stakeholders: { type: 'string', description: 'Known stakeholders (comma-separated)' },
          context: { type: 'string', description: 'Project context' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['project_name'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const name = String(args.project_name || '').trim();
        if (!name) return { error: 'Project name is required.' };
        const prompt = `Create a stakeholder analysis (power/interest matrix):\nProject: "${name}"\nStakeholders: ${args.stakeholders || 'founder, team, customers'}\nContext: ${args.context || 'SMB project'}\nLanguage: ${args.language || 'es'}\n\nJSON: { "project_name": string, "stakeholders": [{ "name": string, "role": string, "power": "Alto"|"Medio"|"Bajo", "interest": "Alto"|"Medio"|"Bajo", "strategy": "Gestionar de cerca"|"Mantener satisfecho"|"Mantener informado"|"Monitorear", "communication_frequency": string, "key_concerns": [string] }], "communication_plan_summary": string }`;
        const raw = await callLLM(SYSTEM, prompt, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { project_name: name, stakeholders: [], communication_plan_summary: 'Por definir' };
        log.info('stakeholder analysis created', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'pmi_status_report',
      description: 'Generate a weekly project status report with traffic light (Verde/Amarillo/Rojo) for scope, schedule, and budget. Lists accomplishments, next steps, blockers, and decisions needed.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Project name' },
          accomplishments: { type: 'string', description: 'What was accomplished this week' },
          blockers: { type: 'string', description: 'Current blockers' },
          scope_changes: { type: 'string', description: 'Any scope changes requested' },
          budget_spent: { type: 'string', description: 'Budget spent so far' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['project_name'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const name = String(args.project_name || '').trim();
        if (!name) return { error: 'Project name is required.' };
        const prompt = `Create a weekly status report:\nProject: "${name}"\nAccomplishments: ${args.accomplishments || 'none provided'}\nBlockers: ${args.blockers || 'none'}\nScope changes: ${args.scope_changes || 'none'}\nBudget spent: ${args.budget_spent || 'unknown'}\nLanguage: ${args.language || 'es'}\n\nJSON: { "project_name": string, "report_date": string, "overall_status": "Verde"|"Amarillo"|"Rojo", "scope_status": string, "schedule_status": string, "budget_status": string, "accomplishments_this_week": [string], "planned_next_week": [string], "blockers": [string], "risks_update": [string], "decisions_needed": [string] }`;
        const raw = await callLLM(SYSTEM, prompt, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { project_name: name, report_date: new Date().toISOString().slice(0, 10), overall_status: 'Amarillo', scope_status: 'Por evaluar', schedule_status: 'Por evaluar', budget_status: 'Por evaluar', accomplishments_this_week: [], planned_next_week: [], blockers: [], risks_update: [], decisions_needed: [] };
        log.info('status report created', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'pmi_lessons_learned',
      description: 'Capture project lessons learned: what worked, what didn\'t, what to change. Includes key metrics and recommendations for next project.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Project name' },
          outcome: { type: 'string', description: 'Project outcome (success/partial/failed)' },
          challenges: { type: 'string', description: 'Main challenges encountered' },
          successes: { type: 'string', description: 'What went well' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['project_name'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const name = String(args.project_name || '').trim();
        if (!name) return { error: 'Project name is required.' };
        const prompt = `Capture lessons learned:\nProject: "${name}"\nOutcome: ${args.outcome || 'unknown'}\nChallenges: ${args.challenges || 'none stated'}\nSuccesses: ${args.successes || 'none stated'}\nLanguage: ${args.language || 'es'}\n\n3 questions: What worked? What didn't? What to change?\nJSON: { "project_name": string, "what_worked": [string], "what_didnt_work": [string], "what_to_change": [string], "key_metrics": object, "recommendations_for_next_project": [string] }`;
        const raw = await callLLM(SYSTEM, prompt, { temperature: 0.4 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { project_name: name, what_worked: [], what_didnt_work: [], what_to_change: [], key_metrics: {}, recommendations_for_next_project: [] };
        log.info('lessons learned captured', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'pmi_project_plan',
      description: 'Generate a full integrated project plan: charter + WBS + risk register + stakeholder analysis + communication plan + quality criteria + change management process. The complete PMI package for serious projects.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Project name' },
          objective: { type: 'string', description: 'Project objective' },
          context: { type: 'string', description: 'Project context' },
          budget: { type: 'string', description: 'Estimated budget' },
          timeline: { type: 'string', description: 'Estimated timeline' },
          team_size: { type: 'number', description: 'Team size' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['project_name', 'objective'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const name = String(args.project_name || '').trim();
        const objective = String(args.objective || '').trim();
        if (!name || !objective) return { error: 'Project name and objective are required.' };
        const prompt = `Create a FULL integrated project plan:\nProject: "${name}"\nObjective: "${objective}"\nContext: ${args.context || 'SMB project'}\nBudget: ${args.budget || 'TBD'}\nTimeline: ${args.timeline || 'TBD'}\nTeam: ${args.team_size || 1}\nLanguage: ${args.language || 'es'}\n\nInclude ALL of these in a single JSON:\n{ "charter": { project_name, objective, business_case, scope: { in_scope, out_of_scope }, stakeholders: [{ name, role, interest }], constraints, assumptions, milestones: [{ milestone, target_date }], success_criteria, estimated_budget, estimated_duration },\n"wbs": { project_name, deliverables: [{ name, work_packages: [{ name, tasks: [{ task, duration, responsible }] }] }], total_tasks, critical_path },\n"risk_register": { project_name, risks: [{ id, description, probability, impact, score, response_strategy, response_plan, owner, trigger }], overall_risk_level, top_recommendation },\n"stakeholder_analysis": { project_name, stakeholders: [{ name, role, power, interest, strategy, communication_frequency, key_concerns }], communication_plan_summary },\n"communication_plan": string, "quality_criteria": [string], "change_management_process": string }`;
        const raw = await callLLM(SYSTEM, prompt, { temperature: 0.4, model: 'sonnet' });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { charter: { project_name: name, objective }, wbs: { project_name: name, deliverables: [], total_tasks: 0, critical_path: [] }, risk_register: { project_name: name, risks: [], overall_risk_level: 'Por evaluar', top_recommendation: '' }, stakeholder_analysis: { project_name: name, stakeholders: [], communication_plan_summary: '' }, communication_plan: 'Por definir', quality_criteria: [], change_management_process: 'Por definir' };
        log.info('full project plan created', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
