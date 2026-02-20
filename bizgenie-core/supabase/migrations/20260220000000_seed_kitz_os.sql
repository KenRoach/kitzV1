-- ══════════════════════════════════════════════════════════
-- KITZ OS Seed Data — Idempotent
-- Run via: Supabase SQL Editor or supabase db push
-- ══════════════════════════════════════════════════════════

-- 1. Business record
INSERT INTO public.businesses (id, name, slug, description, industry, website)
VALUES (
  '134f52d0-90a3-4806-a1bd-c37ef31d4f6f',
  'Kitz',
  'kitz',
  'AI Business Operating System',
  'technology',
  'https://kitz.io'
) ON CONFLICT (id) DO NOTHING;

-- 2. Agent configurations
INSERT INTO public.agent_configurations (business_id, agent_type, name, system_prompt, is_active, config)
VALUES
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'ceo', 'CEO Agent', 'You are the CEO strategic advisor. Focus on vision, strategy, and high-impact decisions.', true, '{"email_identity":{"address":"ceo@agents.kitz.io","can_write_email":false}}'::jsonb),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'sales', 'Sales Agent', 'You are the Sales Agent. Focus on pipeline, follow-ups, and conversion.', true, '{"email_identity":{"address":"sales@agents.kitz.io","can_write_email":false}}'::jsonb),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'ops', 'Ops Agent', 'You are the Operations Agent. Focus on fulfillment, delivery, and efficiency.', true, '{"email_identity":{"address":"ops@agents.kitz.io","can_write_email":false}}'::jsonb),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'cfo', 'CFO Agent', 'You are the CFO Agent. Focus on revenue, margins, and financial health.', true, '{"email_identity":{"address":"cfo@agents.kitz.io","can_write_email":false}}'::jsonb),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'support', 'Support Agent', 'You are the Support Agent. Focus on customer satisfaction and retention.', true, '{"email_identity":{"address":"support@agents.kitz.io","can_write_email":false}}'::jsonb),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'marketing', 'Marketing Agent', 'You are the Marketing Agent. Focus on growth, content, and brand.', true, '{"email_identity":{"address":"marketing@agents.kitz.io","can_write_email":false}}'::jsonb),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'admin_assistant', 'Administrative Assistant', 'You are the Administrative Assistant. You are the SOLE agent authorized to compose and send emails. All email operations are logged.', true, '{"email_identity":{"address":"admin@agents.kitz.io","can_write_email":true},"permissions":["email:write","email:read","audit:read","braindump:process"]}'::jsonb),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'fact_checker', 'Compliance Fact-Checker', 'You are the Compliance Fact-Checker. Verify outbound messages contain ONLY truthful, verifiable information.', true, '{"email_identity":{"address":"compliance@agents.kitz.io","can_write_email":false},"permissions":["data:read","compliance:validate"]}'::jsonb)
ON CONFLICT DO NOTHING;

-- 3. Emergency controls
INSERT INTO public.emergency_controls (business_id, control_type, is_engaged, reason)
VALUES
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'kill_switch', false, 'System operational'),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'global_throttle', false, 'No throttle active'),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f', 'ai_battery', false, 'Battery charged')
ON CONFLICT DO NOTHING;

-- 4. Tool registry
INSERT INTO public.tool_registry (business_id, name, description, risk_level, rate_limit_per_hour, is_verified) VALUES
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','list_contacts','List CRM contacts','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','get_contact','Get single contact','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','create_contact','Create new contact','medium',30,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','update_contact','Update contact','medium',30,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','list_orders','List orders','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','get_order','Get single order','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','create_order','Create order','medium',20,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','update_order','Update order','medium',20,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','list_goals','List goals','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','create_goal','Create goal','medium',20,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','list_knowledge','List knowledge','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','add_knowledge','Add knowledge','low',50,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','business_summary','Business overview','low',50,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','list_audit_log','List audit trail','low',50,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','list_agents','List agents','low',50,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','create_storefront','Create storefront','medium',30,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','update_storefront','Update storefront','medium',30,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','delete_storefront','Delete storefront','critical',5,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','mark_storefront_paid','Mark paid transaction','high',20,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','send_storefront','Send storefront link','medium',30,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','create_product','Create product','medium',30,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','update_product','Update product','medium',30,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','delete_product','Delete product','critical',5,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','dashboard_metrics','Dashboard KPIs','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','list_inbox_messages','Read inbox','low',100,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','braindump_process','Process brain dump','medium',20,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','doc_scan','Scan document','medium',20,true),
  ('134f52d0-90a3-4806-a1bd-c37ef31d4f6f','compliance_factCheck','Fact check message','low',50,true)
ON CONFLICT DO NOTHING;

-- 5. Default OpenClaw config
INSERT INTO public.openclaw_configs (business_id, name, description, is_active, max_loops, credit_cost_per_run, allowed_tools)
VALUES (
  '134f52d0-90a3-4806-a1bd-c37ef31d4f6f',
  'default',
  'Default KITZ OS execution config',
  true,
  8,
  1,
  ARRAY['list_contacts','get_contact','list_orders','list_goals','list_knowledge','add_knowledge','business_summary','list_audit_log','list_agents','dashboard_metrics']
) ON CONFLICT DO NOTHING;
