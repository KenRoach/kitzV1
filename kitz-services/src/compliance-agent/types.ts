export type RegulatoryBody = 'DGI' | 'Panama Emprende' | 'Registro Público' | 'MITRADEL' | 'CSS';
export type UpdateType = 'tax' | 'invoicing' | 'privacy' | 'labor' | 'corporate' | 'none';
export type RiskLevel = 'Low' | 'Medium' | 'Critical';

export interface ComplianceSource {
  title: string;
  url: string;
  published_at: string | null;
}

export interface ComplianceUpdate {
  country: 'Panama';
  regulatory_body: RegulatoryBody;
  update_type: UpdateType;
  summary_simple: string;
  operational_impact: string;
  required_action: string[];
  deadline: string | null;
  risk_level: RiskLevel;
  sources: ComplianceSource[];
  detected_at: string;
}

export interface RawFinding {
  regulatory_body: RegulatoryBody;
  update_type: Exclude<UpdateType, 'none'>;
  title: string;
  url: string;
  date: string | null;
  text: string;
}
