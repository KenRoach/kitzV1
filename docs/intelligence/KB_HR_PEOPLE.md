# HR & People — KITZ Knowledge Base Intelligence

> Module: HR & People | Sources: 2 | Auto-generated from KITZ Knowledge Base

> Ingestion: Enriched with live web content + WebSearch intelligence

---


## Platform


### Gusto (Payroll & HR) `[Medium]`

- **ID:** PKB-187
- **Type:** Platform
- **URL:** https://gusto.com/
- **Why KITZ Needs It:** Payroll, benefits, HR for small teams
- **Fetch Status:** FAILED (HTTP 403 — blocked by bot protection)

**Intelligence (Enriched):**

Gusto is a cloud-based payroll, benefits, and HR platform for small businesses (1-200 employees). Core features: full-service payroll (automated processing, direct deposit, tax calculations, W-2/1099), benefits administration (health, 401k, HSA/FSA), HR tools (onboarding, offer letters, e-signatures, document management), time & attendance (PTO, scheduling), compliance (automatic tax filing, ACA, new hire reporting), talent management (performance reviews, surveys). Pricing: Simple $40/mo + $6/employee, Plus $60/mo + $9/employee, Premium $135/mo + $16.50/employee, Contractor-only $35/mo + $6/person. Embedded Payroll API (REST, OAuth2) at docs.gusto.com/embedded-payroll for platforms integrating payroll. Integrates with QuickBooks, Xero, Slack, Google Workspace, Expensify. US-focused only -- does NOT support LATAM payroll. LATAM equivalents: Buk (Chile/Colombia/Peru/Mexico), Runa (Mexico), Nominapp (Colombia). KITZ should study Gusto's UX simplicity but build LATAM-native payroll handling local tax authorities (SAT, DIAN, SUNAT, SII, AFIP).


---


## LATAM Context


### CSS Panama — Employer Guide `[High]`

- **ID:** PKB-188
- **Type:** Government
- **URL:** https://w3.css.gob.pa/patrones/
- **Why KITZ Needs It:** Employer obligations & payroll registration in Panama
- **Fetch Status:** FAILED (HTTP 500 — CSS server error)

**Intelligence (Enriched):**

Caja de Seguro Social (CSS) is Panama's social security institution. ALL employers must register within 5 days of first hire. Employer contribution: 12.25% of gross salary. Employee contribution: 9.75% (withheld by employer). Total social security: 22%. Educational Insurance: employer 1.50%, employee 1.25%. Professional Risk: 0.56%-5.67% by industry. Key processes: Planilla Pre-Elaborada (PPE) monthly payroll report due 15th, Ficha de Inscripcion (employee registration within 3 days), Certificado de Paz y Salvo (good standing certificate), late payment incurs 10% surcharge + 1% monthly interest. Digital services via CSS portal (notoriously unreliable). Panama employment essentials: minimum wage varies $3.36-$4.46/hour by region/activity, 30 days vacation/year after 11 months, XIII Month (Aguinaldo) = 1/3 earnings per 4-month period (due April 15, August 15, December 15), severance 1 week/year of service, maternity 14 weeks. Critical for KITZ's Panama compliance pipeline (kitz-services). CSS website unreliability underscores need for KITZ to cache this information locally. Integration opportunity: help SMBs generate PPE reports, calculate contributions, track deadlines. Comparable institutions: IMSS (Mexico), EPS/AFP (Colombia), ESSALUD (Peru), CCSS (Costa Rica).

