# SOP: Office Work Automation

## Purpose
Generate business documents (invoices, reports, contracts, proposals) and spreadsheet reports from data and context.

## Trigger
- User requests document ("genera una factura para Juan")
- Order completed → auto-generate receipt
- Weekly/monthly → scheduled business reports
- New client → draft service contract

## Flow
1. **Receive request** → Classify document type + gather data
2. **Generate** → `brain/skills/officeAutomation.ts` (Sonnet tier)
3. **Review** → Present draft document (draft-first)
4. **Approve** → User confirms or edits
5. **Deliver** → Return as markdown, HTML, CSV, or PDF

## Document Types
| Type | Use Case | Data Source |
|------|----------|-------------|
| Invoice | Bill customers | Orders + contacts CRM |
| Receipt | Confirm payment | Payment records |
| Report | Business metrics | Sales/inventory data |
| Contract | Service agreements | Client info + templates |
| Proposal | Win new business | Client needs + pricing |
| Agenda | Meeting prep | Calendar + notes |
| Memo | Internal comms | Free-form context |

## Panama-Specific
- ITBMS (7% tax) included on invoices when applicable
- RUC number field on commercial documents
- Panama commercial law clauses in contracts

## AI Battery Cost
- Document generation: ~1.0 credits
- Spreadsheet reports: ~1.0 credits

## Reference Repos
- OfficeAI — AI plugin for Office/WPS
- sv-excel-agent — Excel MCP agent
- ONLYOFFICE — open-source office suite with AI
- OpenAdapt — generative RPA
- RPA Framework — Python RPA tools
