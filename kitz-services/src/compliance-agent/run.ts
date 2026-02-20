import { collectPanamaFindings } from './collectors.js';
import { normalizeFindings } from './normalizer.js';
import { publishComplianceContent } from './publisher.js';
import { writeComplianceData } from './storage.js';

export const runCompliancePipeline = async (): Promise<{ changedFiles: string[]; updateCount: number }> => {
  const findings = await collectPanamaFindings();
  const updates = normalizeFindings(findings);
  await writeComplianceData('Panama', updates);
  const changedFiles = await publishComplianceContent('Panama', updates);
  return { changedFiles, updateCount: updates.length };
};
