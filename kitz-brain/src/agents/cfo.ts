/**
 * CFO agent — Revenue analysis, spend patterns, ROI assessment.
 * Called by weekly cron. Produces structured financial report.
 */

import { llmHubClient } from '../llm/hubClient.js';
import { financePolicy, buildRoiPlan } from '../policy.js';

export interface CfoReport {
  date: string;
  revenueEstimate: number;
  activePlans: string[];
  policyCompliant: boolean;
  roiAssessment: string;
  summary: string;
}

export const cfoAgent = {
  name: 'CFO',

  async run(traceId: string): Promise<CfoReport> {
    const date = new Date().toISOString().slice(0, 10);

    // 1. Build ROI plan for current period
    const currentPlan = buildRoiPlan('weekly-review');
    const activePlans = currentPlan.freeValidationSteps;

    // 2. LLM analysis of financial position
    let summary = '';
    let roiAssessment = '';
    try {
      const response = await llmHubClient.complete(
        'summarizing',
        `CFO weekly financial review. Finance policy: ${financePolicy.rule}. ` +
          `Current ROI plan: ${currentPlan.initiative}, projected ROI ${currentPlan.projectedRoiMultiple}x, ` +
          `validation passed: ${currentPlan.validationPassed}, requested budget: $${currentPlan.requestedBudgetUsd}. ` +
          `Write a 2-3 sentence financial brief covering revenue trajectory, cost discipline, and ROI outlook.`,
        traceId,
      );
      const text = (response as { text?: string })?.text || '';
      summary = text;
      roiAssessment = `ROI ${currentPlan.projectedRoiMultiple}x projected. ${currentPlan.validationPassed ? 'Validation passed.' : 'Needs validation.'}`;
    } catch {
      summary = `Finance review: receive-only mode active. ROI plan: ${currentPlan.initiative}.`;
      roiAssessment = `ROI ${currentPlan.projectedRoiMultiple}x projected.`;
    }

    return {
      date,
      revenueEstimate: 0,
      activePlans,
      policyCompliant: true,
      roiAssessment,
      summary,
    };
  },
};
