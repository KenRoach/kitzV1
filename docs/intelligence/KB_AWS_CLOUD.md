# AWS Cloud — KITZ Knowledge Base Intelligence

> Module: AWS Cloud | Sources: 20 | Auto-generated from KITZ Knowledge Base
> Ingestion: Enriched with WebSearch intelligence

---

## Cloud Infrastructure

### AWS — Amazon Web Services (Main Portal) [Critical]
- **ID:** PKB-517
- **URL:** https://aws.amazon.com/
- **Why KITZ Needs It:** Primary cloud infrastructure provider

**Intelligence:**
AWS is the world's most comprehensive cloud platform, offering 200+ services from data centers globally. For KITZ deployment:
- **Compute**: EC2 (virtual servers), Lambda (serverless), ECS/EKS (containers)
- **Storage**: S3 (object storage), EBS (block storage), EFS (file storage)
- **Database**: RDS (PostgreSQL — KITZ's DB), DynamoDB (NoSQL), ElastiCache (Redis)
- **AI/ML**: Bedrock (foundation models including Claude), SageMaker (ML platform)
- **Messaging**: SES (email), SNS (notifications), SQS (queues)
- **Networking**: CloudFront (CDN), Route 53 (DNS), VPC, API Gateway

### AWS Free Tier [Critical]
- **ID:** PKB-518
- **URL:** https://aws.amazon.com/free/
- **Why KITZ Needs It:** Cost-effective entry for KITZ users and development

**Intelligence:**
- New customers get up to $200 in credits ($100 sign-up + $100 exploration)
- **Always Free**: Lambda (1M requests/month + 400K GB-sec), DynamoDB (25 GB), CloudWatch (10 custom metrics)
- **12 Months Free**: EC2 (750 hrs/month t2.micro), S3 (5 GB), RDS (750 hrs db.t2.micro)
- **Free Trials**: Bedrock, SageMaker, specific services with trial periods
- KITZ can run MVP on free tier for development and testing

### AWS Activate — Startup Program [Critical]
- **ID:** PKB-519
- **URL:** https://aws.amazon.com/activate/
- **Why KITZ Needs It:** Startup credits for KITZ infrastructure

**Intelligence:**
- **Founders Tier**: $1,000 in AWS credits
- **Portfolio Tier**: Up to $100,000 in credits (via accelerator/VC partnership)
- Includes business support, training, and architecture guidance
- Goal: Make credits last as long as possible during early stage

### Amazon Bedrock — Foundation Models [Critical]
- **ID:** PKB-524
- **URL:** https://aws.amazon.com/bedrock/
- **Why KITZ Needs It:** Managed access to Claude and other foundation models

**Intelligence:**
- **Claude on Bedrock**: Claude Sonnet 4.6 now available (Feb 2026), Claude Sonnet 4.5 in GovCloud
- **Pricing**: Pay-as-you-go per token, Batch (50% savings for async), Provisioned Throughput for guaranteed capacity
- **Intelligent Prompt Routing**: Auto-routes between models (e.g., Sonnet + Haiku) — up to 30% cost reduction
- **Model Garden**: Access to Anthropic, Meta (Llama), Cohere, Stability AI, Amazon Titan
- **RAG**: Built-in Knowledge Bases for Bedrock — managed RAG pipeline
- **Agents**: Bedrock Agents for multi-step task orchestration
- **KITZ Integration**: Alternative to direct Anthropic API via kitz-llm-hub

## Compute & Serverless

### Amazon EC2 — Virtual Servers [High]
- **ID:** PKB-520
- **URL:** https://aws.amazon.com/ec2/
- **Why KITZ Needs It:** Virtual server infrastructure for KITZ services

### Amazon S3 — Object Storage [High]
- **ID:** PKB-521
- **URL:** https://aws.amazon.com/s3/
- **Why KITZ Needs It:** Object storage for documents, media, backups

**Intelligence:**
- Free tier: 5 GB standard storage, 20K GET, 2K PUT requests
- Standard: $0.023/GB/month, Infrequent Access: $0.0125/GB
- Use for: KITZ user uploads, WhatsApp media, invoice PDFs, backups

### AWS Lambda — Serverless Functions [High]
- **ID:** PKB-522
- **URL:** https://aws.amazon.com/lambda/
- **Why KITZ Needs It:** Serverless compute for event-driven processing

**Intelligence:**
- Free tier: 1M requests + 400K GB-seconds/month (permanent)
- After free tier: $0.20/million requests + $0.0000166667/GB-second
- Use for: Webhook handlers, notification processing, scheduled tasks
- Max 15-min execution, 10 GB memory, supports Node.js/Python/Go

### Amazon RDS & DynamoDB — Managed Databases [High]
- **ID:** PKB-523
- **URL:** https://aws.amazon.com/rds/
- **Why KITZ Needs It:** Managed PostgreSQL for KITZ production database

### Amazon SES — Email Service [High]
- **ID:** PKB-526
- **URL:** https://aws.amazon.com/ses/
- **Why KITZ Needs It:** Transactional and marketing email delivery

**Intelligence:**
- Use for: kitz-email-connector outbound email delivery
- Pricing: $0.10/1,000 emails sent
- Features: DKIM, SPF, DMARC authentication, dedicated IPs, reputation dashboard
- Receiving: Free inbound email processing via Lambda/SNS

## Developer Tools

### AWS Amplify — Full-Stack Web/Mobile [High]
- **ID:** PKB-528
- **URL:** https://aws.amazon.com/amplify/
- **Why KITZ Needs It:** Full-stack hosting for KITZ web UI

**Intelligence:**
- Pay only for what you use, free tier available
- Features: CI/CD, hosting, auth (Cognito), API (AppSync/REST), storage
- Use for: KITZ React SPA deployment, user authentication

### Amazon Cognito — User Authentication [High]
- **ID:** PKB-530
- **URL:** https://aws.amazon.com/cognito/
- **Why KITZ Needs It:** Managed user authentication service

**Intelligence:**
- Free tier: 50,000 MAUs (monthly active users)
- Features: OAuth 2.0, SAML, social login (Google, Facebook), MFA
- Use for: Replacing KITZ's in-memory user store with production auth

### Amazon CloudFront — CDN & Edge [High]
- **ID:** PKB-527
- **URL:** https://aws.amazon.com/cloudfront/
- **Why KITZ Needs It:** Content delivery for KITZ web UI and API caching

### Amazon Lightsail — Simple VPS [High]
- **ID:** PKB-529
- **URL:** https://aws.amazon.com/lightsail/
- **Why KITZ Needs It:** Simple VM hosting alternative for KITZ services

### Amazon SageMaker — ML Platform [High]
- **ID:** PKB-525
- **URL:** https://aws.amazon.com/sagemaker/
- **Why KITZ Needs It:** ML platform for custom model training and deployment

### AWS CodePipeline & CodeBuild — CI/CD [Medium]
- **ID:** PKB-531
- **URL:** https://aws.amazon.com/codepipeline/
- **Why KITZ Needs It:** CI/CD pipeline for automated deployments

### AWS Documentation Hub [High]
- **ID:** PKB-532
- **URL:** https://docs.aws.amazon.com/
- **Why KITZ Needs It:** Comprehensive documentation reference

### AWS Skill Builder — Free Training [High]
- **ID:** PKB-533
- **URL:** https://explore.skillbuilder.aws/
- **Why KITZ Needs It:** Training resources for cloud architecture

### AWS Well-Architected Framework [High]
- **ID:** PKB-534
- **URL:** https://aws.amazon.com/architecture/well-architected/
- **Why KITZ Needs It:** Architecture best practices for production

### AWS Pricing Calculator [Medium]
- **ID:** PKB-535
- **URL:** https://calculator.aws/
- **Why KITZ Needs It:** Cost estimation for infrastructure planning
