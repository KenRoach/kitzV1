/**
 * KITZ Tools Ecosystem — registers all 16 KitZ tools/products as navigable
 * services that kitz_os knows about, can reference, and can direct users to.
 */

import type { ToolSchema } from './registry.js';

interface KitzTool {
  id: string;
  name: string;
  nameEs: string;
  subdomain: string;
  category: string;
  description: string;
  descriptionEs: string;
}

const KITZ_TOOLS: KitzTool[] = [
  {
    id: 'kitz-live-demo',
    name: 'Live Pipeline Demo',
    nameEs: 'Demo del Pipeline en Vivo',
    subdomain: 'demo.kitz.services',
    category: 'sales',
    description: '60-second interactive demo of the full KitZ 7-step pipeline',
    descriptionEs: 'Demo interactivo de 60 segundos del pipeline completo de KitZ',
  },
  {
    id: 'kitz-roi-calculator',
    name: 'ROI Calculator',
    nameEs: 'Calculadora ROI',
    subdomain: 'roi.kitz.services',
    category: 'sales',
    description: 'Slider-based ROI calculator comparing team cost vs KitZ AI Battery cost',
    descriptionEs: 'Calculadora ROI comparando costo de equipo vs AI Battery de KitZ',
  },
  {
    id: 'kitz-ai-battery-calculator',
    name: 'AI Battery Calculator',
    nameEs: 'Calculadora AI Battery',
    subdomain: 'battery.kitz.services',
    category: 'sales',
    description: 'Credit consumption breakdown by category (LLM, agents, WhatsApp, notifications, cron)',
    descriptionEs: 'Desglose de consumo de creditos por categoria',
  },
  {
    id: 'kitz-proposal-generator',
    name: 'Business Proposal Generator',
    nameEs: 'Generador de Propuestas',
    subdomain: 'proposals.kitz.services',
    category: 'sales',
    description: 'Generate full Spanish-language business proposals in under 2 minutes',
    descriptionEs: 'Genera propuestas de negocio completas en espanol en menos de 2 minutos',
  },
  {
    id: 'kitz-command-center',
    name: 'Command Center Dashboard',
    nameEs: 'Centro de Comando',
    subdomain: 'command.kitz.services',
    category: 'operations',
    description: 'Real-time dashboard with service status, pipeline activity, metrics, AI Battery gauge',
    descriptionEs: 'Dashboard en tiempo real con estado de servicios, actividad y metricas',
  },
  {
    id: 'kitz-onboarding-flow',
    name: 'Onboarding Flow Builder',
    nameEs: 'Flujo de Onboarding',
    subdomain: 'onboarding.kitz.services',
    category: 'onboarding',
    description: 'Multi-step wizard mapping new clients to the right KitZ modules',
    descriptionEs: 'Wizard que mapea nuevos clientes a los modulos correctos de KitZ',
  },
  {
    id: 'kitz-prospect-outreach',
    name: 'Prospect Outreach Generator',
    nameEs: 'Generador de Outreach',
    subdomain: 'outreach.kitz.services',
    category: 'sales',
    description: 'Paste company + industry, get personalized first-touch messages per channel',
    descriptionEs: 'Pega empresa + industria, recibe mensajes personalizados por canal',
  },
  {
    id: 'kitz-whatsapp-sequences',
    name: 'WhatsApp Sequence Generator',
    nameEs: 'Generador de Secuencias WhatsApp',
    subdomain: 'sequences.kitz.services',
    category: 'sales',
    description: '5-touch WhatsApp outreach sequences tied to kitz-whatsapp-connector',
    descriptionEs: 'Secuencias de 5 toques via WhatsApp conectadas al conector',
  },
  {
    id: 'kitz-battlecard-agent',
    name: 'Competitive Battlecard Agent',
    nameEs: 'Agente de Battlecards',
    subdomain: 'battlecards.kitz.services',
    category: 'sales',
    description: 'Instant rebuttals when prospects mention a competitor',
    descriptionEs: 'Respuestas instantaneas cuando un prospecto menciona un competidor',
  },
  {
    id: 'kitz-content-engine',
    name: 'Content Engine (KitZ Voice)',
    nameEs: 'Motor de Contenido',
    subdomain: 'content.kitz.services',
    category: 'marketing',
    description: 'Topic in, LinkedIn post + WhatsApp broadcast out',
    descriptionEs: 'Tema entra, post de LinkedIn + broadcast de WhatsApp sale',
  },
  {
    id: 'kitz-partner-reseller-kit',
    name: 'Partner Reseller Kit Generator',
    nameEs: 'Kit de Reseller',
    subdomain: 'partners.kitz.services',
    category: 'channel',
    description: 'Co-branded channel partner materials for LATAM IT resellers',
    descriptionEs: 'Materiales co-branded para resellers de IT en LATAM',
  },
  {
    id: 'kitz-sales-team',
    name: 'Sales Team AI',
    nameEs: 'Equipo de Ventas AI',
    subdomain: 'sales.kitz.services',
    category: 'sales',
    description: 'AI-powered sales team: qualification, follow-up, objection handling, deal progression',
    descriptionEs: 'Equipo de ventas AI: calificacion, seguimiento, manejo de objeciones',
  },
  {
    id: 'kitz-user-intelligence',
    name: 'User Intelligence',
    nameEs: 'Inteligencia de Usuarios',
    subdomain: 'intelligence.kitz.services',
    category: 'operations',
    description: 'Tracks every contact: active, inactive, at-risk, prospects',
    descriptionEs: 'Rastrea cada contacto: activo, inactivo, en riesgo, prospectos',
  },
  {
    id: 'kitz-demand-gen',
    name: 'Demand Gen Strategist',
    nameEs: 'Estratega de Demanda',
    subdomain: 'demandgen.kitz.services',
    category: 'marketing',
    description: 'AI demand generation across WhatsApp, Email, LinkedIn, Social',
    descriptionEs: 'Generacion de demanda AI por WhatsApp, Email, LinkedIn, Social',
  },
  {
    id: 'kitz-onboarding-assistant',
    name: 'Onboarding Assistant',
    nameEs: 'Asistente de Onboarding',
    subdomain: 'assist.kitz.services',
    category: 'onboarding',
    description: 'Client-facing chatbot that walks clients through KitZ and routes to modules',
    descriptionEs: 'Chatbot que guia clientes por KitZ y los enruta al modulo correcto',
  },
  {
    id: 'renewflow',
    name: 'RenewFlow',
    nameEs: 'RenewFlow',
    subdomain: 'renewflow.kitz.services',
    category: 'product',
    description: 'AI-powered warranty renewal and installed base management for LATAM IT resellers',
    descriptionEs: 'Plataforma de renovacion de garantias para resellers de IT en LATAM',
  },
];

export function getAllKitzToolsEcosystemTools(): ToolSchema[] {
  return [
    {
      name: 'list_kitz_tools',
      description: 'List all available KitZ tools and products with their subdomains, categories, and descriptions. Use this to direct users to the right tool for their need.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['sales', 'marketing', 'operations', 'onboarding', 'channel', 'product', 'all'],
            description: 'Filter tools by category. Use "all" to list everything.',
          },
          language: {
            type: 'string',
            enum: ['en', 'es'],
            description: 'Language for descriptions. Default: es',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const category = (args.category as string) || 'all';
        const lang = (args.language as string) || 'es';
        const filtered = category === 'all'
          ? KITZ_TOOLS
          : KITZ_TOOLS.filter(t => t.category === category);

        return {
          tools: filtered.map(t => ({
            id: t.id,
            name: lang === 'es' ? t.nameEs : t.name,
            url: `https://${t.subdomain}`,
            category: t.category,
            description: lang === 'es' ? t.descriptionEs : t.description,
          })),
          total: filtered.length,
          domain: 'kitz.services',
        };
      },
    },
    {
      name: 'get_kitz_tool',
      description: 'Get details about a specific KitZ tool by ID. Returns name, subdomain URL, category, and description.',
      parameters: {
        type: 'object',
        properties: {
          tool_id: {
            type: 'string',
            description: 'The tool ID (e.g., "kitz-roi-calculator", "renewflow")',
          },
        },
        required: ['tool_id'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const tool = KITZ_TOOLS.find(t => t.id === args.tool_id);
        if (!tool) return { error: `Tool "${args.tool_id}" not found. Use list_kitz_tools to see available tools.` };
        return {
          ...tool,
          url: `https://${tool.subdomain}`,
          repo: `https://github.com/KenRoach/${tool.id === 'renewflow' ? 'RenewFlow' : tool.id}`,
        };
      },
    },
    {
      name: 'recommend_kitz_tool',
      description: 'Given a user need or question, recommend the best KitZ tool to solve it. Returns the tool with a reason.',
      parameters: {
        type: 'object',
        properties: {
          user_need: {
            type: 'string',
            description: 'What the user needs help with (e.g., "I need to show a prospect how KitZ works", "calculate ROI for a client")',
          },
        },
        required: ['user_need'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const need = ((args.user_need as string) || '').toLowerCase();
        const keywords: Record<string, string[]> = {
          'kitz-live-demo': ['demo', 'show', 'mostrar', 'pipeline', 'presentar'],
          'kitz-roi-calculator': ['roi', 'retorno', 'ahorro', 'savings', 'cfo'],
          'kitz-ai-battery-calculator': ['battery', 'credito', 'credit', 'consumo', 'consumption'],
          'kitz-proposal-generator': ['propuesta', 'proposal', 'cotizacion', 'quote'],
          'kitz-command-center': ['dashboard', 'monitor', 'status', 'metricas'],
          'kitz-onboarding-flow': ['onboarding', 'nuevo cliente', 'new client', 'setup'],
          'kitz-prospect-outreach': ['outreach', 'primer contacto', 'first touch', 'mensaje'],
          'kitz-whatsapp-sequences': ['secuencia', 'sequence', 'follow up', 'seguimiento'],
          'kitz-battlecard-agent': ['competidor', 'competitor', 'battlecard', 'rebuttal'],
          'kitz-content-engine': ['contenido', 'content', 'linkedin', 'post', 'broadcast'],
          'kitz-partner-reseller-kit': ['partner', 'reseller', 'canal', 'channel'],
          'kitz-sales-team': ['venta', 'sale', 'cerrar', 'close', 'deal', 'qualify'],
          'kitz-user-intelligence': ['usuario', 'user', 'contacto', 'contact', 'inactivo', 'churn'],
          'kitz-demand-gen': ['demanda', 'demand', 'campana', 'campaign', 'pipeline'],
          'kitz-onboarding-assistant': ['chatbot', 'asistente', 'assistant', 'guiar', 'guide'],
          'renewflow': ['garantia', 'warranty', 'renewal', 'renovacion', 'installed base'],
        };

        for (const [toolId, kws] of Object.entries(keywords)) {
          if (kws.some(kw => need.includes(kw))) {
            const tool = KITZ_TOOLS.find(t => t.id === toolId)!;
            return {
              recommended: {
                id: tool.id,
                name: tool.nameEs,
                url: `https://${tool.subdomain}`,
                description: tool.descriptionEs,
              },
              reason: `Matched user need to ${tool.nameEs} based on keywords`,
            };
          }
        }

        return {
          recommended: null,
          reason: 'No specific tool matched. Use list_kitz_tools to browse all available tools.',
          allTools: KITZ_TOOLS.map(t => ({ id: t.id, name: t.nameEs, url: `https://${t.subdomain}` })),
        };
      },
    },
  ];
}
