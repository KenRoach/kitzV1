import { createAOS } from '../index.js';

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  const aos = createAOS();

  if (command === 'simulate-event') {
    const eventType = args[0] ?? 'BUG_REPORTED';
    const event = await aos.bus.publish({
      type: eventType,
      source: 'cli',
      severity: 'medium',
      payload: { note: 'simulated' }
    });
    console.log(`Published event: ${event.type} (${event.id})`);
    return;
  }

  if (command === 'create-sample-ledger') {
    const task = aos.createTask({
      title: 'Investigate conversion drop',
      owner_agent: 'HeadGrowth',
      status: 'open',
      related_event_ids: []
    });
    aos.store.appendArtifact({ kind: 'task', data: task });

    const proposal = aos.createProposal({
      task_id: task.id,
      owner_agent: 'HeadGrowth',
      summary: 'Run signup flow simplification experiment',
      risk: 'low',
      related_event_ids: []
    });
    aos.store.appendArtifact({ kind: 'proposal', data: proposal });

    const decision = aos.createDecision({
      proposal_id: proposal.id,
      decision: 'approved',
      decided_by: 'Reviewer',
      rationale: 'Low-risk with clear KPI measurement.',
      related_event_ids: []
    });
    aos.store.appendArtifact({ kind: 'decision', data: decision });

    const outcome = aos.createOutcome({
      decision_id: decision.id,
      owner_agent: 'HeadGrowth',
      outcome: 'Experiment launched',
      kpi_impact: 'Pending',
      related_event_ids: []
    });
    aos.store.appendArtifact({ kind: 'outcome', data: outcome });

    console.log('Sample ledger artifacts created.');
    return;
  }

  if (command === 'digest') {
    await aos.networkingBot.publishOrgDigest();
    const lastEvent = aos.store.listEvents().at(-1);
    console.log('Digest published:', JSON.stringify(lastEvent, null, 2));
    return;
  }

  console.log('Usage: node aos/run simulate-event [EVENT_TYPE] | create-sample-ledger | digest');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
