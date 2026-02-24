#!/usr/bin/env tsx
/**
 * run-swarm.ts — Fire the full 102-agent swarm.
 *
 * Usage: npx tsx aos/scripts/run-swarm.ts
 *
 * Runs all 18 teams (6 concurrent), times everything, prints live progress.
 */

import { SwarmRunner, type SwarmProgress, type SwarmResult } from '../src/swarm/swarmRunner.js';
import { getAgentCount } from '../src/swarm/agentFactory.js';
import { TEAM_TASK_SEEDS } from '../src/swarm/teamTasks.js';

// ── Formatting helpers ──

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

function badge(label: string, color: string): string {
  return `${color}${BOLD}[${label}]${RESET}`;
}

function ms(n: number): string {
  if (n < 1000) return `${n}ms`;
  return `${(n / 1000).toFixed(2)}s`;
}

function statusIcon(success: boolean): string {
  return success ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
}

// ── Progress callback ──

function onProgress(update: SwarmProgress): void {
  const ts = new Date(update.timestamp).toISOString().slice(11, 23);
  switch (update.type) {
    case 'team_start':
      console.log(`  ${badge('TEAM', CYAN)} ${DIM}${ts}${RESET} Starting ${BOLD}${update.team}${RESET}`);
      break;
    case 'team_complete':
      console.log(`  ${badge('DONE', GREEN)} ${DIM}${ts}${RESET} ${update.message}`);
      break;
    case 'team_error':
      console.log(`  ${badge('FAIL', RED)} ${DIM}${ts}${RESET} ${update.message}`);
      break;
    case 'agent_action':
      console.log(`  ${badge('AGENT', DIM)} ${DIM}${ts}${RESET} ${update.agent} → ${update.message}`);
      break;
    case 'handoff':
      console.log(`  ${badge('HAND', YELLOW)} ${DIM}${ts}${RESET} ${update.message}`);
      break;
    case 'knowledge':
      console.log(`  ${badge('KNOW', CYAN)} ${DIM}${ts}${RESET} ${update.message}`);
      break;
  }
}

// ── Main ──

async function main() {
  console.log();
  console.log(`${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║         🐝  KITZ SWARM — LAUNCH VALIDATION  🐝         ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}`);
  console.log();

  const agentCount = getAgentCount();
  const teamCount = TEAM_TASK_SEEDS.length;

  console.log(`  ${BOLD}Agents:${RESET}      ${agentCount}`);
  console.log(`  ${BOLD}Teams:${RESET}       ${teamCount}`);
  console.log(`  ${BOLD}Concurrency:${RESET} 6 teams at a time`);
  console.log(`  ${BOLD}Timeout:${RESET}     60s per team`);
  console.log();
  console.log(`${BOLD}──── Starting Swarm ────${RESET}`);
  console.log();

  const runner = new SwarmRunner({
    concurrency: 6,
    timeoutMs: 60_000,
    dryRun: false,
    onProgress,
  });

  const startMs = Date.now();
  let result: SwarmResult;
  try {
    result = await runner.run();
  } catch (err) {
    console.error(`\n${RED}${BOLD}SWARM CRASHED:${RESET} ${(err as Error).message}`);
    process.exit(1);
  }
  const wallTime = Date.now() - startMs;

  // ── Summary ──

  console.log();
  console.log(`${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║                   SWARM RESULTS                        ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}`);
  console.log();

  const statusColor = result.status === 'completed' ? GREEN : result.status === 'partial' ? YELLOW : RED;
  console.log(`  ${BOLD}Status:${RESET}          ${statusColor}${BOLD}${result.status.toUpperCase()}${RESET}`);
  console.log(`  ${BOLD}Wall Time:${RESET}       ${ms(wallTime)}`);
  console.log(`  ${BOLD}Swarm Duration:${RESET}  ${ms(result.durationMs)}`);
  console.log(`  ${BOLD}Teams:${RESET}           ${result.teamsCompleted}/${result.teamsTotal} completed`);
  console.log(`  ${BOLD}Agents Run:${RESET}      ${result.agentResults.length}`);
  console.log(`  ${BOLD}Agents OK:${RESET}       ${result.agentResults.filter(a => a.success).length}`);
  console.log(`  ${BOLD}Agents Failed:${RESET}   ${result.agentResults.filter(a => !a.success).length}`);
  console.log(`  ${BOLD}Handoffs:${RESET}        ${result.handoffCount}`);
  console.log(`  ${BOLD}Knowledge:${RESET}       ${result.knowledgeWritten} entries`);
  console.log();

  // ── Per-team breakdown ──

  console.log(`${BOLD}──── Team Breakdown ────${RESET}`);
  console.log();

  const maxTeamNameLen = Math.max(...result.teamResults.map(t => t.team.length));

  for (const team of result.teamResults) {
    const ok = team.agentResults.filter(a => a.success).length;
    const total = team.agentResults.length;
    const icon = team.status === 'completed' ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const teamPad = team.team.padEnd(maxTeamNameLen);
    const scorePad = `${ok}/${total}`.padStart(5);
    const dur = ms(team.durationMs).padStart(8);

    console.log(`  ${icon} ${BOLD}${teamPad}${RESET}  ${scorePad} agents  ${DIM}${dur}${RESET}${team.error ? `  ${RED}${team.error}${RESET}` : ''}`);
  }

  // ── Failed agents ──

  const failedAgents = result.agentResults.filter(a => !a.success);
  if (failedAgents.length > 0) {
    console.log();
    console.log(`${BOLD}──── Failed Agents (${failedAgents.length}) ────${RESET}`);
    console.log();
    for (const a of failedAgents) {
      console.log(`  ${RED}✗${RESET} ${a.agent} (${a.team}) — ${DIM}${a.error ?? 'unknown'}${RESET}  ${DIM}${ms(a.durationMs)}${RESET}`);
    }
  }

  // ── Fastest / Slowest agents ──

  const successAgents = result.agentResults.filter(a => a.success).sort((a, b) => a.durationMs - b.durationMs);
  if (successAgents.length > 0) {
    console.log();
    console.log(`${BOLD}──── Fastest Agents (top 5) ────${RESET}`);
    for (const a of successAgents.slice(0, 5)) {
      console.log(`  ${GREEN}⚡${RESET} ${a.agent.padEnd(25)} ${DIM}${ms(a.durationMs)}${RESET}`);
    }

    console.log();
    console.log(`${BOLD}──── Slowest Agents (top 5) ────${RESET}`);
    for (const a of successAgents.slice(-5).reverse()) {
      console.log(`  ${YELLOW}🐢${RESET} ${a.agent.padEnd(25)} ${DIM}${ms(a.durationMs)}${RESET}`);
    }
  }

  // ── Fastest / Slowest teams ──

  const completedTeams = result.teamResults.filter(t => t.status === 'completed').sort((a, b) => a.durationMs - b.durationMs);
  if (completedTeams.length > 0) {
    console.log();
    console.log(`${BOLD}──── Fastest Teams ────${RESET}`);
    for (const t of completedTeams.slice(0, 5)) {
      console.log(`  ${GREEN}⚡${RESET} ${t.team.padEnd(25)} ${DIM}${ms(t.durationMs)}${RESET}  (${t.agentResults.length} agents)`);
    }

    console.log();
    console.log(`${BOLD}──── Slowest Teams ────${RESET}`);
    for (const t of completedTeams.slice(-3).reverse()) {
      console.log(`  ${YELLOW}🐢${RESET} ${t.team.padEnd(25)} ${DIM}${ms(t.durationMs)}${RESET}  (${t.agentResults.length} agents)`);
    }
  }

  // ── Launch readiness verdict ──

  console.log();
  console.log(`${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}`);

  const successRate = result.agentResults.length > 0
    ? (result.agentResults.filter(a => a.success).length / result.agentResults.length * 100)
    : 0;

  if (result.status === 'completed' && successRate >= 90) {
    console.log(`${GREEN}${BOLD}║  ✅  LAUNCH READY — ${successRate.toFixed(0)}% agent success rate          ║${RESET}`);
  } else if (result.status === 'partial' || (successRate >= 50 && successRate < 90)) {
    console.log(`${YELLOW}${BOLD}║  ⚠️  CONDITIONAL — ${successRate.toFixed(0)}% agent success, review needed  ║${RESET}`);
  } else {
    console.log(`${RED}${BOLD}║  ❌  NOT READY — ${successRate.toFixed(0)}% agent success rate             ║${RESET}`);
  }

  console.log(`${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}`);
  console.log();

  // Exit with appropriate code
  process.exit(result.status === 'completed' ? 0 : 1);
}

main().catch((err) => {
  console.error(`${RED}${BOLD}Fatal:${RESET}`, err);
  process.exit(1);
});
