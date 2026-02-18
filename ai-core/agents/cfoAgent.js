const { runAgentPrompt } = require('../aiClient');
const { generateInvoice } = require('../tools/generateInvoice');

async function cfoAgent({ user, gatewayBaseUrl, invoicePayload, financeContext }) {
  if ((user.aiCredits || 0) <= 0) {
    return 'Recharge your AI Battery';
  }

  const insight = await runAgentPrompt({
    user,
    input: `Review this financial context and suggest actions: ${JSON.stringify(financeContext || {})}`,
    costEstimate: 1,
  });

  if (!insight.ok) {
    return insight.message;
  }

  const invoiceResult = await generateInvoice({
    gatewayBaseUrl,
    body: invoicePayload,
  });

  return {
    insight: insight.output,
    invoiceResult,
    remainingCredits: user.aiCredits,
  };
}

module.exports = { cfoAgent };
