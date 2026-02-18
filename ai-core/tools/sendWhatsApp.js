async function sendWhatsApp({ to, message }) {
  if (!to || !message) {
    throw new Error('Both `to` and `message` are required');
  }

  return {
    status: 'queued',
    provider: 'mock-whatsapp',
    to,
    message,
    queuedAt: new Date().toISOString(),
  };
}

module.exports = { sendWhatsApp };
