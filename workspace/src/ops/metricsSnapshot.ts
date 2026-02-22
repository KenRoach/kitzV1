import app from '../index.js';

export interface OpsMetrics {
  generatedAt: string;
  p95LatencyByRoute: Array<{ route: string; requests: number; errorRate: number; p95LatencyMs: number }>;
  errorRateByRoute: Array<{ route: string; errorRate: number }>;
  authFailures: number;
  conversion: {
    visitorToSignup: number;
    signupToFirstAction: number;
    visitorToFirstAction: number;
  };
  featureUsageTop10: Array<{ feature: string; count: number }>;
  topFeedbackTags: Array<{ tag: string; count: number }>;
  confusingStepDropoff: number;
  manualModeAlwaysAvailable: boolean;
  aiModeGatedByCredits: boolean;
}

export const fetchOpsMetrics = async (): Promise<OpsMetrics> => {
  await app.ready();
  const response = await app.inject({ method: 'GET', url: '/api/ops/metrics' });
  return response.json();
};
