import { complianceUpdateListSchema } from './schema.js';
import type { ComplianceUpdate, RawFinding } from './types.js';

const hasMeaningfulChange = (finding: RawFinding): boolean => {
  const t = finding.text.toLowerCase();
  return ['nuevo', 'resolución', 'decreto', 'actualización', 'obligación', 'factura', 'impuesto', 'plazo'].some((k) => t.includes(k));
};

const summarize = (finding: RawFinding): ComplianceUpdate => ({
  country: 'Panama',
  regulatory_body: finding.regulatory_body,
  update_type: finding.update_type,
  summary_simple: `The ${finding.regulatory_body} posted an update: ${finding.title}. Please review the official source link below.`,
  operational_impact: `Kitz operations in Panama should verify if this affects billing, labor processes, or business filing steps in workspace.kitz.services and admin workflows.`,
  required_action: [
    'Open the official source and confirm if the update applies to your business.',
    'Record impacted workflow in admin-kitz-services approvals/audit.',
    'Update customer-facing guidance if forms, deadlines, or tax flows changed.'
  ],
  deadline: finding.date,
  risk_level: finding.update_type === 'tax' || finding.update_type === 'labor' ? 'Medium' : 'Low',
  sources: [{ title: finding.title, url: finding.url, published_at: finding.date }],
  detected_at: new Date().toISOString()
});

export const normalizeFindings = (findings: RawFinding[]): ComplianceUpdate[] => {
  const changes = findings.filter(hasMeaningfulChange).map(summarize);
  const output = changes.length > 0
    ? changes
    : [{
        country: 'Panama',
        regulatory_body: 'DGI',
        update_type: 'none',
        summary_simple: 'No major regulatory change was detected in this run. Keep monitoring official portals.',
        operational_impact: 'No immediate workflow change required for workspace.kitz.services or Kitz operations.',
        required_action: ['Continue regular monitoring and keep records of each run.'],
        deadline: null,
        risk_level: 'Low',
        sources: [
          { title: 'DGI Official Portal', url: 'https://dgi.mef.gob.pa/', published_at: null },
          { title: 'Panama Emprende Official Portal', url: 'https://www.panamaemprende.gob.pa/', published_at: null },
          { title: 'MITRADEL Official Portal', url: 'https://www.mitradel.gob.pa/', published_at: null },
          { title: 'CSS Official Portal', url: 'https://w3.css.gob.pa/', published_at: null }
        ],
        detected_at: new Date().toISOString()
      } satisfies ComplianceUpdate];

  return complianceUpdateListSchema.parse(output);
};
