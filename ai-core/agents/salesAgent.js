const { runAgentPrompt, deductCredits } = require('../aiClient');
const { updateCRM } = require('../tools/updateCRM');
const { sendWhatsApp } = require('../tools/sendWhatsApp');

async function salesAgent({ user, gatewayBaseUrl, leadPayload }) {
  if ((user.aiCredits || 0) <= 0) {
    return 'Recharge your AI Battery';
  }

  const summary = await runAgentPrompt({
    user,
    input: 'Summarize the lead and suggest next best sales action.',
    costEstimate: 1,
  });

  if (!summary.ok) {
    return summary.message;
  }

  const crmResult = await updateCRM({
    gatewayBaseUrl,
    body: leadPayload,
  });

  const whatsapp = await sendWhatsApp({
    to: leadPayload?.payload?.phone,
    message: 'Thanks for your interest! Our sales team will contact you shortly.',
  });

  deductCredits(user, 0.5);

  return {
    summary: summary.output,
    crmResult,
    whatsapp,
    remainingCredits: user.aiCredits,
  };
}

module.exports = { salesAgent };
