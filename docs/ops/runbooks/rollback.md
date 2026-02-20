# Rollback Runbook

1. Identify last known healthy commit.
2. Revert targeted commit(s) with minimal blast radius.
3. Re-run smoke tests for health, core pages, checkout links, and compliance page.
4. Re-deploy and monitor error/latency for 30 minutes.
