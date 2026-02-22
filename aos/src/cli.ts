import { createAOS } from './index.js';
import { DailyOpsWorkflow, WeeklyBoardPacketWorkflow } from './runners/workflows.js';

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

  if (command === 'launch') {
    // Build a default launch context for CLI usage
    const ctx = {
      killSwitch: false,
      toolCount: 68,
      systemStatus: 'online',
      aiKeysConfigured: true,
      batteryRemaining: 5,
      batteryDailyLimit: 5,
      batteryDepleted: false,
      servicesHealthy: ['kitz_os', 'workspace', 'kitz-gateway', 'kitz-whatsapp-connector'],
      servicesDown: [],
      campaignProfileCount: 10,
      campaignTemplateLanguages: ['es', 'en'],
      draftFirstEnforced: true,
      webhookCryptoEnabled: false,
      rateLimitingEnabled: true,
      jwtAuthEnabled: true,
      semanticRouterActive: true,
      whatsappConnectorConfigured: true,
      workspaceMcpConfigured: true,
      cadenceEngineEnabled: true,
      funnelStagesDefined: 10,
      activationTargetMinutes: 10,
      pricingTiersDefined: 3,
      freeToPathDefined: true,
    };
    const result = await aos.runLaunchReview(ctx);
    const d = result.decision;
    console.log(`\n${d.approved ? '🚀 LAUNCH APPROVED' : '🛑 LAUNCH BLOCKED'}`);
    console.log(`Votes: ${d.totalGo} GO | ${d.totalNoGo} NO-GO | ${d.totalConditional} CONDITIONAL`);
    console.log(`\nCEO Decision:\n${d.summary}\n`);
    for (const r of d.reviews) {
      const icon = r.vote === 'go' ? '🟢' : r.vote === 'no-go' ? '🔴' : '🟡';
      console.log(`${icon} ${r.role} — ${r.vote} (${r.confidence}%)`);
    }
    return;
  }

  if (command === 'simulate' && option === '--event') {
    await aos.bus.publish({ type: value, source: 'cli', severity: 'medium', payload: { simulated: true } });
    console.log(`Simulated ${value}.`);
    return;
  }

  console.log('Usage: node aos/run daily | weekly-board | launch | simulate --event EVENT_TYPE');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
