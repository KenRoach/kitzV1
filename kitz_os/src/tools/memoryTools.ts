/**
 * Memory Tools — Search conversation history and knowledge base.
 *
 * Gives the AI agent access to:
 *   - Search past conversations
 *   - Search the knowledge base
 *   - Store knowledge entries
 *   - Get conversation context
 */

import type { ToolSchema } from './registry.js';
import {
  search,
  searchConversations,
  searchKnowledge,
  upsertKnowledge,
  getConversationHistory,
  getMemoryStats,
} from '../memory/manager.js';

export function getAllMemoryTools(): ToolSchema[] {
  return [
    {
      name: 'memory_search',
      description: 'Search across all memory (conversations + knowledge base) by keyword query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (keywords)' },
          user_id: { type: 'string', description: 'Optional: filter by user ID' },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        return search(
          args.query as string,
          args.user_id as string | undefined,
          (args.limit as number) || 10,
        );
      },
    },

    {
      name: 'memory_search_conversations',
      description: 'Search past WhatsApp/email conversations by keyword',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          user_id: { type: 'string', description: 'Filter by user ID' },
          limit: { type: 'number', description: 'Max results' },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        return searchConversations(
          args.query as string,
          args.user_id as string | undefined,
          (args.limit as number) || 10,
        );
      },
    },

    {
      name: 'memory_search_knowledge',
      description: 'Search the knowledge base (brand DNA, playbooks, templates)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results' },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        return searchKnowledge(args.query as string, (args.limit as number) || 10);
      },
    },

    {
      name: 'memory_store_knowledge',
      description: 'Store a knowledge entry (brand info, template, playbook section)',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source name (e.g. "brand_dna", "playbook", "template")' },
          category: { type: 'string', description: 'Category (e.g. "onboarding", "nurture", "product")' },
          title: { type: 'string', description: 'Entry title' },
          content: { type: 'string', description: 'Entry content' },
        },
        required: ['source', 'category', 'content'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        return upsertKnowledge({
          source: args.source as string,
          category: args.category as string,
          title: args.title as string | undefined,
          content: args.content as string,
        });
      },
    },

    {
      name: 'memory_get_context',
      description: 'Get recent conversation history for a specific user/sender pair (context window for AI)',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'Kitz user ID' },
          sender_jid: { type: 'string', description: 'WhatsApp sender JID' },
          limit: { type: 'number', description: 'Max messages (default 20)' },
        },
        required: ['user_id', 'sender_jid'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        return getConversationHistory(
          args.user_id as string,
          args.sender_jid as string,
          (args.limit as number) || 20,
        );
      },
    },

    {
      name: 'memory_stats',
      description: 'Get memory system statistics (message count, knowledge entries, unique users)',
      parameters: { type: 'object', properties: {} },
      riskLevel: 'low',
      execute: async () => getMemoryStats(),
    },
  ];
}
