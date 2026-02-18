const { runAgentPrompt } = require('../aiClient');

async function opsAgent({ user, orderEvents }) {
  if ((user.aiCredits || 0) <= 0) {
    return 'Recharge your AI Battery';
  }

  return runAgentPrompt({
    user,
    input: `Analyze these order operations events and flag blockers: ${JSON.stringify(orderEvents || [])}`,
    costEstimate: 1,
  });
}

module.exports = { opsAgent };
