/**
 * PMI Project Manager skill — PMBOK 7th Edition knowledge for SMBs.
 *
 * 7 tools:
 *   - pmi_project_charter — Lean 1-page project charter
 *   - pmi_wbs — Work Breakdown Structure (3 levels max)
 *   - pmi_risk_register — Top 5 risks with response strategies
 *   - pmi_stakeholder_analysis — Power/interest stakeholder matrix
 *   - pmi_status_report — Weekly project status report
 *   - pmi_lessons_learned — Post-project retrospective
 *   - pmi_project_plan — Full integrated project plan
 *
 * Owner: COO agent.
 * Source: KB_PMI_PROJECT_MANAGEMENT.md, PMBOK 7th Edition principles
 */

import type { LLMClient } from './callTranscription.js';

// ── Interfaces ──────────────────────────────────────────────────────

export interface ProjectCharter {
  project_name: string;
  objective: string;
  business_case: string;
  scope: { in_scope: string[]; out_of_scope: string[] };
  stakeholders: Array<{ name: string; role: string; interest: string }>;
  constraints: string[];
  assumptions: string[];
  milestones: Array<{ milestone: string; target_date: string }>;
  success_criteria: string[];
  estimated_budget: string;
  estimated_duration: string;
}

export interface WBS {
  project_name: string;
  deliverables: Array<{
    name: string;
    work_packages: Array<{
      name: string;
      tasks: Array<{ task: string; duration: string; responsible: string }>;
    }>;
  }>;
  total_tasks: number;
  critical_path: string[];
}

export interface RiskRegister {
  project_name: string;
  risks: Array<{
    id: string;
    description: string;
    probability: 'Alta' | 'Media' | 'Baja';
    impact: 'Alto' | 'Medio' | 'Bajo';
    score: number;
    response_strategy: 'Mitigar' | 'Transferir' | 'Aceptar' | 'Evitar';
    response_plan: string;
    owner: string;
    trigger: string;
  }>;
  overall_risk_level: string;
  top_recommendation: string;
}

export interface StakeholderAnalysis {
  project_name: string;
  stakeholders: Array<{
    name: string;
    role: string;
    power: 'Alto' | 'Medio' | 'Bajo';
    interest: 'Alto' | 'Medio' | 'Bajo';
    strategy: 'Gestionar de cerca' | 'Mantener satisfecho' | 'Mantener informado' | 'Monitorear';
    communication_frequency: string;
    key_concerns: string[];
  }>;
  communication_plan_summary: string;
}

export interface StatusReport {
  project_name: string;
  report_date: string;
  overall_status: 'Verde' | 'Amarillo' | 'Rojo';
  scope_status: string;
  schedule_status: string;
  budget_status: string;
  accomplishments_this_week: string[];
  planned_next_week: string[];
  blockers: string[];
  risks_update: string[];
  decisions_needed: string[];
}

export interface LessonsLearned {
  project_name: string;
  what_worked: string[];
  what_didnt_work: string[];
  what_to_change: string[];
  key_metrics: Record<string, string>;
  recommendations_for_next_project: string[];
}

export interface ProjectPlan {
  charter: ProjectCharter;
  wbs: WBS;
  risk_register: RiskRegister;
  stakeholder_analysis: StakeholderAnalysis;
  communication_plan: string;
  quality_criteria: string[];
  change_management_process: string;
}

// ── Options ─────────────────────────────────────────────────────────

export interface CharterOptions { project_name: string; objective: string; context?: string; budget?: string; timeline?: string; language?: string; }
export interface WBSOptions { project_name: string; objective: string; deliverables?: string; team_size?: number; language?: string; }
export interface RiskOptions { project_name: string; objective: string; industry?: string; constraints?: string; language?: string; }
export interface StakeholderOptions { project_name: string; stakeholders?: string; context?: string; language?: string; }
export interface StatusOptions { project_name: string; accomplishments?: string; blockers?: string; scope_changes?: string; budget_spent?: string; language?: string; }
export interface LessonsOptions { project_name: string; outcome?: string; challenges?: string; successes?: string; language?: string; }
export interface PlanOptions { project_name: string; objective: string; context?: string; budget?: string; timeline?: string; team_size?: number; language?: string; }

// ── System Prompt ───────────────────────────────────────────────────

const SYSTEM = `You are a PMI-certified project management advisor for LatAm SMBs.
You apply PMBOK 7th Edition principles adapted for lean teams:

12 PRINCIPLES: Stewardship, Team, Stakeholders, Value, Systems Thinking, Leadership, Tailoring, Quality, Complexity, Risk, Adaptability, Change.

8 PERFORMANCE DOMAINS: Stakeholder, Team, Development Approach, Planning, Project Work, Delivery, Measurement, Uncertainty.

5 PROCESS GROUPS: Initiating, Planning, Executing, Monitoring & Controlling, Closing.

10 KNOWLEDGE AREAS: Integration, Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder Management.

ADAPTATION RULES FOR SMBs:
- No bureaucracy — lean documents, 1-page charters
- WBS max 3 levels: Deliverable → Work Package → Task
- Risk register: 5 risks max (focus on project killers)
- Weekly status, not daily (unless sprinting)
- Every task needs a Definition of Done
- Scope creep is the #1 enemy — document every change

Default language: Spanish. Be practical, not academic.`;

// ── Functions ───────────────────────────────────────────────────────

export async function createProjectCharter(options: CharterOptions, llmClient?: LLMClient): Promise<ProjectCharter> {
  if (llmClient) {
    const prompt = `Create a lean project charter:\nProject: "${options.project_name}"\nObjective: "${options.objective}"\nContext: ${options.context ?? 'SMB project'}\nBudget: ${options.budget ?? 'to be determined'}\nTimeline: ${options.timeline ?? 'to be determined'}\nLanguage: ${options.language ?? 'es'}\n\nRespond with JSON matching ProjectCharter interface.`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as ProjectCharter; } catch { /* fall through */ }
  }
  return {
    project_name: options.project_name, objective: options.objective,
    business_case: 'Por definir', scope: { in_scope: ['Por definir'], out_of_scope: ['Por definir'] },
    stakeholders: [{ name: 'Fundador', role: 'Sponsor', interest: 'Alto' }],
    constraints: ['Presupuesto limitado', 'Equipo pequeño'], assumptions: ['Recursos disponibles según planificado'],
    milestones: [{ milestone: 'Kick-off', target_date: 'Semana 1' }, { milestone: 'Entrega final', target_date: 'Por definir' }],
    success_criteria: ['Objetivo cumplido dentro del presupuesto y plazo'],
    estimated_budget: options.budget ?? 'Por definir', estimated_duration: options.timeline ?? 'Por definir',
  };
}

export async function createWBS(options: WBSOptions, llmClient?: LLMClient): Promise<WBS> {
  if (llmClient) {
    const prompt = `Create a Work Breakdown Structure (max 3 levels):\nProject: "${options.project_name}"\nObjective: "${options.objective}"\nDeliverables: ${options.deliverables ?? 'identify from objective'}\nTeam size: ${options.team_size ?? 1}\nLanguage: ${options.language ?? 'es'}\n\nRespond with JSON matching WBS interface.`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as WBS; } catch { /* fall through */ }
  }
  return {
    project_name: options.project_name,
    deliverables: [{ name: options.objective, work_packages: [{ name: 'Paquete principal', tasks: [{ task: 'Definir alcance', duration: '1 día', responsible: 'Fundador' }, { task: 'Ejecutar', duration: 'Por definir', responsible: 'Equipo' }, { task: 'Validar entrega', duration: '1 día', responsible: 'Fundador' }] }] }],
    total_tasks: 3, critical_path: ['Definir alcance', 'Ejecutar', 'Validar entrega'],
  };
}

export async function createRiskRegister(options: RiskOptions, llmClient?: LLMClient): Promise<RiskRegister> {
  if (llmClient) {
    const prompt = `Create a risk register (top 5 risks):\nProject: "${options.project_name}"\nObjective: "${options.objective}"\nIndustry: ${options.industry ?? 'general SMB'}\nConstraints: ${options.constraints ?? 'limited budget and team'}\nLanguage: ${options.language ?? 'es'}\n\nRespond with JSON matching RiskRegister interface. Use probability/impact scoring: Alta/Alto=3, Media/Medio=2, Baja/Bajo=1. Score = probability * impact.`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as RiskRegister; } catch { /* fall through */ }
  }
  return {
    project_name: options.project_name,
    risks: [
      { id: 'R-001', description: 'Scope creep — alcance sin control', probability: 'Alta', impact: 'Alto', score: 9, response_strategy: 'Mitigar', response_plan: 'Documentar todo cambio de alcance. Aprobación del sponsor requerida.', owner: 'PM', trigger: 'Cualquier solicitud de cambio no documentada' },
      { id: 'R-002', description: 'Recursos insuficientes', probability: 'Media', impact: 'Alto', score: 6, response_strategy: 'Mitigar', response_plan: 'Identificar respaldos. Priorizar tareas críticas.', owner: 'PM', trigger: 'Miembro del equipo no disponible' },
      { id: 'R-003', description: 'Retraso en entregas de terceros', probability: 'Media', impact: 'Medio', score: 4, response_strategy: 'Transferir', response_plan: 'Cláusulas de penalidad en contratos. Plan B identificado.', owner: 'PM', trigger: 'Entrega > 3 días tarde' },
    ],
    overall_risk_level: 'Medio', top_recommendation: 'Controlar el alcance desde el día 1. Es el riesgo #1 para SMBs.',
  };
}

export async function analyzeStakeholders(options: StakeholderOptions, llmClient?: LLMClient): Promise<StakeholderAnalysis> {
  if (llmClient) {
    const prompt = `Create a stakeholder analysis (power/interest matrix):\nProject: "${options.project_name}"\nStakeholders: ${options.stakeholders ?? 'founder, team, customers'}\nContext: ${options.context ?? 'SMB project'}\nLanguage: ${options.language ?? 'es'}\n\nRespond with JSON matching StakeholderAnalysis interface.`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as StakeholderAnalysis; } catch { /* fall through */ }
  }
  return {
    project_name: options.project_name,
    stakeholders: [
      { name: 'Fundador', role: 'Sponsor', power: 'Alto', interest: 'Alto', strategy: 'Gestionar de cerca', communication_frequency: 'Diaria', key_concerns: ['ROI', 'Tiempo de entrega'] },
      { name: 'Clientes', role: 'Beneficiarios', power: 'Medio', interest: 'Alto', strategy: 'Mantener informado', communication_frequency: 'Semanal', key_concerns: ['Calidad', 'Valor'] },
    ],
    communication_plan_summary: 'Sponsor: actualización diaria. Equipo: standup semanal. Clientes: actualizaciones según hitos.',
  };
}

export async function createStatusReport(options: StatusOptions, llmClient?: LLMClient): Promise<StatusReport> {
  if (llmClient) {
    const prompt = `Create a weekly project status report:\nProject: "${options.project_name}"\nAccomplishments: ${options.accomplishments ?? 'none provided'}\nBlockers: ${options.blockers ?? 'none'}\nScope changes: ${options.scope_changes ?? 'none'}\nBudget spent: ${options.budget_spent ?? 'unknown'}\nLanguage: ${options.language ?? 'es'}\n\nRespond with JSON matching StatusReport interface. Use traffic light: Verde/Amarillo/Rojo.`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as StatusReport; } catch { /* fall through */ }
  }
  return {
    project_name: options.project_name, report_date: new Date().toISOString().slice(0, 10),
    overall_status: 'Amarillo', scope_status: 'En control', schedule_status: 'Por evaluar', budget_status: 'Por evaluar',
    accomplishments_this_week: options.accomplishments?.split(',').map(s => s.trim()) ?? ['Por reportar'],
    planned_next_week: ['Definir actividades'], blockers: options.blockers?.split(',').map(s => s.trim()) ?? [],
    risks_update: ['Revisar registro de riesgos'], decisions_needed: ['Ninguna pendiente'],
  };
}

export async function captureLessonsLearned(options: LessonsOptions, llmClient?: LLMClient): Promise<LessonsLearned> {
  if (llmClient) {
    const prompt = `Capture lessons learned for the project:\nProject: "${options.project_name}"\nOutcome: ${options.outcome ?? 'unknown'}\nChallenges: ${options.challenges ?? 'none stated'}\nSuccesses: ${options.successes ?? 'none stated'}\nLanguage: ${options.language ?? 'es'}\n\n3 questions: What worked? What didn't? What to change?\nRespond with JSON matching LessonsLearned interface.`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as LessonsLearned; } catch { /* fall through */ }
  }
  return {
    project_name: options.project_name,
    what_worked: options.successes?.split(',').map(s => s.trim()) ?? ['Por documentar'],
    what_didnt_work: options.challenges?.split(',').map(s => s.trim()) ?? ['Por documentar'],
    what_to_change: ['Documentar cambios para el próximo proyecto'],
    key_metrics: { 'Duración real vs. planificada': 'Por medir', 'Presupuesto real vs. planificado': 'Por medir' },
    recommendations_for_next_project: ['Iniciar con charter desde el día 1', 'Controlar alcance semanalmente', 'Hacer retrospectiva al cerrar'],
  };
}

export async function createFullProjectPlan(options: PlanOptions, llmClient?: LLMClient): Promise<ProjectPlan> {
  const charter = await createProjectCharter(options, llmClient);
  const wbs = await createWBS({ project_name: options.project_name, objective: options.objective, team_size: options.team_size, language: options.language }, llmClient);
  const risk_register = await createRiskRegister({ project_name: options.project_name, objective: options.objective, language: options.language }, llmClient);
  const stakeholder_analysis = await analyzeStakeholders({ project_name: options.project_name, language: options.language }, llmClient);
  return {
    charter, wbs, risk_register, stakeholder_analysis,
    communication_plan: 'Sponsor: diario. Equipo: semanal. Clientes: por hitos.',
    quality_criteria: ['Definición de Done en cada tarea', 'Revisión de entregables antes de cierre'],
    change_management_process: 'Todo cambio de alcance requiere: (1) Solicitud documentada, (2) Análisis de impacto, (3) Aprobación del sponsor.',
  };
}
