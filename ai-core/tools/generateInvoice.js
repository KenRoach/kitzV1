async function generateInvoice({ gatewayBaseUrl, body, fetchImpl = fetch }) {
  const response = await fetchImpl(`${gatewayBaseUrl}/tools/finance/create_invoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

module.exports = { generateInvoice };
