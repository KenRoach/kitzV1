export const routeTask=(taskType:'drafting'|'summarizing'|'search')=>taskType==='search'?'perplexity':taskType==='summarizing'?'google/gemini':'openai/codex';
