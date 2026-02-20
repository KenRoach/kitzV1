/**
 * Cadence Engine — Schedules daily/weekly/monthly/quarterly reports.
 *
 * Uses node-cron for scheduling.
 * Each cadence queries real data via MCP and generates structured reports.
 */

import type { KitzKernel } from '../kernel.js';
import { generateDailyBrief } from './daily.js';
import { generateWeeklyScorecard } from './weekly.js';

export type CadenceType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface CadenceReport {
  cadence: CadenceType;
  generatedAt: string;
  period: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  whatsappFormatted: string;
}

export class CadenceEngine {
  constructor(private kernel: KitzKernel) {}

  start(): void {
    // In production, use node-cron:
    // cron.schedule('0 7 * * *', () => this.runCadence('daily'));    // 7 AM daily
    // cron.schedule('0 8 * * 1', () => this.runCadence('weekly'));   // 8 AM Monday
    // cron.schedule('0 9 1 * *', () => this.runCadence('monthly')); // 9 AM 1st
    console.log('[cadence] Engine started (schedules not active in dev mode)');
  }

  async runCadence(cadence: CadenceType): Promise<CadenceReport> {
    const now = new Date();

    switch (cadence) {
      case 'daily':
        return generateDailyBrief(this.kernel);
      case 'weekly':
        return generateWeeklyScorecard(this.kernel);
      default:
        return {
          cadence,
          generatedAt: now.toISOString(),
          period: `${cadence} report`,
          sections: [{ title: 'Coming Soon', content: `${cadence} reports will be available in beta.` }],
          whatsappFormatted: `📊 *${cadence.toUpperCase()} REPORT*\n\nComing soon in beta.`,
        };
    }
  }
}
