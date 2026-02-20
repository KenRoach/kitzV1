import { createAOS } from './index.js';
import { DailyOpsWorkflow, IncidentWorkflow, WeeklyBoardPacketWorkflow } from './runners/workflows.js';

async function main(): Promise<void> {
  const [command, option, value] = process.argv.slice(2);
  const aos = createAOS();

  if (command === 'daily') {
    await DailyOpsWorkflow(aos.bus);
    console.log('Daily workflow complete. ORG digest published.');
    return;
  }

  if (command === 'weekly-board') {
    await WeeklyBoardPacketWorkflow(aos.bus);
    console.log('Weekly board workflow complete.');
    return;
  }

  if (command === 'simulate' && option === '--event') {
    if (value === 'INCIDENT_DETECTED') {
      await aos.bus.publish({ type: 'INCIDENT_DETECTED', source: 'cli', severity: 'high', payload: { summary: 'Simulated incident' } });
      await IncidentWorkflow(aos.bus, aos.registry, aos.memory);
      console.log('Incident simulated: owner assigned + PSA proposal generated.');
      return;
    }
    await aos.bus.publish({ type: value, source: 'cli', severity: 'medium', payload: { simulated: true } });
    console.log(`Simulated ${value}.`);
    return;
  }

  console.log('Usage: node aos/run daily | weekly-board | simulate --event INCIDENT_DETECTED');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
