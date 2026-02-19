# Kitz
AI-Native Business Operating System

## 1. What We Are

Kitz is an AI-native Business Operating System designed to help small businesses and creators close the technology gap.

It combines:
- CRM and customer communication workflows
- Order and operations management
- Financial insight and capital discipline
- AI-powered agents for execution support
- Educational infrastructure for repeatable learning

Kitz is built as a practical operating layer, not a demo project. It focuses on reliable execution, auditable decisions, and steady improvement.

## 2. Our Mission

Our mission is to close the tech gap for small businesses.

We do that by combining:
- Simplicity in daily operations
- Structured execution instead of ad-hoc work
- AI-assisted growth with human approval gates
- Long-term durability over short-term optics

## 3. How Kitz Works

Kitz runs as an agent-supported operating model with clear accountability.

It is built around:
- A core leadership layer of 12 always-on agents
- Governance agents that enforce review and policy gates
- Event-driven communication through an Event Bus
- A shared Work Ledger for tasks, proposals, decisions, and outcomes
- Institutional Memory stored as auditable records
- Focus discipline to prevent overloaded execution
- Incentive alignment checks across growth, risk, and margin

The model includes:
- Core 12 leadership agents for continuous oversight
- Ad-hoc digital interns for scoped, temporary problem-solving
- A Reviewer gate before critical recommendations proceed
- A Networking Bot that publishes organizational digests
- A digital board of directors for strategic advisory input
- External advisory councils in US/US/CN slots for comparative review

## 4. Agent Operating Model

Core principles:
- Event-driven
- Proposal-based
- Review-gated
- Logged decisions
- No direct agent chat
- Structured artifacts only

Execution flow:
- Events -> Tasks -> Proposals -> Decisions -> Outcomes

Agents do not execute production changes directly. They propose changes through traceable artifacts, and approvals control progression.

## 5. Governance & Capital Philosophy

Kitz applies a clear capital model after:

Revenue - Expenses - R&D

Distribution model:
- 50% Founder earnings
- 45% Strategic impact aligned with mission
- 5% Agent technology improvement

Guardrails:
- Runway thresholds must be respected before distributions
- Margin protection takes priority over growth optics
- Sustainability and resilience are prioritized over short-term narrative wins

## 6. Folder Structure Overview

High-level operating structure:
- `/aos`: Agent Operating System module (event bus, ledger, policies, bots, CLI, tests)
- `/org`: organizational policy and structure layer (represented today through `aos/config`)
- `/agents`: agent role implementations (represented today through `aos/src/agents`)
- `/ledger`: institutional memory and artifact records (represented today through `aos/src/ledger` and `aos/data`)
- `/runbooks`: operational procedures and incident/release playbooks (`docs/ops/runbooks`)

Workspace repositories included:
- `kitz-services`
- `xyz88-io`
- `admin-kitz-services`
- `kitz-gateway`
- `kitz-brain`
- `kitz-whatsapp-connector`
- `kitz-email-connector`
- `kitz-payments`
- `kitz-notifications-queue`
- `kitz-knowledge-base`
- `kitz-schemas`
- `kitz-llm-hub`
- `kitz-docs`

## 7. Development Setup

### Prerequisites
- Node.js 20+
- npm

### Install dependencies
Run per package as needed:

```bash
cd <package>
npm install
```

Common packages:
- `aos`
- `xyz88-io`
- `kitz-services`
- `kitz-gateway`

### Environment variables
Copy package examples before local runs:

```bash
cp <package>/.env.example <package>/.env
```

Do not commit secrets. Use the Gateway one-time token pattern where credentials are required.

### Run locally
AOS examples:

```bash
cd aos
node run simulate-event BUG_REPORTED
node run create-sample-ledger
node run digest
```

Service examples:

```bash
cd xyz88-io
npm run dev
```

```bash
cd kitz-services
npm run dev
```

### Run tests

```bash
cd aos
npm run typecheck
npm test
```

```bash
cd xyz88-io
npm run validate:full
```

## 8. Contributing Guidelines

- All material changes must pass Reviewer logic before recommendation or merge progression.
- No direct deploy actions from agents without explicit approval gates.
- Add or update tests for every meaningful behavior change.
- Log decisions and outcomes in institutional memory artifacts.
- Keep changes small, auditable, and reversible.

## 9. Long-Term Vision

Kitz is designed to be:
- A durable AI-native company
- A governed execution machine
- A compounding knowledge system
- A mission-aligned economic engine

The long-term goal is disciplined, repeatable performance for operators who need practical systems, not complexity.

## Notes

- Branding and naming in this repo use **Kitz**.
- Legacy/old naming has been removed from this root README.
