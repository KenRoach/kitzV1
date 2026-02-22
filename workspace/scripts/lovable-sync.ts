import { promises as fs } from 'node:fs';
import path from 'node:path';

type LovablePayload = {
  type: 'ops_update';
  source: 'workspace';
  timestamp: string;
  summary: string;
  changed_files: string[];
};

const queuePath = path.resolve(process.cwd(), '../docs/ops/lovable-sync-queue.md');

const writeQueueFallback = async (payload: LovablePayload): Promise<void> => {
  const lines = [
    `## ${payload.timestamp}`,
    `- Summary: ${payload.summary}`,
    `- Changed files: ${payload.changed_files.join(', ')}`,
    `- Action: Paste/update this payload in Lovable if webhook sync is unavailable.`,
    ''
  ].join('\n');

  const existing = await fs.readFile(queuePath, 'utf8').catch(() => '# Lovable Sync Queue\n\n');
  await fs.writeFile(queuePath, `${existing.trim()}\n\n${lines}`, 'utf8');
};

export const pushUpdateToLovable = async (summary: string, changedFiles: string[]): Promise<void> => {
  const payload: LovablePayload = {
    type: 'ops_update',
    source: 'workspace',
    timestamp: new Date().toISOString(),
    summary,
    changed_files: changedFiles
  };

  const webhookUrl = process.env.LOVABLE_WEBHOOK_URL;
  const webhookToken = process.env.LOVABLE_WEBHOOK_TOKEN;

  if (!webhookUrl || !webhookToken) {
    await writeQueueFallback(payload);
    console.log('Lovable webhook not configured; queued manual sync payload.');
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${webhookToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await writeQueueFallback(payload);
    throw new Error(`Lovable sync failed with status ${response.status}. Payload queued for manual sync.`);
  }

  console.log('Lovable sync pushed successfully.');
};
