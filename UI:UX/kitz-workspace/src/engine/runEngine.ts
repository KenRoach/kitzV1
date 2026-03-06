import { useRunStore } from '../store/runStore';
import { useArtifactStore } from '../store/artifactStore';
import { useBatteryStore } from '../store/batteryStore';
import { parseCommand } from './commandParser';
import {
  createArtifact,
  makePremium,
  shortenBlocks,
  translateSpanish,
} from './artifactFactory';
import type { LogEntry, Run, RunPhase } from '../types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function newRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function log(agent: string, message: string, level: LogEntry['level'] = 'info'): LogEntry {
  return { ts: Date.now(), agent, level, message };
}

const AGENTS = {
  read: 'IntentAgent',
  comprehend: 'ClassifierAgent',
  brainstorm: 'StrategyAgent',
  execute: {
    flyer: 'DesignAgent',
    email_sequence: 'CopywriterAgent',
    audit: 'AnalyticsAgent',
    waitlist: 'GrowthAgent',
    default: 'OpsAgent',
  },
  voice: 'VoiceAgent',
};

async function streamLogs(
  runId: string,
  logs: Array<{ agent: string; message: string; level?: LogEntry['level']; phase?: RunPhase }>,
  delayMs = 400
) {
  const store = useRunStore.getState();
  for (const entry of logs) {
    if (entry.phase) store.setPhase(runId, entry.phase);
    store.appendLog(runId, log(entry.agent, entry.message, entry.level || 'info'));
    await sleep(delayMs + Math.random() * 200);
  }
}

// Pending approval resolver
let approvalResolver: ((approved: boolean) => void) | null = null;

export function resolveApproval(approved: boolean) {
  if (approvalResolver) {
    approvalResolver(approved);
    approvalResolver = null;
  }
}

export function hasPendingApproval(): boolean {
  return approvalResolver !== null;
}

async function waitForApproval(): Promise<boolean> {
  return new Promise((resolve) => {
    approvalResolver = resolve;
  });
}

export async function runCommand(rawCommand: string) {
  const parsed = parseCommand(rawCommand);
  const runStore = useRunStore.getState();
  const artifactStore = useArtifactStore.getState();
  const batteryStore = useBatteryStore.getState();

  // Handle approve/cancel for pending runs
  if (parsed.intent === 'approve') {
    resolveApproval(true);
    return;
  }
  if (parsed.intent === 'cancel') {
    resolveApproval(false);
    return;
  }

  const runId = newRunId();
  const run: Run = {
    id: runId,
    createdAt: Date.now(),
    status: 'running',
    goal: rawCommand,
    command: rawCommand,
    phase: 'READ',
    risk: parsed.risk,
    costCredits: parsed.costCredits,
    logs: [],
    artifactId: null,
    artifactVersion: 0,
  };

  runStore.addRun(run);

  if (parsed.intent === 'unknown') {
    await streamLogs(runId, [
      { agent: AGENTS.read, message: `Parsing: "${rawCommand}"`, phase: 'READ' },
      { agent: AGENTS.comprehend, message: 'Could not classify intent. Try: "create flyer: ...", "build email sequence for ...", "audit revenue leaks"', level: 'warn', phase: 'COMPREHEND' },
    ]);
    runStore.setStatus(runId, 'failed');
    runStore.setPhase(runId, 'DONE');
    return;
  }

  // Modification commands (work on existing artifact)
  if (['modify_premium', 'modify_shorten', 'modify_translate'].includes(parsed.intent)) {
    const active = artifactStore.getActive();
    if (!active) {
      await streamLogs(runId, [
        { agent: AGENTS.read, message: 'No active artifact to modify. Create one first.', level: 'warn', phase: 'READ' },
      ]);
      runStore.setStatus(runId, 'failed');
      runStore.setPhase(runId, 'DONE');
      return;
    }

    const currentVer = active.versions.find((v) => v.version === active.currentVersion)!;
    let newBlocks = currentVer.blocks;
    let changeNote = '';

    await streamLogs(runId, [
      { agent: AGENTS.read, message: `Modifying: ${active.name}`, phase: 'READ' },
      { agent: AGENTS.comprehend, message: `Intent: ${parsed.intent.replace('modify_', '')}`, phase: 'COMPREHEND' },
      { agent: 'DesignAgent', message: 'Applying transformation...', phase: 'EXECUTE' },
    ]);

    if (parsed.intent === 'modify_premium') {
      newBlocks = makePremium(currentVer.blocks);
      changeNote = 'Elevated tone — more premium, authoritative';
    } else if (parsed.intent === 'modify_shorten') {
      newBlocks = shortenBlocks(currentVer.blocks);
      changeNote = 'Shortened by ~30% — tighter copy';
    } else if (parsed.intent === 'modify_translate') {
      newBlocks = translateSpanish(currentVer.blocks);
      changeNote = 'Translated to Spanish';
    }

    const newVersion = currentVer.version + 1;
    artifactStore.addVersion(active.id, {
      version: newVersion,
      createdAt: Date.now(),
      title: currentVer.title,
      blocks: newBlocks,
      meta: { changeNote, command: rawCommand },
    });

    batteryStore.spend(parsed.costCredits);
    runStore.setArtifact(runId, active.id, newVersion);

    await streamLogs(runId, [
      { agent: AGENTS.voice, message: `Created v${newVersion}: ${changeNote}`, level: 'success', phase: 'VOICE' },
    ]);

    runStore.setStatus(runId, 'completed');
    runStore.setPhase(runId, 'DONE');
    return;
  }

  // Export / send commands (need approval)
  if (parsed.needsApproval) {
    const actionLabel = parsed.intent.replace('_', ' ').toUpperCase();
    await streamLogs(runId, [
      { agent: AGENTS.read, message: `Action requested: ${actionLabel}`, phase: 'READ' },
      { agent: 'PolicyAgent', message: `Risk: ${parsed.risk.toUpperCase()} | Cost: ${parsed.costCredits} credits`, level: 'warn', phase: 'COMPREHEND' },
    ]);

    runStore.setStatus(runId, 'awaiting_approval');
    runStore.setApprovalAction(runId, actionLabel);
    runStore.appendLog(runId, log('PolicyAgent', `[APPROVAL REQUIRED] ${actionLabel} — ${parsed.costCredits} credits — Risk: ${parsed.risk}`, 'warn'));

    const approved = await waitForApproval();

    if (approved) {
      runStore.setStatus(runId, 'running');
      batteryStore.spend(parsed.costCredits);
      await streamLogs(runId, [
        { agent: 'OpsAgent', message: `${actionLabel} approved. Executing...`, level: 'success', phase: 'EXECUTE' },
        { agent: 'OpsAgent', message: `${actionLabel} complete (mock).`, level: 'success', phase: 'VOICE' },
      ]);
      runStore.setStatus(runId, 'completed');
      runStore.setPhase(runId, 'DONE');
    } else {
      runStore.appendLog(runId, log('PolicyAgent', 'Action cancelled by user.', 'warn'));
      runStore.setStatus(runId, 'failed');
      runStore.setPhase(runId, 'DONE');
    }
    return;
  }

  // Creation commands
  const agentKey = parsed.artifactType || 'default';
  const executeAgent = (AGENTS.execute as Record<string, string>)[agentKey] || AGENTS.execute.default;

  await streamLogs(runId, [
    { agent: AGENTS.read, message: `Parsing: "${rawCommand}"`, phase: 'READ' },
    { agent: AGENTS.comprehend, message: `Intent: ${parsed.intent} | Type: ${parsed.artifactType}`, phase: 'COMPREHEND' },
    { agent: AGENTS.brainstorm, message: `Planning ${parsed.artifactType} creation...`, phase: 'BRAINSTORM' },
    { agent: executeAgent, message: 'Generating content blocks...', phase: 'EXECUTE' },
  ]);

  const artifact = createArtifact(parsed.artifactType!, parsed.details);
  artifactStore.addArtifact(artifact);
  batteryStore.spend(parsed.costCredits);
  runStore.setArtifact(runId, artifact.id, 1);

  await streamLogs(runId, [
    { agent: executeAgent, message: `Artifact created: ${artifact.name}`, level: 'success' },
    { agent: AGENTS.voice, message: `Done. ${artifact.versions[0].blocks.length} blocks generated.`, level: 'success', phase: 'VOICE' },
  ]);

  runStore.setStatus(runId, 'completed');
  runStore.setPhase(runId, 'DONE');
}

export function loadDemoData() {
  const artifact = createArtifact('flyer', 'Dog Food — Dog Reading at Beach');
  useArtifactStore.getState().addArtifact(artifact);

  const demoRun: Run = {
    id: 'run-demo',
    createdAt: Date.now() - 30000,
    status: 'completed',
    goal: 'create flyer: dog food, dog reading at beach',
    command: 'create flyer: dog food, dog reading at beach',
    phase: 'DONE',
    risk: 'low',
    costCredits: 2,
    logs: [
      log('IntentAgent', 'Parsing: "create flyer: dog food, dog reading at beach"'),
      log('ClassifierAgent', 'Intent: create_flyer | Type: flyer'),
      log('StrategyAgent', 'Planning flyer creation...'),
      log('DesignAgent', 'Generating content blocks...'),
      log('DesignAgent', 'Artifact created: Flyer — Dog Food — Dog Reading at B'),
      log('VoiceAgent', 'Done. 6 blocks generated.'),
    ],
    artifactId: artifact.id,
    artifactVersion: 1,
  };

  useRunStore.getState().addRun(demoRun);
  useBatteryStore.getState().spend(2);
}
