import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export interface StoredApproval {
  approvalId: string;
  orgId: string;
  userId: string;
  toolName: string;
  action: string;
  reason?: string;
  status: ApprovalStatus;
  traceId: string;
  createdAt: string;
  updatedAt: string;
  reviewerUserId?: string;
  decisionComment?: string;
}

const approvals = new Map<string, StoredApproval>();

export function createAdminApp() {
  const app = Fastify();

  app.get('/dashboard', async () => ({
    apiKeysConfigured: 0,
    credits: 100,
    approvalsPending: [...approvals.values()].filter((approval) => approval.status === 'pending').length
  }));

  app.post('/approvals/request', async (req, reply) => {
    const body = (req.body ?? {}) as Partial<StoredApproval>;
    if (!body.orgId || !body.userId || !body.toolName || !body.action) {
      return reply.code(400).send({
        code: 'INVALID_APPROVAL_REQUEST',
        message: 'orgId, userId, toolName and action are required',
        traceId: body.traceId ?? ''
      });
    }

    const now = new Date().toISOString();
    const approval: StoredApproval = {
      approvalId: randomUUID(),
      orgId: body.orgId,
      userId: body.userId,
      toolName: body.toolName,
      action: body.action,
      reason: body.reason,
      status: 'pending',
      traceId: body.traceId ?? randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    approvals.set(approval.approvalId, approval);
    return reply.code(201).send(approval);
  });

  app.get('/approvals/pending', async (req) => {
    const orgId = (req.query as { orgId?: string }).orgId;
    const pending = [...approvals.values()].filter((approval) =>
      approval.status === 'pending' && (!orgId || approval.orgId === orgId)
    );
    return { items: pending, count: pending.length };
  });

  app.get('/approvals/:approvalId', async (req, reply) => {
    const approvalId = (req.params as { approvalId: string }).approvalId;
    const approval = approvals.get(approvalId);
    if (!approval) {
      return reply.code(404).send({ code: 'APPROVAL_NOT_FOUND', message: 'Approval request not found' });
    }
    return approval;
  });

  app.post('/approvals/:approvalId/decision', async (req, reply) => {
    const approvalId = (req.params as { approvalId: string }).approvalId;
    const approval = approvals.get(approvalId);
    if (!approval) {
      return reply.code(404).send({ code: 'APPROVAL_NOT_FOUND', message: 'Approval request not found' });
    }

    const body = (req.body ?? {}) as { status?: ApprovalStatus; reviewerUserId?: string; comment?: string };
    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return reply.code(400).send({ code: 'INVALID_STATUS', message: 'status must be approved or rejected' });
    }
    if (!body.reviewerUserId) {
      return reply.code(400).send({ code: 'REVIEWER_REQUIRED', message: 'reviewerUserId is required' });
    }

    const updated: StoredApproval = {
      ...approval,
      status: body.status,
      reviewerUserId: body.reviewerUserId,
      decisionComment: body.comment,
      updatedAt: new Date().toISOString()
    };

    approvals.set(approvalId, updated);
    return updated;
  });

  return app;
}

const app = createAdminApp();
app.listen({ port: Number(process.env.PORT || 3011), host: '0.0.0.0' });
