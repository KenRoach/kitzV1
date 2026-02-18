export type TaskType = 'drafting' | 'summarizing' | 'search' | 'ideation' | 'coding';

export type ProviderName =
  | 'lovable'
  | 'anthropic/claude-code'
  | 'openai/codex'
  | 'google/gemini'
  | 'perplexity';

export const routeTask = (taskType: TaskType): ProviderName => {
  if (taskType === 'ideation') return 'lovable';
  if (taskType === 'coding') return 'anthropic/claude-code';
  if (taskType === 'search') return 'perplexity';
  if (taskType === 'summarizing') return 'google/gemini';
  return 'openai/codex';
};
