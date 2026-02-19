export const anthropic_claude = async (prompt: string) => ({ provider: 'anthropic/claude', text: `anthropic:${prompt.slice(0, 40)}` });
