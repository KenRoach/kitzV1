# ARCHITECTURE

```text
xyz88-io / kitz-services / admin-kitz-services
                |
           kitz-gateway (auth + orgId + RBAC + rate-limit + audit)
        /      |       |         |             \
  kitz-brain  payments connectors notifications  llm-hub
```

Every hop propagates `traceId`; every request carries `orgId`.
