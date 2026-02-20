import { execSync } from 'node:child_process';

process.env.NODE_ENV = 'test';

const runCommand = (command: string): void => {
  execSync(command, { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
};

const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};

const smokeRoutes = async (): Promise<void> => {
  const mod = await import('../src/index.js');
  const app = mod.default;

  await app.ready();

  const leads = await app.inject({ method: 'GET', url: '/leads' });
  assert(leads.statusCode === 200, 'GET /leads must return 200');
  assert(leads.body.includes('Manual mode is always available'), 'Manual mode copy missing from /leads');

  const aiDirection = await app.inject({ method: 'GET', url: '/ai-direction' });
  assert(aiDirection.statusCode === 200, 'GET /ai-direction must return 200');
  assert(aiDirection.body.includes('disabled'), 'AI direction button must render disabled state');

  const checkout = await app.inject({ method: 'GET', url: '/checkout-links' });
  assert(checkout.statusCode === 200, 'GET /checkout-links must return 200');

  await app.inject({ method: 'POST', url: '/api/funnel/signup' });
  await app.inject({ method: 'POST', url: '/api/funnel/first-action' });
  await app.inject({ method: 'POST', url: '/api/funnel/confusing-step' });
  await app.inject({ method: 'POST', url: '/api/feedback/tag', payload: { tag: 'validation' } });

  const metrics = await app.inject({ method: 'GET', url: '/api/ops/metrics' });
  assert(metrics.statusCode === 200, 'GET /api/ops/metrics must return 200');
  const payload = metrics.json();
  assert(payload.manualModeAlwaysAvailable === true, 'manualModeAlwaysAvailable must remain true');
  assert(payload.aiModeGatedByCredits === true, 'aiModeGatedByCredits must remain true');

  await app.close();
};

const run = async (): Promise<void> => {
  runCommand('npm run typecheck');
  runCommand('npm run lint');
  runCommand('npm test');
  runCommand('npm run ops:export-scorecard');
  runCommand('npm run ops:check-alerts');
  runCommand('npm run ops:update-decision-log');
  await smokeRoutes();
  console.log('Full validation completed successfully.');
};

run().catch((error) => {
  console.error('Full validation failed', error);
  process.exit(1);
});
