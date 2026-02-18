export const anthropic_claude = async (prompt: string) => ({ provider: 'anthropic/claude', text: 'stub:' + prompt.slice(0,30) });
