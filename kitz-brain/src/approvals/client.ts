import { setTimeout as sleep } from 'node:timers/promises';

const gatewayUrl = process.env.GATEWAY_URL || 'http://127.0.0.1:4000';

interface ApprovalRequestInput {
  orgId: string;
  userId: string;
  toolName: string;
  action: string;
  reason?: string;
  traceId: string;
}

interface ApprovalResponse {
  approvalId: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function requestApproval(payload: ApprovalRequestInput) {
  const response = await fetch(`${gatewayUrl}/approvals/request`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer internal-brain-token',
      'x-org-id': payload.orgId,
      'x-trace-id': payload.traceId
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Unable to create approval request: ${response.status}`);
  }

  return await response.json() as ApprovalResponse;
}

export async function waitForApproval(approvalId: string, orgId: string, traceId: string, maxAttempts = 6, pollMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${gatewayUrl}/approvals/${approvalId}`, {
      headers: {
        authorization: 'Bearer internal-brain-token',
        'x-org-id': orgId,
        'x-trace-id': traceId
      }
    });

    if (response.ok) {
      const approval = await response.json() as ApprovalResponse;
      if (approval.status === 'approved') {
        return approval;
      }
      if (approval.status === 'rejected') {
        throw new Error(`Approval ${approvalId} was rejected`);
      }
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for approval ${approvalId}`);
}
