import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ComplianceUpdate } from './types.js';

const contentDir = path.resolve(process.cwd(), 'content/compliance');

const riskBadge = (risk: ComplianceUpdate['risk_level']): string => {
  if (risk === 'Critical') return '🟥 Critical';
  if (risk === 'Medium') return '🟨 Medium';
  return '🟩 Low';
};

export const publishComplianceContent = async (country: 'Panama', updates: ComplianceUpdate[]): Promise<string[]> => {
  await fs.mkdir(contentDir, { recursive: true });
  const latest = updates[updates.length - 1];

  const latestJsonPath = path.join(contentDir, 'latest.json');
  const countryMdPath = path.join(contentDir, `${country}.md`);
  const lovableNotesPath = path.join(contentDir, 'LOVABLE_UPDATE_INSTRUCTIONS.md');
  const patchPath = path.join(contentDir, 'LATEST_PATCH.md');

  await fs.writeFile(latestJsonPath, `${JSON.stringify({ country, updates }, null, 2)}\n`, 'utf8');
  await fs.writeFile(
    countryMdPath,
    `# ${country} Compliance Update\n\n` +
      `Last updated: ${latest.detected_at}\n\n` +
      `## Simple summary\n${latest.summary_simple}\n\n` +
      `## Operational impact\n${latest.operational_impact}\n\n` +
      `## What you need to do\n${latest.required_action.map((item) => `- [ ] ${item}`).join('\n')}\n\n` +
      `## Risk level\n${riskBadge(latest.risk_level)}\n\n` +
      `## Sources\n${latest.sources.map((source) => `- [${source.title}](${source.url})${source.published_at ? ` (${source.published_at})` : ''}`).join('\n')}\n`,
    'utf8'
  );

  const lovableSnippet = `Update the /compliance/panama page with:\n` +
    `- Last updated: ${latest.detected_at}\n` +
    `- Summary: ${latest.summary_simple}\n` +
    `- Checklist:\n${latest.required_action.map((item) => `  - ${item}`).join('\n')}\n` +
    `- Risk: ${latest.risk_level}\n` +
    `- Sources:\n${latest.sources.map((source) => `  - ${source.title}: ${source.url}`).join('\n')}\n`;

  await fs.writeFile(lovableNotesPath, `# Lovable Update Instructions\n\n${lovableSnippet}`, 'utf8');
  await fs.writeFile(
    patchPath,
    `# Compliance Patch\n\n${lovableSnippet}\n## Markdown payload\n\n${await fs.readFile(countryMdPath, 'utf8')}`,
    'utf8'
  );

  return [latestJsonPath, countryMdPath, lovableNotesPath, patchPath];
};
