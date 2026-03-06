import type { ArtifactType } from '../types';

export interface ParsedCommand {
  intent:
    | 'create_flyer'
    | 'create_email'
    | 'create_audit'
    | 'create_waitlist'
    | 'modify_premium'
    | 'modify_shorten'
    | 'modify_translate'
    | 'approve'
    | 'cancel'
    | 'export_pdf'
    | 'export_png'
    | 'send_email'
    | 'send_whatsapp'
    | 'unknown';
  artifactType?: ArtifactType;
  details: string;
  needsApproval: boolean;
  costCredits: number;
  risk: 'low' | 'medium' | 'high';
}

export function parseCommand(raw: string): ParsedCommand {
  const cmd = raw.trim().toLowerCase();

  if (cmd === 'approve') {
    return { intent: 'approve', details: '', needsApproval: false, costCredits: 0, risk: 'low' };
  }
  if (cmd === 'cancel') {
    return { intent: 'cancel', details: '', needsApproval: false, costCredits: 0, risk: 'low' };
  }

  if (/^(create|make|build|design)\s+(a\s+)?flyer/i.test(raw)) {
    return {
      intent: 'create_flyer',
      artifactType: 'flyer',
      details: raw.replace(/^(create|make|build|design)\s+(a\s+)?flyer[:\s]*/i, '').trim(),
      needsApproval: false,
      costCredits: 2,
      risk: 'low',
    };
  }

  if (/^(create|make|build)\s+(a\s+)?(email|email sequence|sequence)/i.test(raw)) {
    return {
      intent: 'create_email',
      artifactType: 'email_sequence',
      details: raw.replace(/^(create|make|build)\s+(a\s+)?(email sequence|email|sequence)[:\s]*/i, '').trim(),
      needsApproval: false,
      costCredits: 3,
      risk: 'low',
    };
  }

  if (/^(build|create)\s+(a\s+)?email sequence/i.test(raw)) {
    return {
      intent: 'create_email',
      artifactType: 'email_sequence',
      details: raw.replace(/^(build|create)\s+(a\s+)?email sequence[:\s]*/i, '').trim(),
      needsApproval: false,
      costCredits: 3,
      risk: 'low',
    };
  }

  if (/audit|revenue leak|leaks/i.test(raw)) {
    return {
      intent: 'create_audit',
      artifactType: 'audit',
      details: raw,
      needsApproval: false,
      costCredits: 2,
      risk: 'low',
    };
  }

  if (/wait(ing)?\s*list|waitlist|campaign/i.test(raw)) {
    return {
      intent: 'create_waitlist',
      artifactType: 'waitlist',
      details: raw,
      needsApproval: false,
      costCredits: 2,
      risk: 'low',
    };
  }

  if (/premium|luxur|upscale|elevat/i.test(raw)) {
    return {
      intent: 'modify_premium',
      details: raw,
      needsApproval: false,
      costCredits: 1,
      risk: 'low',
    };
  }

  if (/short(en|er)|condense|trim|cut/i.test(raw)) {
    return {
      intent: 'modify_shorten',
      details: raw,
      needsApproval: false,
      costCredits: 1,
      risk: 'low',
    };
  }

  if (/translat|spanish|español/i.test(raw)) {
    return {
      intent: 'modify_translate',
      details: raw,
      needsApproval: false,
      costCredits: 1,
      risk: 'low',
    };
  }

  if (/export\s*pdf/i.test(raw)) {
    return { intent: 'export_pdf', details: raw, needsApproval: true, costCredits: 1, risk: 'medium' };
  }
  if (/export\s*png/i.test(raw)) {
    return { intent: 'export_png', details: raw, needsApproval: true, costCredits: 1, risk: 'medium' };
  }
  if (/send\s*(an?\s+)?email/i.test(raw)) {
    return { intent: 'send_email', details: raw, needsApproval: true, costCredits: 2, risk: 'high' };
  }
  if (/send\s*(via\s+)?whatsapp/i.test(raw)) {
    return { intent: 'send_whatsapp', details: raw, needsApproval: true, costCredits: 2, risk: 'high' };
  }

  // Fallback: if it mentions flyer-like content, create flyer
  if (/flyer|poster|graphic|visual/i.test(raw)) {
    return {
      intent: 'create_flyer',
      artifactType: 'flyer',
      details: raw,
      needsApproval: false,
      costCredits: 2,
      risk: 'low',
    };
  }

  // Fallback: if mentions email
  if (/email|sequence|drip|nurture/i.test(raw)) {
    return {
      intent: 'create_email',
      artifactType: 'email_sequence',
      details: raw,
      needsApproval: false,
      costCredits: 3,
      risk: 'low',
    };
  }

  return { intent: 'unknown', details: raw, needsApproval: false, costCredits: 0, risk: 'low' };
}
