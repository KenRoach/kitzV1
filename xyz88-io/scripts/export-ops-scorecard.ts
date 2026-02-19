import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fetchOpsMetrics } from '../src/ops/metricsSnapshot.js';
import { pushUpdateToLovable } from './lovable-sync.js';

const scorecardPath = path.resolve(process.cwd(), '../docs/ops/weekly-scorecard.md');

const upsertSection = (content: string, section: string): string => {
  const start = '<!-- NIGHTLY_SNAPSHOT_START -->';
  const end = '<!-- NIGHTLY_SNAPSHOT_END -->';
  if (!content.includes(start) || !content.includes(end)) {
    return `${content}\n\n${start}\n${section}\n${end}\n`;
  }

  return content.replace(new RegExp(`${start}[\\s\\S]*?${end}`, 'm'), `${start}\n${section}\n${end}`);
};

const run = async (): Promise<void> => {
  const metrics = await fetchOpsMetrics();
  const topRoutes = metrics.p95LatencyByRoute.slice(0, 5).map((item) => `- ${item.route}: p95 ${item.p95LatencyMs}ms, errorRate ${item.errorRate}`);
  const topFeatures = metrics.featureUsageTop10.map((item) => `- ${item.feature}: ${item.count}`);

  const section = [
    `## Nightly Snapshot (${metrics.generatedAt})`,
    '',
    `- Auth failures: ${metrics.authFailures}`,
    `- Confusing step dropoff: ${metrics.confusingStepDropoff}`,
    `- Conversion visitor→signup: ${metrics.conversion.visitorToSignup}`,
    `- Conversion signup→first-action: ${metrics.conversion.signupToFirstAction}`,
    '',
    '### Route performance (top sampled)',
    ...topRoutes,
    '',
    '### Feature usage (top 10)',
    ...topFeatures
  ].join('\n');

  const current = await fs.readFile(scorecardPath, 'utf8');
  const updated = upsertSection(current, section);
  await fs.writeFile(scorecardPath, updated, 'utf8');
  await pushUpdateToLovable('Nightly ops scorecard snapshot updated.', ['docs/ops/weekly-scorecard.md']);
  console.log('Scorecard snapshot updated.');
};

run().catch((error) => {
  console.error('Failed to export scorecard snapshot', error);
  process.exit(1);
});
