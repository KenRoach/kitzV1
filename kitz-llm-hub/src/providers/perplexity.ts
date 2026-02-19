export const perplexity = async (prompt: string) => ({ provider: 'perplexity', text: `perplexity:${prompt.slice(0, 40)}` });
