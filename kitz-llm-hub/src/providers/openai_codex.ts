export const openai_codex = async (prompt: string) => ({ provider: 'openai/codex', text: 'stub:' + prompt.slice(0,30) });
