# kitz-services

Marketing + free AI business content hub for Kitz.

## Local development

```bash
npm install
npm run dev
```

## Compliance Agent (Panama)

This repo includes a lightweight compliance agent that:
1. Collects updates from official portals (DGI, Panama Emprende, MITRADEL, CSS).
2. Normalizes updates into a strict schema.
3. Stores data under:
   - `data/compliance-updates/latest/Panama.json`
   - `data/compliance-updates/history/Panama.ndjson`
4. Publishes site content under:
   - `content/compliance/Panama.md`
   - `content/compliance/latest.json`
5. Provides operator-assist files for Lovable:
   - `content/compliance/LOVABLE_UPDATE_INSTRUCTIONS.md`
   - `content/compliance/LATEST_PATCH.md`

## API

- `GET /api/compliance/latest?country=Panama`
- `GET /api/compliance/history?country=Panama&limit=50`
- `POST /api/compliance/run` (requires `x-compliance-token` = `COMPLIANCE_RUN_TOKEN`)

## Run compliance locally

```bash
npm run compliance:local
```

## Scheduled automation

- GitHub Actions workflow: `.github/workflows/compliance-schedule.yml`
- Script: `scripts/compliance-run-and-publish.ts`

The scheduled script updates data/content and attempts a PR via `gh` CLI. If unavailable, it falls back to manual branch/PR workflow.
