import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * CMO Agent — Chief Marketing Officer
 *
 * Owns: demand generation, brand voice, invite campaigns, content strategy.
 * Current focus: First-10-users WhatsApp invite campaign.
 *
 * Governance alignment:
 *   - Draft-first: all outbound messages are drafts for founder approval
 *   - scrappy_free_first: organic/personal outreach before paid channels
 *   - Gen Z clarity: direct, concise, no corporate fluff
 */
export class CMOAgent extends BaseAgent {

  /** Target user profiles for the first 10 users */
  static readonly FIRST_10_PROFILES = [
    { slot: 1,  profile: 'Founder network',    business: 'Food/service',       country: 'Panama',    tier: 'hustler' as const },
    { slot: 2,  profile: 'MealKitz alumni',     business: 'Food delivery',      country: 'Panama',    tier: 'hustler' as const },
    { slot: 3,  profile: 'Market vendor',       business: 'Fresh produce',      country: 'Panama',    tier: 'hustler' as const },
    { slot: 4,  profile: 'Beauty salon',        business: 'Nail/hair services', country: 'Panama/CR', tier: 'hustler' as const },
    { slot: 5,  profile: 'Food truck',          business: 'Street food',        country: 'Panama',    tier: 'hustler' as const },
    { slot: 6,  profile: 'Boutique seller',     business: 'Fashion/clothing',   country: 'Colombia',  tier: 'hustler' as const },
    { slot: 7,  profile: 'Tutor/teacher',       business: 'Education',          country: 'Panama',    tier: 'starter' as const },
    { slot: 8,  profile: 'Delivery runner',     business: 'Logistics',          country: 'Panama',    tier: 'hustler' as const },
    { slot: 9,  profile: 'Event planner',       business: 'Events/catering',    country: 'Panama',    tier: 'hustler' as const },
    { slot: 10, profile: 'Hardware/supplies',   business: 'Retail',             country: 'Guatemala', tier: 'hustler' as const },
  ] as const;

  /**
   * Generate a WhatsApp invite message for a specific user.
   * Returns a DRAFT — must be approved by founder before sending.
   */
  generateInvite(
    name: string,
    tier: 'hustler' | 'starter',
    language: 'en' | 'es' = 'es',
    touch: 1 | 2 | 3 = 1,
  ): { draft: string; draftOnly: true; touch: number; language: string } {
    const templates = this.getTemplates(language);
    const key = `touch${touch}_${tier}` as keyof typeof templates;
    const template = templates[key] || templates.touch1_hustler;
    const draft = template.replace(/\[Name\]/g, name);

    return { draft, draftOnly: true, touch, language };
  }

  /**
   * Assess a potential user for invite readiness.
   * Returns prioritization score (0-10) and recommended approach.
   */
  assessInviteCandidate(contact: {
    name: string;
    hasExistingRelationship: boolean;
    isAlreadySelling: boolean;
    usesWhatsApp: boolean;
    country: string;
  }): { score: number; tier: 'hustler' | 'starter'; recommendation: string } {
    let score = 0;

    if (contact.hasExistingRelationship) score += 4; // Trust = highest signal
    if (contact.isAlreadySelling) score += 3;         // Active pain point
    if (contact.usesWhatsApp) score += 2;             // Channel fit
    if (['Panama', 'Colombia', 'Costa Rica', 'Guatemala', 'Dominican Republic'].includes(contact.country)) score += 1;

    const tier = contact.isAlreadySelling ? 'hustler' : 'starter';
    const recommendation = score >= 7
      ? 'High priority — personal message from Kenneth'
      : score >= 4
        ? 'Good fit — invite after top candidates activate'
        : 'Lower priority — add to waitlist for batch 2';

    return { score: Math.min(score, 10), tier, recommendation };
  }

  /**
   * Generate the 3-touch campaign timeline for a user.
   */
  planCampaignTouches(name: string, tier: 'hustler' | 'starter'): Array<{
    touch: number;
    day: number;
    action: string;
    message: string;
    draftOnly: true;
  }> {
    return [
      {
        touch: 1,
        day: 0,
        action: 'Send hook message via WhatsApp',
        message: this.generateInvite(name, tier, 'es', 1).draft,
        draftOnly: true,
      },
      {
        touch: 2,
        day: 1,
        action: 'Send activation walkthrough (only if they replied positively)',
        message: this.generateInvite(name, tier, 'es', 2).draft,
        draftOnly: true,
      },
      {
        touch: 3,
        day: 3,
        action: 'Check-in on usage (adapt based on activity)',
        message: this.generateInvite(name, tier, 'es', 3).draft,
        draftOnly: true,
      },
    ];
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (ctx.campaignProfileCount < 10) {
      warnings.push(`Only ${ctx.campaignProfileCount} campaign profiles — target is 10`);
    } else {
      passed.push(`${ctx.campaignProfileCount} campaign profiles ready`);
    }

    if (ctx.campaignTemplateLanguages.length < 2) {
      warnings.push('Templates only in 1 language — need ES + EN for LatAm');
    } else {
      passed.push(`Templates in ${ctx.campaignTemplateLanguages.join(' + ')}`);
    }

    if (!ctx.draftFirstEnforced) {
      blockers.push('Draft-first not enforced — cannot launch campaigns without approval gate');
    } else {
      passed.push('Draft-first enforced — all messages require founder approval');
    }

    if (!ctx.whatsappConnectorConfigured) {
      blockers.push('WhatsApp connector offline — primary outreach channel unavailable');
    } else {
      passed.push('WhatsApp connector online for campaign delivery');
    }

    // CMO always has 10 profiles and 2 languages built in
    passed.push('3-touch campaign strategy defined (hook → walkthrough → check-in)');
    passed.push('Scrappy-free-first policy: organic before paid');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 90 : 75) : 25;

    return {
      agent: this.name, role: 'CMO', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Campaign ready. 10 profiles, 3-touch strategy, ES+EN templates. Let\'s invite.'
        : vote === 'conditional'
          ? `Campaign mostly ready: ${warnings.join('; ')}`
          : `Campaign blockers: ${blockers.join('; ')}`,
    };
  }

  /** Emit campaign event for audit trail */
  async emitInviteDraft(name: string, tier: 'hustler' | 'starter', touch: number): Promise<void> {
    await this.publish('INVITE_DRAFT_CREATED', {
      candidate: name,
      tier,
      touch,
      campaign: 'first-10-users',
      status: 'pending_approval',
    }, 'low');
  }

  private getTemplates(language: 'en' | 'es') {
    if (language === 'es') {
      return {
        touch1_hustler:
          `Hey [Name] — hice algo para los que vendemos por WhatsApp.\n\nWorkspace gratis: contactos, pedidos, links de pago. Sin costos ocultos.\n\nLo estoy usando yo mismo. Quieres probarlo?\n\nworkspace.kitz.services/start`,
        touch1_starter:
          `[Name] — te acuerdas de MealKitz?\n\nHice una herramienta gratis para empezar a vender. CRM + links de cobro + tareas.\n\nCero costo. 2 min para montar. Te mando el link?`,
        touch2_hustler:
          `Asi empiezas (2 min):\n\n1. Abre workspace.kitz.services/start\n2. Agrega tu primer contacto (tu mejor cliente)\n3. Crea un link de cobro para algo que vendes\n\nListo. Tu negocio organizado en un solo lugar.\n\nDudas? Responde aqui.`,
        touch2_starter:
          `Asi empiezas (2 min):\n\n1. Abre workspace.kitz.services/start\n2. Agrega tu primer contacto\n3. Crea una tarea para tu proxima venta\n\nYa tienes tu workspace. Cero costo.\n\nDudas? Responde aqui.`,
        touch3_hustler:
          `[Name] — como te va con el workspace?\n\nTip: crea un link de cobro y mandalo a un cliente. La forma mas rapida de cobrar.\n\nComo lo sientes hasta ahora?`,
        touch3_starter:
          `Hey [Name] — pudiste probar el workspace?\n\nSin presion. Que es lo mas caotico de tu negocio ahorita? Tal vez te puedo mostrar como esto ayuda con eso.`,
      };
    }
    return {
      touch1_hustler:
        `Hey [Name] — built something for people like us who sell on WhatsApp.\n\nFree workspace: contacts, orders, payment links. No hidden fees.\n\nBeen using it myself. Want to try?\n\nworkspace.kitz.services/start`,
      touch1_starter:
        `[Name] — remember MealKitz?\n\nBuilt a free tool to start selling. CRM + payment links + tasks.\n\nZero cost. 2 min setup. Want the link?`,
      touch2_hustler:
        `Here's how to start (2 min):\n\n1. Open workspace.kitz.services/start\n2. Add your first contact (your best customer)\n3. Create a checkout link for something you sell\n\nThat's it. Your business in one place.\n\nQuestions? Reply here.`,
      touch2_starter:
        `Here's how to start (2 min):\n\n1. Open workspace.kitz.services/start\n2. Add your first contact\n3. Create a task for your next sale\n\nYour workspace is ready. Zero cost.\n\nQuestions? Reply here.`,
      touch3_hustler:
        `[Name] — how's the workspace going?\n\nTip: create a payment link and send it to a client. Fastest way to get paid.\n\nHow's it feeling so far?`,
      touch3_starter:
        `Hey [Name] — had a chance to try the workspace?\n\nNo pressure. What's the most chaotic thing about your business right now? Maybe I can show you how this helps.`,
    };
  }
}
