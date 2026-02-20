export const claude_code = async (prompt: string) => ({
  provider: 'anthropic/claude-code',
  text: `claude-code:${prompt.slice(0, 40)}`
});
