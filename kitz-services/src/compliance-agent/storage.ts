import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ComplianceUpdate } from './types.js';

const baseDir = path.resolve(process.cwd(), 'data/compliance-updates');

const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

const atomicWrite = async (filePath: string, content: string): Promise<void> => {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, content, 'utf8');
  await fs.rename(tmpPath, filePath);
};

export const writeComplianceData = async (country: 'Panama', updates: ComplianceUpdate[]): Promise<void> => {
  const latestDir = path.join(baseDir, 'latest');
  const historyDir = path.join(baseDir, 'history');
  await ensureDir(latestDir);
  await ensureDir(historyDir);

  const latestPath = path.join(latestDir, `${country}.json`);
  const historyPath = path.join(historyDir, `${country}.ndjson`);

  await atomicWrite(latestPath, `${JSON.stringify({ country, updates }, null, 2)}\n`);
  const lines = updates.map((update) => JSON.stringify(update)).join('\n');
  await fs.appendFile(historyPath, `${lines}\n`, 'utf8');
};

export const readLatest = async (country: 'Panama'): Promise<ComplianceUpdate[]> => {
  const filePath = path.join(baseDir, 'latest', `${country}.json`);
  const content = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(content) as { updates: ComplianceUpdate[] };
  return parsed.updates;
};

export const readHistory = async (country: 'Panama', limit = 50): Promise<ComplianceUpdate[]> => {
  const filePath = path.join(baseDir, 'history', `${country}.ndjson`);
  const content = await fs.readFile(filePath, 'utf8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-limit)
    .map((line) => JSON.parse(line) as ComplianceUpdate);
};
