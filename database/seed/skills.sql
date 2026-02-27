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
  ('office-automation',    'Office Automation',     'Generate invoices, reports, contracts, and spreadsheets',          'productivity',  'sonnet', 1.0),
  -- SOP-based skills
  ('inbox-triage',         'Inbox Triage',          'Classify inbound messages by intent, urgency, sentiment, and route', 'operations',   'haiku',  0.3),
  ('customer-onboarding',  'Customer Onboarding',   'Guide new customers to first value in <10 minutes',                 'operations',   'sonnet', 1.0),
  ('order-fulfillment',    'Order Fulfillment',     'Orchestrate end-to-end order processing with notifications',        'operations',   'haiku',  0.5),
  ('payment-collection',   'Payment Collection',    'Generate payment reminder schedules with escalating tone',           'operations',   'haiku',  0.5),
  ('lead-qualification',   'Lead Qualification',    'Score and qualify leads (hot/warm/cold) with conversion signals',    'intelligence', 'haiku',  0.3),
  -- Creative + production skills
  ('doc-scanner',          'Document Scanner',      'Extract structured data from images/PDFs (receipts, invoices, IDs)', 'intelligence', 'haiku',  0.5),
  ('image-generation',     'Image Generation',      'Create marketing visuals via DALL-E 3',                              'content',      'sonnet', 2.0),
  ('deck-generation',      'Deck Generation',       'Generate slide presentations from context',                          'content',      'sonnet', 1.5),
  ('website-builder',      'Website Builder',       'Generate landing pages and websites with SEO',                       'content',      'sonnet', 2.0),
  ('flyer-promo',          'Flyer & Promo',         'Generate promotional material specs (flyers, banners, posters)',     'content',      'sonnet', 1.0),
  -- Knowledge-based skills (books + frameworks)
  ('direct-response-marketing', 'Direct Response Marketing', 'Dan Kennedy direct response campaigns and sales letters',     'intelligence', 'sonnet', 1.0),
  ('principles-advisor',        'Principles Advisor',        'Ray Dalio decision-making and economic analysis frameworks',   'intelligence', 'sonnet', 1.0),
  ('negotiation-advisor',       'Negotiation Advisor',       'Chris Voss tactical empathy negotiation coaching with scripts', 'intelligence', 'sonnet', 1.0),
  ('growth-mindset-coach',      'Growth Mindset Coach',      'Carol Dweck mindset + James Clear atomic habits coaching',     'intelligence', 'sonnet', 1.0),
  ('lean-startup-advisor',      'Lean Startup Advisor',      'Eric Ries + Y Combinator PMF assessment and startup coaching', 'intelligence', 'sonnet', 1.0),
  ('offers-designer',           'Offers Designer',           'Alex Hormozi $100M Offers value equation and lead generation', 'intelligence', 'sonnet', 1.0),
  ('funnel-architect',          'Funnel Architect',          'Russell Brunson sales funnels, value ladder, and traffic',      'intelligence', 'sonnet', 1.0),
  ('strategic-planner',         'Strategic Planner',         'Rumelt + Sun Tzu + Musashi + Machiavelli strategic planning',   'intelligence', 'sonnet', 1.0),
  ('power-dynamics-advisor',    'Power Dynamics Advisor',    'Robert Greene 48 Laws, 33 Strategies, Human Nature, Mastery',  'intelligence', 'sonnet', 1.0),
  ('relationship-builder',      'Relationship Builder',      'Dale Carnegie 30 principles for influence and relationships',  'intelligence', 'sonnet', 1.0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  credits_per_use = EXCLUDED.credits_per_use,
  updated_at = now();
