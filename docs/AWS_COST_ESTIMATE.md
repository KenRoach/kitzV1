# Kitz OS — AWS Migration Cost Estimate

**Date**: 2026-03-10
**Current hosting**: Railway (production) + Supabase (managed PostgreSQL)
**Target**: AWS (us-east-1, with consideration for LatAm edge via CloudFront)

---

## Executive Summary

Moving Kitz to AWS would cost approximately **$450–$850/month** for a startup-scale deployment, or **$1,200–$2,500/month** for a production-grade setup with high availability. The current Railway setup is likely cheaper at low scale, but AWS becomes more cost-effective and operationally flexible as you grow past ~50 concurrent users or need multi-region presence for LatAm.

---

## Current Infrastructure Profile

| Component | Current | Docker Memory Limit |
|-----------|---------|-------------------|
| kitz_os (core engine) | 1 container | 1 GB |
| workspace (CRM/orders) | 1 container | 512 MB |
| kitz-whatsapp-connector | 1 container (stateful) | 512 MB |
| kitz-gateway | 1 container | — |
| kitz-payments | 1 container | — |
| kitz-notifications-queue | 1 container | — |
| admin-kitz-services | 1 container | — |
| kitz-brain | cron-based | — |
| PostgreSQL 16 | Supabase (managed) | 512 MB (local) |
| UI (React SPA) | Static bundle | — |
| Total services in compose | 5 (3 app + DB + migrate) | ~2.5 GB |
| Total deployable services | 8 on Railway | — |

**Key constraints**:
- WhatsApp connector is **stateful** (Baileys TCP sessions, auth persisted to disk)
- kitz_os needs **ffmpeg** installed (video generation via Remotion)
- No Redis/message queue — all in-memory with NDJSON file persistence
- Cron jobs run inside service processes (node-cron), not external schedulers
- ~30 environment variables across services

---

## Option A: ECS Fargate (Recommended for Kitz)

Serverless containers — no EC2 instances to manage. Best fit for Kitz's current scale.

### Compute — ECS Fargate

| Service | vCPU | Memory | Tasks | Monthly Cost |
|---------|------|--------|-------|-------------|
| kitz_os | 0.5 | 1 GB | 1 | $29 |
| workspace | 0.25 | 0.5 GB | 1 | $15 |
| kitz-whatsapp-connector | 0.25 | 0.5 GB | 1 | $15 |
| kitz-gateway | 0.25 | 0.5 GB | 1 | $15 |
| kitz-payments | 0.25 | 0.5 GB | 1 | $15 |
| kitz-notifications-queue | 0.25 | 0.5 GB | 1 | $15 |
| admin-kitz-services | 0.25 | 0.5 GB | 1 | $15 |
| kitz-brain | 0.25 | 0.5 GB | 1 | $15 |
| **Subtotal** | | | **8** | **~$134/mo** |

*Fargate pricing: $0.04048/vCPU/hr + $0.004445/GB/hr (us-east-1)*

### Database — RDS PostgreSQL

| Option | Instance | Storage | Monthly Cost |
|--------|----------|---------|-------------|
| **Dev/Starter** | db.t4g.micro (2 vCPU, 1 GB) | 20 GB gp3 | ~$13/mo |
| **Production** | db.t4g.small (2 vCPU, 2 GB) | 50 GB gp3 | ~$27/mo |
| **HA Production** | db.t4g.small Multi-AZ | 50 GB gp3 | ~$54/mo |

*Alternative*: Keep Supabase ($25/mo Pro plan) and skip RDS entirely — reduces migration risk.

### Networking & Load Balancing

| Component | Monthly Cost |
|-----------|-------------|
| Application Load Balancer (ALB) | $16 + $5.60/LCU-hr ≈ **$22/mo** |
| NAT Gateway (1 AZ) | $32 + $0.045/GB ≈ **$37/mo** |
| NAT Gateway (2 AZ, HA) | ≈ **$74/mo** |
| VPC, subnets, security groups | **$0** |
| Route 53 hosted zone | **$0.50/mo** |

### Storage

| Component | Purpose | Monthly Cost |
|-----------|---------|-------------|
| EFS (Elastic File System) | WhatsApp auth state, battery ledger NDJSON | ~$3/mo (< 1 GB) |
| S3 | SPA hosting, artifacts, PDF/video output | ~$2/mo (< 10 GB) |
| ECR | Container images (8 services) | ~$3/mo |

### CDN & Static Hosting

| Component | Monthly Cost |
|-----------|-------------|
| CloudFront (SPA + API edge) | ~$5/mo (< 100 GB transfer) |
| S3 (SPA origin) | included above |

### Monitoring & Logging

| Component | Monthly Cost |
|-----------|-------------|
| CloudWatch Logs (8 services) | ~$5/mo (< 5 GB ingest) |
| CloudWatch Metrics + Alarms | ~$3/mo |
| X-Ray (tracing, optional) | ~$5/mo |

### Secrets & Config

| Component | Monthly Cost |
|-----------|-------------|
| Secrets Manager (~30 secrets) | ~$12/mo ($0.40/secret/mo) |
| Parameter Store (free tier) | **$0** |

*Alternative*: Use SSM Parameter Store SecureString for all secrets — **$0** (free tier covers it).

---

### Option A Total: ECS Fargate

| Tier | Components | Monthly Estimate |
|------|-----------|-----------------|
| **Starter** | Fargate + RDS micro + ALB + 1 NAT + EFS + S3 + CloudWatch | **$450–$550/mo** |
| **Production** | Fargate + RDS small + ALB + 2 NAT + EFS + S3 + CloudFront + CloudWatch | **$650–$850/mo** |
| **HA Production** | Fargate (2 tasks/svc) + RDS Multi-AZ + ALB + 2 NAT + EFS + S3 + CloudFront | **$1,200–$1,600/mo** |

---

## Option B: ECS on EC2 (Cost-Optimized)

Run containers on EC2 instances you manage — cheaper but more ops overhead.

### Compute

| Configuration | Instance | Monthly Cost |
|--------------|----------|-------------|
| **Single node** | t4g.medium (2 vCPU, 4 GB) — all 8 services | ~$24/mo (1yr reserved) |
| **Two nodes** | 2× t4g.small (2 vCPU, 2 GB) — split services | ~$24/mo (1yr reserved) |
| **Spot instances** | t4g.medium spot | ~$8–12/mo |

*On-demand t4g.medium: ~$49/mo. Reserved 1yr: ~$24/mo. Spot: ~$8–12/mo.*

### Option B Total: ECS on EC2

| Tier | Components | Monthly Estimate |
|------|-----------|-----------------|
| **Budget** | 1× t4g.medium (reserved) + RDS micro + ALB + 1 NAT | **$250–$350/mo** |
| **Production** | 2× t4g.small (reserved) + RDS small + ALB + 2 NAT | **$400–$550/mo** |

---

## Option C: App Runner (Simplest Migration from Railway)

AWS App Runner is the closest AWS equivalent to Railway — container-based PaaS.

| Service | vCPU | Memory | Monthly Cost |
|---------|------|--------|-------------|
| Per service (8 total) | 0.25 | 0.5 GB | ~$5–15/service |
| **Subtotal** | | | **~$100–$200/mo** |

*App Runner pricing: $0.064/vCPU/hr (only while processing) + $0.007/GB/hr (provisioned).*

**Caveats**: No EFS support (WhatsApp auth state problem), limited VPC integration, no cron support. Would need workarounds for stateful WhatsApp connector.

### Option C Total: App Runner

| Tier | Components | Monthly Estimate |
|------|-----------|-----------------|
| **If it fits** | App Runner + RDS micro + S3 | **$300–$450/mo** |

**Verdict**: App Runner won't work cleanly for Kitz due to the stateful WhatsApp connector. Use Fargate instead.

---

## Cost Comparison: Railway vs AWS

| Item | Railway (current) | AWS Fargate (Starter) | AWS Fargate (Prod) |
|------|-------------------|----------------------|-------------------|
| Compute (8 services) | ~$40–80/mo (Hobby/Pro) | ~$134/mo | ~$268/mo (2 tasks each) |
| Database | Supabase $25/mo | RDS $13–54/mo | RDS $27–54/mo |
| Networking | Included | $60–110/mo (ALB + NAT) | $100–110/mo |
| Storage | Included | ~$8/mo | ~$8/mo |
| CDN | None | ~$5/mo | ~$5/mo |
| Monitoring | Basic | ~$8/mo | ~$13/mo |
| Secrets | Included | $0–12/mo | $0–12/mo |
| **Total** | **~$65–$105/mo** | **~$450–$550/mo** | **~$650–$1,600/mo** |

**Railway is 4–8× cheaper at current scale.** AWS becomes justified when you need:
- Auto-scaling beyond Railway's limits
- Multi-region for LatAm latency (São Paulo, Bogotá)
- Compliance requirements (SOC2, HIPAA, PCI-DSS)
- VPC isolation for payment processing
- Custom networking (VPN to bank APIs, private endpoints)
- SLA guarantees (99.99% vs Railway's best-effort)

---

## Hidden / Often-Forgotten AWS Costs

| Cost | Estimate | Notes |
|------|----------|-------|
| Data transfer out | $0.09/GB | First 100 GB/mo free, then adds up |
| Cross-AZ traffic | $0.01/GB each way | Adds up with multi-AZ RDS + Fargate |
| NAT Gateway data processing | $0.045/GB | All outbound from private subnets |
| CloudWatch Logs ingestion | $0.50/GB | Can spike with verbose logging |
| Secrets Manager API calls | $0.05/10K calls | Minimal for 8 services |
| ECR storage beyond 500 MB | $0.10/GB/mo | Keep image count trimmed |
| ALB idle hours | Charged even with 0 traffic | $16/mo minimum |

---

## Migration Effort Estimate

| Task | Effort |
|------|--------|
| Terraform/CDK IaC for VPC, ECS, RDS, ALB | 2–3 days |
| Dockerfiles already exist (no changes needed) | 0 days |
| ECS task definitions + service configs | 1–2 days |
| RDS setup + migration from Supabase | 1 day |
| Secrets Manager / Parameter Store setup | 0.5 days |
| EFS mount for WhatsApp auth state | 0.5 days |
| CI/CD pipeline (GitHub Actions → ECR → ECS) | 1 day |
| DNS cutover (Route 53) | 0.5 days |
| CloudFront + S3 for SPA | 0.5 days |
| Testing + validation | 1–2 days |
| **Total** | **~8–11 days** |

---

## Recommendations

1. **Stay on Railway for now** — At current scale, Railway + Supabase (~$65–105/mo) is dramatically cheaper and lower-ops than any AWS option.

2. **If you must move to AWS**, use **ECS Fargate (Option A, Starter tier)** at ~$450–550/mo. It's the closest operational model to Railway (no servers to manage) while giving you VPC, IAM, and compliance capabilities.

3. **Cost reduction levers on AWS**:
   - Use **Fargate Spot** for non-critical services (brain, notifications, admin) — saves ~30%
   - Use **SSM Parameter Store** instead of Secrets Manager — saves $12/mo
   - Use **VPC endpoints** for S3/ECR to avoid NAT Gateway data charges
   - Consolidate services (kitz_os already absorbs comms-api + email-connector logic) — fewer Fargate tasks = less cost
   - Consider **ARM64 (Graviton)** — Fargate ARM is 20% cheaper and Node.js runs well on it

4. **When to move**: Consider AWS migration when you hit **100+ daily active users**, need **multi-region** (São Paulo `sa-east-1` for LatAm), or when a customer requires **SOC2/PCI compliance**.

5. **Hybrid option**: Keep Supabase for PostgreSQL (proven, managed), move compute to AWS Fargate. Saves the RDS cost and migration risk.
