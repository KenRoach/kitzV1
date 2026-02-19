import { DailyOpsWorkflow, WeeklyBoardPacketWorkflow } from './workflows.js';
import type { EventBus } from '../eventBus.js';

export async function runScheduled(eventBus: EventBus, cadence: 'daily' | 'weekly-board'): Promise<void> {
  if (cadence === 'daily') return DailyOpsWorkflow(eventBus);
  return WeeklyBoardPacketWorkflow(eventBus);
}
