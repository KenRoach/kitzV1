export const lovable = async (prompt: string) => ({
  provider: 'lovable',
  text: `lovable:${prompt.slice(0, 40)}`
});
