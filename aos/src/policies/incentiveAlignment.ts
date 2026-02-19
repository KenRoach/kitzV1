import type { AOSEvent } from '../types.js';

export function detectAlignmentWarnings(event: AOSEvent): string[] {
  if (event.type !== 'KPI_CHANGED') return [];
  const kpi = event.payload as Record<string, number>;
  const warnings: string[] = [];
  if ((kpi.revenueDelta ?? 0) > 0 && (kpi.marginDelta ?? 0) < 0) warnings.push('Revenue up + Margin down conflict');
  if ((kpi.growthDelta ?? 0) > 0 && (kpi.churnDelta ?? 0) > 0) warnings.push('Growth up + Churn up conflict');
  if ((kpi.speedDelta ?? 0) > 0 && (kpi.incidentsDelta ?? 0) > 0) warnings.push('Speed up + Incidents up conflict');
  return warnings;
}
