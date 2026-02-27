/**
 * Social Media Planner skill — Platform-specific content strategy.
 *
 * Creates social media strategies for Instagram, TikTok, Facebook, WhatsApp Status,
 * and YouTube Shorts. Optimized for LatAm SMBs selling via social channels.
 * Owner: CMO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface PlatformPlan {
  platform: string;
  postsPerWeek: number;
  bestTimes: string[];
  contentTypes: string[];
  hashtagStrategy: string;
  growthTactics: string[];
}

export interface SocialMediaPlan {
  platforms: PlatformPlan[];
  weeklyCalendar: Array<{ day: string; platform: string; contentType: string; topic: string; caption: string }>;
  contentPillars: string[];
  brandVoice: string;
  engagementStrategy: string[];
  growthTargets: { followers: string; engagement: string; conversions: string };
  toolsRecommended: string[];
  actionSteps: string[];
}

export interface SocialMediaOptions {
  business: string;
  industry: string;
  targetAudience: string;
  platforms?: string[];
  currentFollowers?: Record<string, number>;
  goal: 'grow_followers' | 'drive_sales' | 'build_brand' | 'community';
  language?: string;
}

const SOCIAL_SYSTEM =
  'You are a social media strategist for small businesses in Latin America. ' +
  'Focus on Instagram, TikTok, WhatsApp Status, and Facebook. ' +
  'Content should drive sales through DMs and WhatsApp. ' +
  'Prioritize video content (Reels, TikTok, Stories). ' +
  'Default language: Spanish.';

const SOCIAL_FORMAT =
  'Respond with JSON: { "platforms": [{ "platform": string, "postsPerWeek": number, "bestTimes": [string], ' +
  '"contentTypes": [string], "hashtagStrategy": string, "growthTactics": [string] }], ' +
  '"weeklyCalendar": [{ "day": string, "platform": string, "contentType": string, "topic": string, "caption": string }], ' +
  '"contentPillars": [string], "brandVoice": string, "engagementStrategy": [string], ' +
  '"growthTargets": { "followers": string, "engagement": string, "conversions": string }, ' +
  '"toolsRecommended": [string], "actionSteps": [string] }';

export async function planSocialMedia(options: SocialMediaOptions, llmClient?: LLMClient): Promise<SocialMediaPlan> {
  if (llmClient) {
    const prompt = `Social media plan for: ${options.business} (${options.industry})\n` +
      `Audience: ${options.targetAudience}\nGoal: ${options.goal}\n` +
      (options.platforms ? `Platforms: ${options.platforms.join(', ')}\n` : '') +
      (options.currentFollowers ? `Current followers: ${JSON.stringify(options.currentFollowers)}\n` : '') +
      `\n${SOCIAL_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SOCIAL_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as SocialMediaPlan; } catch { /* fall through */ }
  }

  return {
    platforms: [
      { platform: 'Instagram', postsPerWeek: 5, bestTimes: ['9am', '12pm', '7pm'], contentTypes: ['Reels', 'Carrusel', 'Stories'], hashtagStrategy: '15-20 hashtags mixtos (5 populares + 10 nicho + 5 locales)', growthTactics: ['Colaboraciones con micro-influencers', 'Reels con audio trending', 'Responde todos los comentarios'] },
      { platform: 'WhatsApp Status', postsPerWeek: 7, bestTimes: ['8am', '1pm', '6pm'], contentTypes: ['Producto del día', 'Behind the scenes', 'Testimonios'], hashtagStrategy: 'N/A — directo a contactos', growthTactics: ['Pide que te agreguen a su lista', 'Comparte contenido exclusivo solo en Status'] },
      { platform: 'TikTok', postsPerWeek: 3, bestTimes: ['11am', '5pm', '9pm'], contentTypes: ['Trends', 'Behind the scenes', 'Tips rápidos'], hashtagStrategy: '3-5 hashtags relevantes + 1-2 trending', growthTactics: ['Usa sonidos trending', 'Publica consistentemente', 'Duets con contenido viral'] },
    ],
    weeklyCalendar: [
      { day: 'Lunes', platform: 'Instagram', contentType: 'Reel', topic: 'Tip de la semana', caption: 'El tip #1 que todo emprendedor necesita...' },
      { day: 'Martes', platform: 'WhatsApp Status', contentType: 'Producto', topic: 'Producto destacado', caption: 'Disponible hoy. Escríbeme para más info.' },
      { day: 'Miércoles', platform: 'Instagram', contentType: 'Carrusel', topic: 'Educativo', caption: '5 cosas que debes saber sobre...' },
      { day: 'Jueves', platform: 'TikTok', contentType: 'Trend', topic: 'Behind the scenes', caption: 'Un día en mi negocio...' },
      { day: 'Viernes', platform: 'Instagram', contentType: 'Reel', topic: 'Testimonio', caption: 'Lo que dicen nuestros clientes...' },
      { day: 'Sábado', platform: 'WhatsApp Status', contentType: 'Oferta', topic: 'Promo fin de semana', caption: 'Solo hoy: [oferta]. Escríbeme "QUIERO"' },
      { day: 'Domingo', platform: 'Instagram', contentType: 'Story', topic: 'Personal/storytelling', caption: 'La historia detrás de mi negocio...' },
    ],
    contentPillars: ['Educativo (tips y guías)', 'Inspiracional (historias de éxito)', 'Producto (showcase y ofertas)', 'Behind the scenes (proceso y equipo)'],
    brandVoice: 'Cercano, directo, emprendedor. Como un amigo que sabe de negocios.',
    engagementStrategy: [
      'Responde cada comentario en < 1 hora',
      'Usa encuestas y preguntas en Stories',
      'Haz lives semanales (Q&A o demo)',
      'Menciona a clientes y comparte su contenido',
    ],
    growthTargets: { followers: '+200/mes', engagement: '3-5% rate', conversions: '10+ DMs/semana' },
    toolsRecommended: ['Canva (diseño)', 'CapCut (video)', 'Later (programación)', 'Kitz (gestión de clientes)'],
    actionSteps: [
      'Define tus 4 pilares de contenido',
      'Crea 7 piezas de contenido este domingo (batch)',
      'Programa publicaciones con Later o Meta Business Suite',
      'Mide resultados cada viernes — ajusta lo que no funciona',
    ],
  };
}
