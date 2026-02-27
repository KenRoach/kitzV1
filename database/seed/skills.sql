-- Seed data for brain skills
INSERT INTO skills (slug, name, description, category, tier, credits_per_use) VALUES
  -- Existing skills
  ('call-transcription',   'Call Transcription',    'Transcribe voice calls and audio messages using AI',              'communication', 'haiku',  0.5),
  ('email-drafter',        'Email Drafter',         'Generate professional email drafts from context',                 'communication', 'sonnet', 1.0),
  ('sentiment-analysis',   'Sentiment Analysis',    'Analyze customer message sentiment and urgency',                  'intelligence',  'haiku',  0.3),
  ('smart-reply',          'Smart Reply',           'Generate quick reply options for WhatsApp conversations',         'communication', 'haiku',  0.3),
  -- New skills
  ('voice-brain-dump',     'Voice Brain Dump',      'Transform voice memos into structured tasks, ideas, and notes',   'productivity',  'sonnet', 1.0),
  ('video-creation',       'Video Creation',        'Generate programmatic video specs via Remotion for social media',  'content',       'sonnet', 2.0),
  ('browser-agent',        'Browser Agent',         'Plan and execute AI-powered web browser automation tasks',         'automation',    'sonnet', 1.5),
  ('content-creation',     'Content Creation',      'Create marketing content for WhatsApp, Instagram, and more',      'content',       'sonnet', 1.0),
  ('office-automation',    'Office Automation',     'Generate invoices, reports, contracts, and spreadsheets',          'productivity',  'sonnet', 1.0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  credits_per_use = EXCLUDED.credits_per_use,
  updated_at = now();
