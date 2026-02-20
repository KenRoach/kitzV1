import { execSync } from 'node:child_process';
import { runCompliancePipeline } from '../src/compliance-agent/run.js';

const run = async (): Promise<void> => {
  const result = await runCompliancePipeline();
  const branch = `compliance/panama-${new Date().toISOString().slice(0, 10)}`;

  try {
    execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });
  } catch {
    execSync(`git checkout ${branch}`, { stdio: 'inherit' });
  }

  execSync('git add data/compliance-updates content/compliance', { stdio: 'inherit' });

  try {
    execSync('git commit -m "chore(compliance): publish latest Panama regulatory update"', { stdio: 'inherit' });
  } catch {
    console.log('No compliance content changes to commit.');
    return;
  }

  const prBody = [
    'Automated compliance content update for Panama.',
    '',
    `Changed files: ${result.changedFiles.join(', ')}`,
    'Sources are official regulatory portals and embedded in the generated content.'
  ].join('\n');

  try {
    execSync(`gh pr create --title "chore(compliance): Panama updates" --body "${prBody}"`, { stdio: 'inherit' });
  } catch {
    console.log('Unable to open PR automatically. Push branch and open PR manually.');
  }
};

run().catch((error) => {
  console.error('Compliance run failed', error);
  process.exit(1);
});
