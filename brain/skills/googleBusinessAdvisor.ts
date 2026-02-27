/**
 * Google Business Advisor skill — Google My Business, Google Ads, Search Console.
 * Owner: CMO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface GoogleBusinessAdvice {
  gmbOptimization: { setup: string[]; photos: string[]; posts: string[]; reviews: string[] };
  searchConsole: string[]; googleAds: { budget: string; campaigns: string[]; keywords: string[] };
  localSEO: string[]; commonMistakes: string[]; actionSteps: string[];
}
export interface GoogleBusinessOptions { business: string; industry: string; location: string; hasGMB?: boolean; language?: string; }

const SYSTEM = 'You are a Google Business advisor for LatAm SMBs. Optimize Google My Business, Search Console, local SEO. Spanish default.';
const FORMAT = 'Respond with JSON: { "gmbOptimization": { "setup": [string], "photos": [string], "posts": [string], "reviews": [string] }, "searchConsole": [string], "googleAds": object, "localSEO": [string], "commonMistakes": [string], "actionSteps": [string] }';

export async function adviseGoogleBusiness(options: GoogleBusinessOptions, llmClient?: LLMClient): Promise<GoogleBusinessAdvice> {
  if (llmClient) {
    const prompt = `Google Business for: ${options.business} (${options.industry})\nLocation: ${options.location}\nHas GMB: ${options.hasGMB ?? false}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as GoogleBusinessAdvice; } catch { /* fall through */ }
  }
  return {
    gmbOptimization: { setup: ['Reclama/crea perfil en business.google.com', 'Completa TODA la información (nombre, dirección, teléfono, horario)', 'Selecciona categorías correctas (principal + secundarias)', 'Agrega descripción con keywords'], photos: ['Logo + portada profesional', '10+ fotos del local/productos/equipo', 'Actualiza fotos mensualmente', 'Responde a fotos de clientes'], posts: ['Publica 1-2 veces por semana', 'Promociones, eventos, novedades', 'Incluye CTA: "Llámanos" o "Visítanos"'], reviews: ['Pide reseñas a clientes satisfechos', 'Responde TODAS las reseñas (positivas y negativas)', 'Meta: 20+ reseñas con 4.5+ estrellas'] },
    searchConsole: ['Verifica tu sitio en Search Console', 'Revisa errores de rastreo semanalmente', 'Monitorea keywords que generan tráfico', 'Envía sitemap XML'],
    googleAds: { budget: '$5-15/día para empezar', campaigns: ['Búsqueda local (tu servicio + ciudad)', 'Remarketing (visitantes del sitio)'], keywords: [`${options.business.toLowerCase()} ${options.location.toLowerCase()}`, `mejor ${options.industry.toLowerCase()} cerca`] },
    localSEO: ['NAP consistente (Nombre, Dirección, Teléfono) en todos los directorios', 'Regístrate en directorios locales', 'Crea contenido local (blog sobre tu zona/industria)'],
    commonMistakes: ['Perfil incompleto (Google penaliza)', 'No responder reseñas negativas', 'Horarios desactualizados', 'No usar posts de GMB'],
    actionSteps: ['Reclama tu perfil de Google My Business HOY', 'Sube 10 fotos profesionales', 'Pide 5 reseñas a tus mejores clientes esta semana', 'Publica tu primer post de GMB'],
  };
}
