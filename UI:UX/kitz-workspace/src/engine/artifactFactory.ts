import type { Artifact, ArtifactBlock, ArtifactType } from '../types';

let idCounter = 0;
const uid = () => `block-${++idCounter}`;

function flyerBlocks(details: string): ArtifactBlock[] {
  const topic = details || 'Premium Product';
  return [
    { id: uid(), type: 'image', content: '', meta: { alt: topic, placeholder: 'true' } },
    { id: uid(), type: 'heading', content: `${topic}` },
    { id: uid(), type: 'subheading', content: 'Crafted for those who expect more.' },
    { id: uid(), type: 'bullets', content: '- Premium quality, zero compromise\n- Trusted by 2,000+ happy customers\n- Free shipping on orders over $50\n- 100% satisfaction guaranteed' },
    { id: uid(), type: 'cta', content: 'Shop Now — Limited Stock' },
    { id: uid(), type: 'paragraph', content: 'Visit kitz.store/shop or DM us on WhatsApp for instant ordering.' },
  ];
}

function emailBlocks(details: string): ArtifactBlock[] {
  const brand = details || 'Your Brand';
  return [
    { id: uid(), type: 'heading', content: `Email Sequence — ${brand}` },
    {
      id: uid(), type: 'email',
      content: `Subject: Welcome to ${brand} — Here's what you need to know`,
      meta: { body: `Hi there!\n\nWelcome to ${brand}. We're thrilled to have you.\n\nHere's what makes us different:\n- Direct access to our team\n- Quality that speaks for itself\n- Community-first approach\n\nReply to this email anytime. We read every message.\n\nCheers,\nThe ${brand} Team` },
    },
    {
      id: uid(), type: 'email',
      content: `Subject: Your exclusive first look`,
      meta: { body: `Hey!\n\nAs a new member, you get first access to our latest drop.\n\nCheck out what's new: [Link]\n\nDon't sleep on it — these move fast.\n\n— ${brand}` },
    },
    {
      id: uid(), type: 'email',
      content: `Subject: How ${brand} customers are winning`,
      meta: { body: `Quick story:\n\nMaria from Panama City started using ${brand} 3 months ago. She's now generating 40% more repeat orders.\n\nHer secret? She automated her follow-ups with KITZ.\n\nWant the same results? Hit reply.\n\n— ${brand}` },
    },
    {
      id: uid(), type: 'email',
      content: `Subject: Last chance — 20% off ends tonight`,
      meta: { body: `This is it.\n\n20% off everything. Code: KITZ20\n\nExpires at midnight.\n\nNo extensions. No exceptions.\n\n→ Shop now: [Link]\n\n— ${brand}` },
    },
    {
      id: uid(), type: 'email',
      content: `Subject: We miss you — here's something special`,
      meta: { body: `It's been a minute.\n\nWe saved something for you: a free bonus with your next order.\n\nNo strings. Just our way of saying we appreciate you.\n\n→ Claim it here: [Link]\n\nAlways in your corner,\n${brand}` },
    },
  ];
}

function auditBlocks(): ArtifactBlock[] {
  return [
    { id: uid(), type: 'heading', content: 'Revenue Leak Audit' },
    { id: uid(), type: 'subheading', content: 'Identified Issues & Quick Wins' },
    { id: uid(), type: 'bullets', content: '- Cart abandonment rate: 68% (target: <40%)\n- No follow-up sequence for abandoned carts\n- Checkout page has 3 unnecessary form fields\n- Missing upsell on confirmation page\n- WhatsApp reply time avg: 4.2 hours (target: <15 min)\n- No reactivation campaign for dormant customers (180+ days)' },
    { id: uid(), type: 'divider', content: '' },
    { id: uid(), type: 'subheading', content: 'Recommended Actions' },
    { id: uid(), type: 'bullets', content: '1. Deploy cart abandonment email (est. +12% recovery)\n2. Remove optional fields from checkout (est. +8% conversion)\n3. Add one-click upsell to confirmation page (est. +$340/mo)\n4. Set up WhatsApp auto-reply for off-hours\n5. Launch win-back campaign for 180-day dormant segment\n6. A/B test pricing page layout' },
    { id: uid(), type: 'divider', content: '' },
    { id: uid(), type: 'subheading', content: 'Estimated Revenue Impact' },
    { id: uid(), type: 'paragraph', content: 'Projected monthly increase: $1,200–$2,800\nPayback period: < 2 weeks\nPriority: HIGH — start with items 1 and 4.' },
  ];
}

function waitlistBlocks(details: string): ArtifactBlock[] {
  const topic = details || 'your product launch';
  return [
    { id: uid(), type: 'heading', content: 'Be First in Line' },
    { id: uid(), type: 'subheading', content: `Something big is coming for ${topic}.` },
    { id: uid(), type: 'paragraph', content: "We're building something different. Not another generic tool — a system designed for hustlers who move fast and expect results." },
    { id: uid(), type: 'bullets', content: '- Early access before public launch\n- Founding member pricing (locked forever)\n- Direct line to the team\n- Shape the product with your feedback' },
    { id: uid(), type: 'cta', content: 'Join the Waitlist — 127 spots left' },
    { id: uid(), type: 'paragraph', content: 'No spam. Just one email when we launch. Unsubscribe anytime.' },
  ];
}

export function createArtifact(
  type: ArtifactType,
  details: string,
  name?: string
): Artifact {
  const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let blocks: ArtifactBlock[];
  let title: string;

  switch (type) {
    case 'flyer':
      blocks = flyerBlocks(details);
      title = name || `Flyer — ${details.slice(0, 30) || 'Untitled'}`;
      break;
    case 'email_sequence':
      blocks = emailBlocks(details);
      title = name || `Email Sequence — ${details.slice(0, 30) || 'Untitled'}`;
      break;
    case 'audit':
      blocks = auditBlocks();
      title = 'Revenue Leak Audit';
      break;
    case 'waitlist':
      blocks = waitlistBlocks(details);
      title = name || 'Waitlist Campaign';
      break;
    default:
      blocks = [{ id: uid(), type: 'paragraph', content: details }];
      title = 'Untitled';
  }

  return {
    id,
    name: title,
    type,
    versions: [
      {
        version: 1,
        createdAt: Date.now(),
        title,
        blocks,
        meta: { changeNote: 'Initial version', command: 'create' },
      },
    ],
    currentVersion: 1,
  };
}

export function makePremium(blocks: ArtifactBlock[]): ArtifactBlock[] {
  return blocks.map((b) => {
    const c = { ...b, id: uid() };
    if (b.type === 'heading') c.content = b.content.replace(/!+/g, '.').toUpperCase();
    if (b.type === 'subheading') c.content = 'The standard, elevated.';
    if (b.type === 'cta') c.content = 'Reserve Yours';
    if (b.type === 'paragraph') c.content = b.content.replace(/free/gi, 'complimentary').replace(/cheap/gi, 'accessible').replace(/buy/gi, 'acquire');
    if (b.type === 'bullets') c.content = b.content.replace(/😊|🎉|🔥|💪|🚀/g, '').replace(/!\s/g, '. ');
    return c;
  });
}

export function shortenBlocks(blocks: ArtifactBlock[]): ArtifactBlock[] {
  return blocks.map((b) => {
    const c = { ...b, id: uid() };
    if (b.type === 'paragraph') {
      const sentences = b.content.split(/\.\s+/);
      c.content = sentences.slice(0, Math.ceil(sentences.length * 0.6)).join('. ') + '.';
    }
    if (b.type === 'bullets') {
      const items = b.content.split('\n');
      c.content = items.slice(0, Math.ceil(items.length * 0.7)).join('\n');
    }
    return c;
  });
}

export function translateSpanish(blocks: ArtifactBlock[]): ArtifactBlock[] {
  const dict: Record<string, string> = {
    'Shop Now': 'Compra Ahora',
    'Limited Stock': 'Stock Limitado',
    'Free shipping': 'Envio gratis',
    'Welcome': 'Bienvenido',
    'Be First in Line': 'Se el Primero',
    'Join the Waitlist': 'Unete a la Lista',
    'Reserve Yours': 'Reserva el Tuyo',
    'Revenue Leak Audit': 'Auditoria de Fugas de Ingresos',
    'Recommended Actions': 'Acciones Recomendadas',
    'Estimated Revenue Impact': 'Impacto Estimado en Ingresos',
    'Quick story': 'Historia rapida',
    'Last chance': 'Ultima oportunidad',
    'We miss you': 'Te extrañamos',
    'Something big is coming': 'Algo grande viene',
    'No spam': 'Sin spam',
    'Subject:': 'Asunto:',
  };
  return blocks.map((b) => {
    const c = { ...b, id: uid() };
    let text = c.content;
    for (const [en, es] of Object.entries(dict)) {
      text = text.replace(new RegExp(en, 'gi'), es);
    }
    c.content = text;
    if (c.meta?.body) {
      let body = c.meta.body;
      for (const [en, es] of Object.entries(dict)) {
        body = body.replace(new RegExp(en, 'gi'), es);
      }
      c.meta = { ...c.meta, body };
    }
    return c;
  });
}
