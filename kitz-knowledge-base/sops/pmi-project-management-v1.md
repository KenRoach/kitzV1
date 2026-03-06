# PMI Project Management SOP v1

**Owner:** COO Agent
**Type:** business

## Summary
Apply PMI/PMBOK best practices to help SMB founders plan, execute, and close projects with discipline — adapted for lean teams and LatAm markets.

## PMI Framework (PMBOK 7th Edition — Principle-Based)

### 12 Project Management Principles
1. **Stewardship** — Be a diligent, respectful, and caring steward
2. **Team** — Build a collaborative project team environment
3. **Stakeholders** — Effectively engage with stakeholders
4. **Value** — Focus on value delivery
5. **Systems Thinking** — Recognize, evaluate, and respond to system interactions
6. **Leadership** — Demonstrate leadership behaviors
7. **Tailoring** — Tailor based on context (critical for SMBs — don't over-process)
8. **Quality** — Build quality into processes and deliverables
9. **Complexity** — Navigate complexity
10. **Risk** — Optimize risk responses
11. **Adaptability** — Embrace adaptability and resiliency
12. **Change** — Enable change to achieve the envisioned future state

### 8 Performance Domains
1. **Stakeholder** — Identify, analyze, engage, monitor stakeholders
2. **Team** — Management, leadership, development
3. **Development Approach & Life Cycle** — Predictive, agile, hybrid
4. **Planning** — Scope, schedule, cost, resources, quality, risk
5. **Project Work** — Execution, managing resources, communications
6. **Delivery** — Requirements, scope, quality management
7. **Measurement** — KPIs, metrics, dashboards
8. **Uncertainty** — Risk, ambiguity, complexity

### 5 Process Groups (Classic PMBOK)
1. **Initiating** — Define project, identify stakeholders, get authorization
2. **Planning** — Scope, WBS, schedule, budget, risk register, comms plan
3. **Executing** — Direct work, manage team, quality assurance
4. **Monitoring & Controlling** — Track progress, manage changes, control scope creep
5. **Closing** — Final deliverables, lessons learned, release resources

### 10 Knowledge Areas
1. Integration Management
2. Scope Management
3. Schedule Management
4. Cost Management
5. Quality Management
6. Resource Management
7. Communications Management
8. Risk Management
9. Procurement Management
10. Stakeholder Management

## SMB Adaptations (Kitz-Specific)

### Lean PMI for Solo Founders / Small Teams
- **Skip the bureaucracy** — No 50-page project plans. Use 1-page project charter.
- **WBS in 3 levels max** — Deliverable → Work Package → Task
- **Risk register = 5 risks max** — Focus on the ones that can kill you
- **Weekly status, not daily** — Unless it's a sprint (then daily standup, 15 min max)
- **Definition of Done** — Every task has one. Non-negotiable.
- **Lessons learned** — 3 questions: What worked? What didn't? What changes?

### Tools Mapping
| PMI Concept | Kitz Tool |
|---|---|
| Project Charter | `pmi_project_charter` |
| WBS | `pmi_wbs` |
| Risk Register | `pmi_risk_register` |
| Stakeholder Matrix | `pmi_stakeholder_analysis` |
| Status Report | `pmi_status_report` |
| Lessons Learned | `pmi_lessons_learned` |
| Full Project Plan | `pmi_project_plan` |

## Steps (Using PMI for a New Project)
1. **Initiate** — Define the project in 1 sentence. Who's the sponsor? What's the business case?
2. **Charter** — Use `pmi_project_charter` to create a lean charter (objective, scope, stakeholders, constraints, milestones)
3. **Plan** — Break work into WBS with `pmi_wbs`. Identify top 5 risks with `pmi_risk_register`.
4. **Execute** — Track against plan. Weekly status with `pmi_status_report`.
5. **Monitor** — Watch scope creep (the #1 killer). Track earned value if budget > $5K.
6. **Close** — Capture lessons learned. Release resources. Celebrate.

## Rules
- Every project needs a charter, even if it's 5 lines
- Scope creep is the enemy — document every change request
- Risk management is not optional — identify risks early, review weekly
- The project is not done until lessons learned are captured
- Spanish first for all outputs unless user specifies otherwise
- Adapt the process to the project size — a $500 project doesn't need RACI matrices
