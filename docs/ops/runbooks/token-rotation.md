# Token Rotation Runbook

1. Request one-time scoped token through Gateway (short TTL).
2. Rotate token in deployment environment (never commit in repo).
3. Verify auth flows and webhook access.
4. Expire/revoke old token immediately.
5. Record rotation event in decision log.
