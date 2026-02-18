const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function deductCredits(user, costEstimate) {
  user.aiCredits = Math.max(0, (user.aiCredits || 0) - Number(costEstimate || 0));
  return user.aiCredits;
}

async function runAgentPrompt({ user, model = 'gpt-4.1', input, costEstimate = 1 }) {
  if (!user || typeof user !== 'object') {
    throw new Error('user is required');
  }

  if ((user.aiCredits || 0) <= 0) {
    return { ok: false, message: 'Recharge your AI Battery' };
  }

  const response = await openai.responses.create({ model, input });
  deductCredits(user, costEstimate);

  return {
    ok: true,
    output: response.output_text,
    remainingCredits: user.aiCredits,
  };
}

module.exports = {
  openai,
  runAgentPrompt,
  deductCredits,
};
