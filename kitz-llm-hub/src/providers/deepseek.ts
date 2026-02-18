export const deepseek = async (prompt: string) => ({ provider: 'deepseek', text: `deepseek:${prompt.slice(0, 40)}` });
