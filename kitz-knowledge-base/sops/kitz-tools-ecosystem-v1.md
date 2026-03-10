# SOP: KITZ Tools Ecosystem

## Overview
KitZ has 16 interconnected tools/products, all under the `kitz.services` domain. Each tool serves a specific function in the sales, onboarding, operations, or marketing pipeline.

## Tool Categories

### Sales (7 tools)
| Tool | Subdomain | Purpose |
|------|-----------|---------|
| Live Demo | demo.kitz.services | 60-second pipeline demo for prospects |
| ROI Calculator | roi.kitz.services | CFO-closing ROI comparison |
| AI Battery Calculator | battery.kitz.services | Credit consumption breakdown |
| Proposal Generator | proposals.kitz.services | Full proposals in 2 minutes |
| Prospect Outreach | outreach.kitz.services | First-touch message generator |
| WhatsApp Sequences | sequences.kitz.services | 5-touch follow-up sequences |
| Battlecard Agent | battlecards.kitz.services | Competitive rebuttals |

### Marketing (2 tools)
| Tool | Subdomain | Purpose |
|------|-----------|---------|
| Content Engine | content.kitz.services | LinkedIn + WhatsApp content |
| Demand Gen | demandgen.kitz.services | Multi-channel campaign strategy |

### Operations (2 tools)
| Tool | Subdomain | Purpose |
|------|-----------|---------|
| Command Center | command.kitz.services | Service monitoring dashboard |
| User Intelligence | intelligence.kitz.services | Contact tracking + churn alerts |

### Onboarding (2 tools)
| Tool | Subdomain | Purpose |
|------|-----------|---------|
| Onboarding Flow | onboarding.kitz.services | Module recommendation wizard |
| Onboarding Assistant | assist.kitz.services | Client-facing chatbot |

### Channel (1 tool)
| Tool | Subdomain | Purpose |
|------|-----------|---------|
| Partner Reseller Kit | partners.kitz.services | Co-branded partner materials |

### Product (1 tool)
| Tool | Subdomain | Purpose |
|------|-----------|---------|
| RenewFlow | renewflow.kitz.services | Warranty renewal platform |

### Core Platform
| Tool | Subdomain | Purpose |
|------|-----------|---------|
| Sales Team AI | sales.kitz.services | Full AI sales pipeline |
| Workspace | workspace.kitz.services | CRM, orders, tasks, checkout |

## Sales Flow
1. Demand Gen generates interest
2. Content Engine builds inbound pipeline
3. Prospect Outreach sends first touch
4. WhatsApp Sequences follow up
5. Live Demo shows the platform
6. Battlecard Agent handles objections
7. ROI/Battery Calculator quantifies value
8. Proposal Generator creates the offer
9. Sales Team AI closes the deal
10. Onboarding Flow activates the client

## Interconnection Rules
- All tools share the same design system (dark bg, purple #7C3AED, JetBrains Mono)
- All tools link to kitz.services and to related tools
- kitz_os knows about all tools via `list_kitz_tools`, `get_kitz_tool`, `recommend_kitz_tool`
- AI agents can reference tool URLs when responding to users
- WhatsApp messages can include tool links for prospects

## Domain Pattern
`{slug}.kitz.services` — all under one domain, subdomains per tool.
