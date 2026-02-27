/**
 * Agent prompt builder — constructs system prompts for agent LLM calls.
 * Incorporates agent role, tier, allowed tools, memory, and SOPs.
 */

import type { AgentTier, TeamName } from '../types.js';

export interface AgentPromptContext {
  agentName: string;
  role: string;
  tier: AgentTier;
  team?: TeamName;
  allowedTools: string[];
  recentMemory: string[];
  sops: string[];
}

const TIER_INSTRUCTIONS: Record<AgentTier, string> = {
  'c-suite':
    'You are a C-suite executive. Make strategic decisions, delegate to teams, and ensure alignment with company goals. ' +
    'You can approve actions, allocate resources, and escalate to the CEO.',
  board:
    'You are a board advisor. Provide strategic guidance based on your specialty. ' +
    'Your votes are advisory — they inform but do not block decisions.',
  governance:
    'You are a governance agent. Ensure policies are followed, track compliance, and flag violations. ' +
    'You cannot take direct actions but can propose and review.',
  external:
    'You are an external advisor. Provide perspective from outside the organization. ' +
    'Your input is valued for diversity of thought.',
  team:
    'You are a team-level specialist. Execute tasks within your domain expertise. ' +
    'Escalate to your team lead or C-suite when blocked.',
  guardian:
    'You are a service guardian. Monitor health, detect issues, and trigger self-repair. ' +
    'Report degradation and coordinate fixes.',
  coach:
    'You are a coaching agent. Train other agents, update playbooks, and improve processes. ' +
    'Focus on continuous improvement and knowledge sharing.',
};

const CORE_RULES = [
  'Always follow draft-first policy: outbound messages are drafts requiring approval.',
  'Respect the AI Battery credit system — do not waste credits on vanity tasks.',
  'Log all actions with traceId for audit trail.',
  'If you cannot complete a task, escalate rather than fail silently.',
  'Use tools when available rather than generating raw text.',
  'Keep responses concise and actionable — no corporate fluff.',
];

export function buildSystemPrompt(ctx: AgentPromptContext): string {
  const lines: string[] = [];

  // Identity
  lines.push(`You are ${ctx.agentName}, the ${ctx.role} at KITZ.`);
  lines.push(`Tier: ${ctx.tier}${ctx.team ? ` | Team: ${ctx.team}` : ''}`);
  lines.push('');

  // Tier-specific instructions
  lines.push(TIER_INSTRUCTIONS[ctx.tier]);
  lines.push('');

  // Core rules
  lines.push('## Core Rules');
  for (const rule of CORE_RULES) {
    lines.push(`- ${rule}`);
  }
  lines.push('');

  // Available tools
  if (ctx.allowedTools.length > 0) {
    lines.push('## Available Tools');
    lines.push('You can use these tools by specifying tool calls in your response:');
    for (const tool of ctx.allowedTools.slice(0, 30)) {
      lines.push(`- ${tool}`);
    }
    if (ctx.allowedTools.length > 30) {
      lines.push(`... and ${ctx.allowedTools.length - 30} more`);
    }
    lines.push('');
  }

  // SOPs
  if (ctx.sops.length > 0) {
    lines.push('## Standard Operating Procedures');
    for (const sop of ctx.sops.slice(0, 5)) {
      lines.push(`- ${sop}`);
    }
    lines.push('');
  }

  // Recent context
  if (ctx.recentMemory.length > 0) {
    lines.push('## Recent Context');
    for (const mem of ctx.recentMemory.slice(-5)) {
      lines.push(`- ${mem}`);
    }
    lines.push('');
  }

  // Output format
  lines.push('## Response Format');
  lines.push('Respond with a JSON object:');
  lines.push('```json');
  lines.push('{');
  lines.push('  "reasoning": "Brief explanation of your analysis",');
  lines.push('  "actions": [');
  lines.push('    { "tool": "tool_name", "args": { ... } }');
  lines.push('  ],');
  lines.push('  "response": "Your text response to the user/requester",');
  lines.push('  "escalate": null  // or { "to": "AgentName", "reason": "why" }');
  lines.push('}');
  lines.push('```');

  return lines.join('\n');
}
