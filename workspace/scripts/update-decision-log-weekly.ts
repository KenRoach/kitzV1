import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fetchOpsMetrics } from '../src/ops/metricsSnapshot.js';
import { pushUpdateToLovable } from './lovable-sync.js';

const decisionLogPath = path.resolve(process.cwd(), '../docs/ops/decision-log.md');
const feedbackPath = path.resolve(process.cwd(), '../docs/ops/feedback-tags.json');

const run = async (): Promise<void> => {
  const metrics = await fetchOpsMetrics();
  const date = new Date().toISOString().slice(0, 10);

  let feedbackTags: Array<{ tag: string; count: number }> = [];
  try {
    const feedbackRaw = await fs.readFile(feedbackPath, 'utf8');
    feedbackTags = JSON.parse(feedbackRaw) as Array<{ tag: string; count: number }>;
  } catch {
    feedbackTags = metrics.topFeedbackTags;
  }

  const topFeedback = (feedbackTags.length ? feedbackTags : metrics.topFeedbackTags).slice(0, 3);
  const topRoute = metrics.p95LatencyByRoute[0];
  const topFeature = metrics.featureUsageTop10[0];

  const correlation = [
    `## ${date} — Weekly feedback/metrics correlation`,
    `- **Feedback tags (top):** ${topFeedback.map((t) => `${t.tag} (${t.count})`).join(', ') || 'none'}`,
    `- **Metric reference:** confusingStepDropoff=${metrics.confusingStepDropoff}, visitor→signup=${metrics.conversion.visitorToSignup}`,
    `- **Performance reference:** ${topRoute ? `${topRoute.route} p95=${topRoute.p95LatencyMs}ms` : 'no route sample yet'}`,
    `- **Usage reference:** ${topFeature ? `${topFeature.feature} (${topFeature.count})` : 'no feature usage sample yet'}`,
    '- **Decision:** Prioritize fixes where feedback tags and drop-off/performance indicate friction.'
  ].join('\n');

  const current = await fs.readFile(decisionLogPath, 'utf8');
  if (current.includes(`## ${date} — Weekly feedback/metrics correlation`)) {
    console.log('Decision log already contains this weekly correlation entry.');
    return;
  }

  await fs.writeFile(decisionLogPath, `${current.trim()}\n\n${correlation}\n`, 'utf8');
  await pushUpdateToLovable('Weekly feedback-metrics correlation updated.', ['docs/ops/decision-log.md']);
  console.log('Decision log weekly correlation entry added.');
};

run().catch((error) => {
  console.error('Failed updating decision log', error);
  process.exit(1);
});
