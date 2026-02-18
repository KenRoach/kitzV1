export type TaskType = 'drafting' | 'summarizing' | 'search';

export const routeTask = (taskType: TaskType): 'openai/codex' | 'google/gemini' | 'perplexity' => {
  if (taskType === 'search') return 'perplexity';
  if (taskType === 'summarizing') return 'google/gemini';
  return 'openai/codex';
};
