import { z } from 'zod';

export const complianceSourceSchema = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  published_at: z.string().date().nullable()
});

export const complianceUpdateSchema = z.object({
  country: z.literal('Panama'),
  regulatory_body: z.enum(['DGI', 'Panama Emprende', 'Registro Público', 'MITRADEL', 'CSS']),
  update_type: z.enum(['tax', 'invoicing', 'privacy', 'labor', 'corporate', 'none']),
  summary_simple: z.string().min(10),
  operational_impact: z.string().min(10),
  required_action: z.array(z.string()).min(1),
  deadline: z.string().date().nullable(),
  risk_level: z.enum(['Low', 'Medium', 'Critical']),
  sources: z.array(complianceSourceSchema).min(1),
  detected_at: z.string().datetime()
});

export const complianceUpdateListSchema = z.array(complianceUpdateSchema).min(1);
