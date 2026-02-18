async function updateCRM({ gatewayBaseUrl, body, fetchImpl = fetch }) {
  const response = await fetchImpl(`${gatewayBaseUrl}/tools/crm/update_lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

module.exports = { updateCRM };
