/**
 * Ops agent — Order pipeline analysis, SLA flagging.
 * Called by weekly cron. Produces structured ops report.
 */

import { llmHubClient } from '../llm/hubClient.js';
import { toolRegistry } from '../tools/registry.js';

export interface OpsReport {
  date: string;
  openOrders: number;
  agingOrders: number;
  slaViolations: string[];
  summary: string;
}

export const opsAgent = {
  name: 'Ops',

  async run(traceId: string): Promise<OpsReport> {
    const date = new Date().toISOString().slice(0, 10);

    // 1. Get open orders with aging info
    let ordersData: Record<string, unknown> = {};
    try {
      ordersData = (await toolRegistry.invoke('orders.getOpenOrders', { includeAging: true }, traceId)) as Record<string, unknown>;
    } catch {
      ordersData = { orders: [], total: 0 };
    }

    const orders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
    const agingOrders = orders.filter((o: any) => {
      if (!o?.createdAt) return false;
      const ageMs = Date.now() - new Date(o.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      return ageDays > 3;
    });

    const slaViolations = agingOrders
      .filter((o: any) => {
        const ageMs = Date.now() - new Date(o.createdAt).getTime();
        return ageMs > 7 * 24 * 60 * 60 * 1000; // > 7 days
      })
      .map((o: any) => String(o?.id || o?.orderId || 'unknown'))
      .slice(0, 10);

    // 2. LLM analysis
    let summary = '';
    try {
      const response = await llmHubClient.complete(
        'summarizing',
        `Operations report: ${orders.length} open orders, ${agingOrders.length} aging (>3 days), ` +
          `${slaViolations.length} SLA violations (>7 days). ` +
          `Write a 2-3 sentence ops brief highlighting bottlenecks and recommended actions.`,
        traceId,
      );
      summary = (response as { text?: string })?.text || 'Ops review completed.';
    } catch {
      summary = `Ops: ${orders.length} open, ${agingOrders.length} aging, ${slaViolations.length} SLA violations.`;
    }

    return {
      date,
      openOrders: orders.length,
      agingOrders: agingOrders.length,
      slaViolations,
      summary,
    };
  },
};
