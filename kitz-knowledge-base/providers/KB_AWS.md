# Amazon Web Services (AWS) — Tech Provider Knowledge Base

## Company Overview
- **Parent**: Amazon.com (AMZN, NASDAQ)
- **Launched**: 2006 (S3 + EC2)
- **Revenue**: ~$105B (2024), 31% of global cloud market (#1)
- **CEO**: Matt Garman (AWS), Andy Jassy (Amazon)
- **Employees**: ~100,000+ (AWS division)
- **Regions**: 34 geographic regions, 108 Availability Zones

## Core Services

### Compute
- **EC2**: Virtual machines (500+ instance types). Graviton (ARM) for cost savings. Spot instances for 90% savings
- **Lambda**: Serverless functions (pay-per-invocation)
- **ECS / EKS**: Container orchestration (Docker / Kubernetes)
- **Fargate**: Serverless containers
- **Lightsail**: Simple VPS for small workloads (from $3.50/mo)
- **App Runner**: Managed container hosting (from code/image)

### Storage
- **S3**: Object storage (industry standard). Tiers: Standard, IA, Glacier, Deep Archive
- **EBS**: Block storage for EC2
- **EFS**: Managed NFS file system
- **FSx**: Managed Windows/Lustre/NetApp/OpenZFS file systems

### Database
- **RDS**: Managed relational (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server)
- **Aurora**: AWS-built MySQL/PostgreSQL compatible (3-5x performance)
- **DynamoDB**: Serverless NoSQL (single-digit ms latency, infinite scale)
- **ElastiCache**: Managed Redis/Memcached
- **DocumentDB**: MongoDB-compatible
- **Redshift**: Data warehouse

### AI/ML
- **Bedrock**: Managed foundation models (Claude, Llama, Titan, Mistral, Cohere)
- **SageMaker**: Full ML lifecycle (build, train, deploy)
- **Rekognition**: Image/video analysis
- **Transcribe**: Speech-to-text
- **Polly**: Text-to-speech
- **Comprehend**: NLP (sentiment, entities, language detection)
- **Q**: AI assistant for business (Q Business, Q Developer)
- **Trainium / Inferentia**: Custom AI chips (cost-effective training/inference)

### Networking
- **VPC**: Virtual private cloud
- **CloudFront**: CDN (400+ edge locations)
- **Route 53**: DNS service
- **API Gateway**: Managed REST/WebSocket APIs
- **Transit Gateway**: Hub-and-spoke network architecture
- **Direct Connect**: Dedicated network connection to AWS

### Security & Identity
- **IAM**: Identity and access management (users, roles, policies)
- **Cognito**: User authentication for apps (sign-up/sign-in, social login, MFA)
- **WAF**: Web application firewall
- **Shield**: DDoS protection (Standard free, Advanced $3K/mo)
- **GuardDuty**: Threat detection
- **Security Hub**: Centralized security posture
- **KMS**: Key management, encryption

### Application Services
- **SES**: Email sending (transactional + marketing)
- **SNS**: Push notifications, pub/sub messaging
- **SQS**: Message queues (standard + FIFO)
- **EventBridge**: Serverless event bus
- **Step Functions**: Workflow orchestration
- **AppSync**: Managed GraphQL

## SMB Programs & Relevance
- **AWS Free Tier**: 12 months free (EC2 t2.micro, 5GB S3, 25GB DynamoDB, etc.) + always-free services
- **AWS Activate**: Startup credits ($1K-$100K depending on stage + accelerator affiliation)
- **AWS Lightsail**: Simple VPS from $3.50/mo — websites, WordPress, small apps
- **AWS Amplify**: Full-stack web/mobile app framework (hosting + auth + API + storage)
- **AWS IQ**: Find AWS-certified experts for projects
- **AWS re:Post**: Community Q&A (free)
- **AWS Skill Builder**: Free + paid training, certification prep

## Partner Program (AWS Partner Network — APN)
- **Paths**: ISV (software), Services (consulting/MSP), Channel (resellers)
- **Tiers**: Registered, Select, Advanced, Premier
- **Competencies**: Migration, DevOps, Machine Learning, IoT, SaaS, etc.
- **Marketplace**: AWS Marketplace (list/sell SaaS, AMIs, containers, data)
- **Distribution**: TD SYNNEX, Ingram Micro, Arrow, Pax8 (CPPO)

## LatAm Presence
- **AWS Regions**: Sao Paulo (sa-east-1, 3 AZs), Mexico (coming). Edge locations across LatAm
- **Offices**: Sao Paulo, Mexico City, Bogota, Buenos Aires, Santiago, Lima
- **AWS LatAm programs**: Startup lofts, community days, public sector initiatives
- **Pricing**: USD-based, but local currency billing available in Brazil
- **Data sovereignty**: Brazil region allows in-country data residency
- **Language**: Console + docs available in Spanish/Portuguese

## APIs & Integration Points
- **AWS SDK**: Available for JS/TS, Python, Java, Go, .NET, Ruby, PHP, Rust, Swift, Kotlin
- **AWS CLI**: Command-line interface for all services
- **CloudFormation / CDK**: Infrastructure-as-code (JSON/YAML or TypeScript/Python)
- **Terraform**: Full AWS provider support
- **REST APIs**: Every AWS service exposes REST APIs (Signature V4 auth)
- **EventBridge**: Event-driven integration with 30+ AWS services + SaaS partners
- **AppSync**: GraphQL API with real-time subscriptions

## Pricing Benchmarks (SMB, USD, 2024-2025)
| Service | Price |
|---------|-------|
| EC2 t3.micro (Linux, on-demand) | ~$7.60/mo |
| EC2 t3.medium (Linux) | ~$30/mo |
| Lightsail (1vCPU, 1GB) | $3.50/mo |
| S3 Standard (first 50TB) | $0.023/GB/mo |
| RDS db.t3.micro (PostgreSQL) | ~$13/mo |
| DynamoDB (on-demand, 1M reads) | $0.25 |
| Lambda (1M requests, 128MB) | Free tier covers this |
| SES (first 62K emails/mo from EC2) | Free |
| CloudFront (first 1TB/mo) | Free tier |
| Bedrock Claude Haiku (input) | $0.25/1M tokens |

## Key Differentiators
- **Market leader**: 31% cloud market share, largest service catalog (200+ services)
- **Maturity**: Longest-running cloud platform — most battle-tested
- **Breadth**: Services for every use case (compute to satellite ground stations)
- **Serverless leadership**: Lambda, DynamoDB, Fargate, EventBridge — pay only for usage
- **AI/ML**: Bedrock provides managed access to top foundation models (Claude, Llama, Mistral)
- **Global infrastructure**: Most regions and edge locations of any cloud
- **Free tier**: Generous for startups/SMBs to build without upfront cost

## Security & Compliance
- **Shared responsibility model**: AWS secures infrastructure, customer secures workloads
- **Compliance**: SOC 1/2/3, ISO 27001/27017/27018, PCI-DSS Level 1, HIPAA, FedRAMP, GDPR
- **Encryption**: At-rest + in-transit encryption for every service, AWS KMS or customer-managed keys
- **AWS Organizations**: Multi-account governance, SCPs (Service Control Policies)
- **AWS Config**: Configuration compliance tracking
- **CloudTrail**: API audit logging for all AWS calls
