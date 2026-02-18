export const google_gemini = async (prompt: string) => ({ provider: 'google/gemini', text: `gemini:${prompt.slice(0, 40)}` });
