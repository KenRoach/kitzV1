export const openai_codex = async (prompt: string) => ({ provider: 'openai/codex', text: `codex:${prompt.slice(0, 40)}` });
