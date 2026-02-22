import { fetchOpsMetrics } from '../src/ops/metricsSnapshot.js';

const errorThreshold = Number(process.env.ERROR_RATE_ALERT_THRESHOLD || 0.05);
const authFailureThreshold = Number(process.env.AUTH_FAILURE_ALERT_THRESHOLD || 25);

const run = async (): Promise<void> => {
  const metrics = await fetchOpsMetrics();
  const spikingRoutes = metrics.errorRateByRoute.filter((item) => item.errorRate >= errorThreshold);
  const authSpike = metrics.authFailures >= authFailureThreshold;

  const alerts: string[] = [];
  if (spikingRoutes.length > 0) alerts.push(`Error-rate spike on routes: ${spikingRoutes.map((r) => `${r.route}=${r.errorRate}`).join(', ')}`);
  if (authSpike) alerts.push(`Auth failures spike: ${metrics.authFailures}`);

  if (alerts.length > 0) {
    console.error(`[ALERT ${new Date().toISOString()}] ${alerts.join(' | ')}`);
    process.exit(2);
  }

  console.log(`[OK ${new Date().toISOString()}] Alert thresholds not exceeded.`);
};

run().catch((error) => {
  console.error('Threshold check failed', error);
  process.exit(1);
});
