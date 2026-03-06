# Google Cloud Platform (GCP) & Google Workspace — Tech Provider Knowledge Base

## Company Overview
- **Parent**: Alphabet Inc. (GOOGL/GOOG, NASDAQ)
- **Revenue**: ~$43B (Google Cloud, 2024), ~$307B (Alphabet total)
- **CEO**: Sundar Pichai (Alphabet), Thomas Kurian (Google Cloud)
- **Cloud market share**: ~12% (#3 behind AWS and Azure)
- **Regions**: 40 cloud regions, 121 zones

## Google Cloud Platform (GCP)

### Compute
- **Compute Engine**: VMs (general, compute, memory, accelerator optimized). Custom machine types
- **Cloud Run**: Serverless containers (scale to zero)
- **Cloud Functions**: Serverless functions (event-driven)
- **GKE (Google Kubernetes Engine)**: Managed Kubernetes (#1 K8s service, Google created K8s)
- **App Engine**: PaaS for web apps (standard + flexible environments)

### Storage & Database
- **Cloud Storage**: Object storage (Standard, Nearline, Coldline, Archive)
- **Cloud SQL**: Managed MySQL, PostgreSQL, SQL Server
- **Firestore**: Serverless NoSQL document database (real-time sync)
- **Cloud Spanner**: Globally distributed relational database (unlimited scale)
- **Bigtable**: Wide-column NoSQL (analytics, time-series)
- **AlloyDB**: PostgreSQL-compatible, 4x faster than standard PostgreSQL
- **Memorystore**: Managed Redis/Memcached

### AI/ML (Google's Crown Jewel)
- **Vertex AI**: Unified ML platform (build, deploy, manage models)
- **Gemini API**: Google's frontier model family (Pro, Ultra, Flash)
- **AI Studio**: Rapid prototyping with Gemini
- **Vertex AI Agent Builder**: Build AI agents with grounding, RAG, search
- **TPUs (Tensor Processing Units)**: Google's custom AI chips (v5e, v5p) — cost-effective training
- **Document AI**: Document parsing, OCR, entity extraction
- **Translation API**: 100+ languages, real-time translation
- **Speech-to-Text / Text-to-Speech**: Multi-language voice processing
- **Natural Language API**: Sentiment, entity, syntax analysis
- **Vision AI**: Image classification, object detection, OCR

### Data Analytics
- **BigQuery**: Serverless data warehouse (ML built-in, streaming, federated queries)
- **Looker**: Business intelligence & analytics
- **Dataflow**: Stream & batch data processing (Apache Beam)
- **Pub/Sub**: Real-time messaging/event streaming
- **Dataproc**: Managed Spark/Hadoop

### Networking
- **VPC**: Virtual private cloud with global scope
- **Cloud CDN**: Content delivery (Google's global edge network)
- **Cloud DNS**: Managed DNS
- **Cloud Load Balancing**: Global, anycast load balancing
- **Cloud Armor**: DDoS protection + WAF

### Security
- **IAM**: Fine-grained access control
- **Security Command Center**: Centralized security management
- **BeyondCorp Enterprise**: Zero-trust access (Google invented BeyondCorp)
- **Chronicle**: Cloud-native SIEM (Google-scale threat detection)
- **Mandiant**: Incident response + threat intelligence (acquired 2022)
- **reCAPTCHA Enterprise**: Bot detection

## Google Workspace (Productivity Suite)

### Apps
- **Gmail**: Business email (custom domain)
- **Google Drive**: Cloud storage (15GB free, 2TB+ on paid plans)
- **Google Docs / Sheets / Slides**: Collaborative documents
- **Google Meet**: Video conferencing (up to 1000 participants on Enterprise)
- **Google Chat**: Team messaging (spaces, threads)
- **Google Calendar**: Scheduling, appointment slots
- **Google Forms**: Surveys, data collection
- **Google Sites**: Simple website builder
- **AppSheet**: No-code app builder (included in some plans)
- **Gemini for Workspace**: AI assistant across all Workspace apps

### Plans & Pricing
| Plan | Price | Storage | Features |
|------|-------|---------|----------|
| Business Starter | $7/user/mo | 30GB | Email, Meet (100p), basic |
| Business Standard | $14/user/mo | 2TB | Meet recording, AppSheet Core |
| Business Plus | $18/user/mo | 5TB | Vault, advanced endpoint mgmt |
| Enterprise | Custom | Unlimited | DLP, S/MIME, compliance, Gemini |
| Gemini add-on | $20/user/mo | — | AI features across all apps |

## SMB Programs & Relevance
- **Google Workspace**: Dominant in SMBs globally — easy setup, no server needed, real-time collaboration
- **Google for Startups Cloud Program**: Up to $200K in GCP credits + Workspace credits
- **Firebase**: Free tier backend for mobile/web apps (auth, Firestore, hosting, functions)
- **AppSheet**: No-code app builder (CRM, inventory, field ops) — included in Business Standard+
- **Google Business Profile**: Free business listing on Google Search + Maps (critical for local SMBs)
- **Google Ads**: PPC advertising (search, display, YouTube, shopping)
- **Google Analytics 4 (GA4)**: Free web/app analytics
- **Looker Studio**: Free dashboards/reports connected to any data source

## Partner Program (Google Cloud Partner Advantage)
- **Tracks**: Sell, Service, Build (ISV)
- **Levels**: Member, Partner, Premier
- **Specializations**: Data Analytics, ML, Infrastructure, Security, Work Transformation, Application Development
- **Distribution**: Ingram Micro, TD SYNNEX, Pax8, AppDirect
- **Google Cloud Marketplace**: List and sell solutions

## LatAm Presence
- **GCP Regions**: Sao Paulo (southamerica-east1), Santiago (southamerica-west1), Mexico (coming)
- **Offices**: Sao Paulo, Mexico City, Bogota, Buenos Aires, Santiago
- **Google Workspace**: Extremely popular in LatAm SMBs (often the first "IT system" adopted)
- **Google for Education**: Strong presence in LatAm schools (Chromebooks + Workspace)
- **Language**: Full Spanish/Portuguese console, docs, support
- **Local billing**: Available in Brazil (BRL), Mexico (MXN)

## APIs & Integration Points
- **Google Workspace APIs**: Gmail, Calendar, Drive, Sheets, Docs, Admin SDK, Chat, Meet
- **Google Cloud APIs**: 400+ APIs for all GCP services
- **Firebase SDK**: Auth, Firestore, Cloud Messaging, Analytics, Crashlytics
- **Google Maps Platform API**: Maps, Places, Geocoding, Directions, Distance Matrix
- **Google Ads API**: Campaign management, reporting, keyword planning
- **YouTube Data API**: Video management, analytics, live streaming
- **Google OAuth 2.0**: Identity provider (Sign in with Google)
- **Pub/Sub**: Event-driven messaging (real-time data pipelines)
- **Apigee**: Full API management platform (gateway, analytics, developer portal)
- **Vertex AI API**: Model serving, prediction, tuning

## Pricing Benchmarks (SMB, USD, 2024-2025)
| Service | Price |
|---------|-------|
| Compute Engine e2-micro | Free tier (1 instance) |
| Compute Engine e2-medium | ~$24/mo |
| Cloud Run (2M requests/mo) | Free tier covers this |
| Cloud SQL (db-f1-micro, Postgres) | ~$7/mo |
| Cloud Storage (Standard, per GB) | $0.020/GB/mo |
| BigQuery (1TB query) | $6.25 |
| Firestore (1GB stored + 50K reads/day) | Free tier |
| Firebase Hosting (10GB storage + 360MB/day) | Free tier (Spark plan) |
| Gemini 1.5 Flash (input) | $0.075/1M tokens |
| Gemini 1.5 Pro (input) | $1.25/1M tokens |

## Key Differentiators
- **AI/ML leadership**: Invented Transformers, TensorFlow, TPUs, BERT. Gemini competitive with GPT-4
- **Data analytics**: BigQuery is best-in-class serverless data warehouse
- **Kubernetes native**: Google created Kubernetes, GKE is the gold standard
- **Global network**: Google's private fiber backbone — lowest latency
- **Workspace simplicity**: Easiest productivity suite to adopt for SMBs
- **Generous free tiers**: Firebase, Cloud Run, BigQuery, Cloud Functions all have useful free tiers
- **Open source commitment**: Kubernetes, TensorFlow, Angular, Go, Flutter — massive OSS portfolio

## Security & Compliance
- **BeyondCorp**: Google pioneered zero-trust networking
- **Titan Security Keys**: Hardware-backed 2FA
- **Confidential Computing**: Encrypted-in-use VMs (Confidential VMs, Confidential GKE)
- **Mandiant**: World-class incident response + threat intelligence
- **Compliance**: SOC 1/2/3, ISO 27001/27017/27018, PCI-DSS, HIPAA, FedRAMP, GDPR
- **Data encryption**: Encrypted at rest (default AES-256), in transit (TLS), and optionally in use
- **Access Transparency**: Logs of Google admin access to customer data
