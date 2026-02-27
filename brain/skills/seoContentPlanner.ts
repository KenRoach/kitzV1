/**
 * SEO Content Planner skill — Keywords, topic clusters, content pillars.
 *
 * Helps LatAm SMBs build organic search visibility with keyword research,
 * topic clusters, and content calendar planning. Spanish-first SEO.
 * Owner: CMO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface KeywordCluster {
  pillar: string;
  keywords: Array<{ keyword: string; intent: 'informational' | 'transactional' | 'navigational'; difficulty: 'low' | 'medium' | 'high'; priority: number }>;
  contentIdeas: string[];
}

export interface ContentPillar {
  topic: string;
  targetKeyword: string;
  subTopics: string[];
  contentType: 'blog' | 'landing_page' | 'faq' | 'how_to' | 'comparison' | 'listicle';
  estimatedTraffic: string;
}

export interface SEOContentPlan {
  pillars: ContentPillar[];
  keywordClusters: KeywordCluster[];
  contentCalendar: Array<{ week: number; title: string; keyword: string; type: string; platform: string }>;
  technicalSEO: string[];
  localSEO: string[];
  quickWins: string[];
  monthlyGoal: string;
  actionSteps: string[];
}

export interface SEOOptions {
  business: string;
  industry: string;
  targetLocation: string;
  currentWebsite?: string;
  competitors?: string[];
  targetKeywords?: string[];
  language?: string;
}

const SEO_SYSTEM =
  'You are an SEO content strategist for small businesses in Latin America. ' +
  'Focus on Spanish-language SEO, local SEO (Google My Business), and long-tail keywords. ' +
  'Prioritize low-competition keywords that drive real business results. ' +
  'Content should be WhatsApp-shareable. Consider voice search (many users ask questions verbally). ' +
  'Default language: Spanish. Be practical — these businesses have limited time for content.';

const SEO_FORMAT =
  'Respond with JSON: { "pillars": [{ "topic": string, "targetKeyword": string, "subTopics": [string], ' +
  '"contentType": string, "estimatedTraffic": string }], ' +
  '"keywordClusters": [{ "pillar": string, "keywords": [{ "keyword": string, "intent": string, "difficulty": string, ' +
  '"priority": number }], "contentIdeas": [string] }], ' +
  '"contentCalendar": [{ "week": number, "title": string, "keyword": string, "type": string, "platform": string }], ' +
  '"technicalSEO": [string], "localSEO": [string], "quickWins": [string], "monthlyGoal": string, "actionSteps": [string] }';

export async function planSEOContent(options: SEOOptions, llmClient?: LLMClient): Promise<SEOContentPlan> {
  if (llmClient) {
    const prompt = `SEO content plan for: ${options.business} (${options.industry})\n` +
      `Target location: ${options.targetLocation}\n` +
      (options.currentWebsite ? `Website: ${options.currentWebsite}\n` : '') +
      (options.competitors ? `Competitors: ${options.competitors.join(', ')}\n` : '') +
      (options.targetKeywords ? `Target keywords: ${options.targetKeywords.join(', ')}\n` : '') +
      `\n${SEO_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SEO_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as SEOContentPlan; } catch { /* fall through */ }
  }

  const biz = options.business;
  const location = options.targetLocation;

  return {
    pillars: [
      { topic: `${biz} en ${location}`, targetKeyword: `${biz.toLowerCase()} ${location.toLowerCase()}`, subTopics: [`Mejores ${biz.toLowerCase()} en ${location}`, `Precios de ${biz.toLowerCase()}`, `Horarios y ubicación`], contentType: 'landing_page', estimatedTraffic: '100-500/mes' },
      { topic: `Guías de ${options.industry}`, targetKeyword: `cómo elegir ${biz.toLowerCase()}`, subTopics: ['Guía para principiantes', 'Errores comunes', 'Comparativa'], contentType: 'how_to', estimatedTraffic: '200-1000/mes' },
      { topic: 'Preguntas frecuentes', targetKeyword: `${biz.toLowerCase()} preguntas frecuentes`, subTopics: ['Precios', 'Tiempos de entrega', 'Garantías', 'Formas de pago'], contentType: 'faq', estimatedTraffic: '50-200/mes' },
    ],
    keywordClusters: [
      {
        pillar: `${biz} en ${location}`,
        keywords: [
          { keyword: `${biz.toLowerCase()} ${location.toLowerCase()}`, intent: 'transactional', difficulty: 'medium', priority: 1 },
          { keyword: `mejor ${biz.toLowerCase()} ${location.toLowerCase()}`, intent: 'transactional', difficulty: 'low', priority: 2 },
          { keyword: `${biz.toLowerCase()} cerca de mí`, intent: 'navigational', difficulty: 'medium', priority: 3 },
          { keyword: `${biz.toLowerCase()} precios ${location.toLowerCase()}`, intent: 'informational', difficulty: 'low', priority: 4 },
        ],
        contentIdeas: [
          `"Top 5 razones para elegir ${biz} en ${location}"`,
          `"Guía de precios de ${biz.toLowerCase()} — actualizada"`,
          `"¿Qué buscar en un buen ${biz.toLowerCase()}?"`,
        ],
      },
    ],
    contentCalendar: [
      { week: 1, title: `Guía completa de ${biz} en ${location}`, keyword: `${biz.toLowerCase()} ${location.toLowerCase()}`, type: 'blog', platform: 'website' },
      { week: 2, title: `5 errores al elegir ${biz.toLowerCase()}`, keyword: `errores ${biz.toLowerCase()}`, type: 'listicle', platform: 'Instagram + blog' },
      { week: 3, title: `Preguntas frecuentes sobre ${biz.toLowerCase()}`, keyword: `${biz.toLowerCase()} faq`, type: 'faq', platform: 'website' },
      { week: 4, title: `Testimonios de clientes de ${biz}`, keyword: `opiniones ${biz.toLowerCase()} ${location.toLowerCase()}`, type: 'blog', platform: 'Google + website' },
    ],
    technicalSEO: [
      'Verifica que tu sitio cargue en < 3 segundos (usa PageSpeed Insights)',
      'Asegura que sea mobile-first (la mayoría navega desde el celular)',
      'Agrega meta titles y descriptions a cada página',
      'Usa HTTPS (certificado SSL gratuito con Let\'s Encrypt)',
    ],
    localSEO: [
      'Crea/reclama tu perfil de Google My Business',
      'Agrega fotos reales de tu negocio, equipo y productos',
      'Pide reseñas a clientes satisfechos (5 estrellas con texto)',
      'Incluye tu dirección y teléfono en cada página del sitio',
      'Regístrate en directorios locales de tu país',
    ],
    quickWins: [
      'Optimiza tu perfil de Google My Business HOY',
      'Agrega keywords a tu bio de Instagram y WhatsApp Business',
      'Publica 1 artículo con tu keyword principal esta semana',
      'Pide 3 reseñas en Google a tus mejores clientes',
    ],
    monthlyGoal: 'Publicar 4 artículos optimizados + obtener 5 reseñas en Google',
    actionSteps: [
      'Reclama tu perfil de Google My Business esta semana',
      'Escribe tu primer blog post con el keyword principal',
      'Comparte cada artículo en WhatsApp Status y redes sociales',
      'Revisa métricas en Google Search Console cada 2 semanas',
    ],
  };
}
