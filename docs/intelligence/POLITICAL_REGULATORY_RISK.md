# Political & Regulatory Risk Intelligence for LatAm SMBs

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-25
**Audience:** Kitz platform -- AI agents and backend decision engine
**Classification:** Internal reference -- not legal advice
**Scope:** 18 LatAm markets -- political risk, regulatory environment, compliance obligations

> **Disclaimer:** This document provides general guidance based on publicly available data
> from World Bank, FATF, Transparency International, OFAC, AS/COA, ECLAC, and national
> government sources. Political situations change rapidly. Risk scores should be refreshed
> quarterly. Always consult local legal counsel before making compliance decisions.

---

## Table of Contents

1. [Political Stability by Country](#1-political-stability-by-country)
2. [Election Calendar 2026--2030](#2-election-calendar-2026-2030)
3. [Tax Reform Pipeline](#3-tax-reform-pipeline)
4. [Labor Law Changes](#4-labor-law-changes)
5. [Regulatory Environment](#5-regulatory-environment)
6. [Trade Policy](#6-trade-policy)
7. [FATF & Anti-Money Laundering](#7-fatf--anti-money-laundering)
8. [Sanctions & Compliance](#8-sanctions--compliance)
9. [Expropriation & Property Rights](#9-expropriation--property-rights)
10. [Corruption & Transparency](#10-corruption--transparency)
11. [Digital Regulation](#11-digital-regulation)
12. [Security & Crime Risk](#12-security--crime-risk)
13. [TypeScript Implementation](#13-typescript-implementation)

---

# 1. Political Stability by Country

> Political stability directly impacts SMB operating costs, contract enforceability, currency
> stability, and regulatory predictability. Kitz uses composite scores derived from World Bank
> WGI, Economist Intelligence Unit Democracy Index, and Freedom House ratings to generate
> country-level risk assessments.

---

## 1.1 Composite Political Risk Scores

| Country | Head of State (2026) | Orientation | WGI Political Stability (percentile) | WGI Rule of Law (percentile) | WGI Gov. Effectiveness (percentile) | Democracy Index (EIU) | Kitz Risk Tier |
|---|---|---|---|---|---|---|---|
| **Uruguay** | Yamandu Orsi | Center-left | 78 | 71 | 68 | 8.61 (Full democracy) | LOW |
| **Chile** | Jose Antonio Kast | Center-right | 55 | 80 | 75 | 7.92 (Flawed democracy) | LOW |
| **Costa Rica** | TBD (Feb 2026 election) | TBD | 62 | 65 | 58 | 7.88 (Flawed democracy) | LOW |
| **Panama** | Jose Raul Mulino | Center-right | 52 | 45 | 42 | 7.05 (Flawed democracy) | MEDIUM |
| **Dominican Republic** | Luis Abinader | Center-right | 48 | 38 | 35 | 6.45 (Flawed democracy) | MEDIUM |
| **Brazil** | Luiz Inacio Lula da Silva | Center-left | 30 | 44 | 48 | 6.68 (Flawed democracy) | MEDIUM |
| **Colombia** | Gustavo Petro (until Aug 2026) | Left | 10 | 35 | 40 | 6.72 (Flawed democracy) | MEDIUM-HIGH |
| **Mexico** | Claudia Sheinbaum | Left | 15 | 28 | 42 | 5.69 (Hybrid regime) | MEDIUM-HIGH |
| **Peru** | TBD (Apr 2026 election) | TBD | 18 | 30 | 33 | 5.85 (Hybrid regime) | HIGH |
| **Argentina** | Javier Milei | Libertarian-right | 35 | 32 | 38 | 6.41 (Flawed democracy) | MEDIUM-HIGH |
| **Ecuador** | Daniel Noboa | Center-right | 8 | 22 | 28 | 5.80 (Hybrid regime) | HIGH |
| **Paraguay** | Santiago Pena | Center-right | 38 | 25 | 20 | 6.14 (Flawed democracy) | MEDIUM |
| **Guatemala** | Bernardo Arevalo | Center-left | 22 | 12 | 18 | 4.80 (Hybrid regime) | HIGH |
| **El Salvador** | Nayib Bukele | Authoritarian-right | 42 | 20 | 30 | 4.18 (Hybrid regime) | HIGH |
| **Honduras** | Xiomara Castro | Left | 15 | 10 | 12 | 4.65 (Hybrid regime) | HIGH |
| **Bolivia** | Luis Arce | Left | 12 | 15 | 18 | 4.48 (Hybrid regime) | HIGH |
| **Nicaragua** | Daniel Ortega | Authoritarian-left | 18 | 5 | 8 | 2.64 (Authoritarian) | CRITICAL |
| **Venezuela** | Post-Maduro transition | Authoritarian-left | 3 | 1 | 2 | 2.08 (Authoritarian) | CRITICAL |

> **Kitz Risk Tier definitions:**
> - **LOW** (score 70+): Stable institutions, predictable policy, strong rule of law
> - **MEDIUM** (50--69): Generally stable but with institutional weaknesses or policy uncertainty
> - **MEDIUM-HIGH** (35--49): Significant political risk, policy shifts likely, currency volatility
> - **HIGH** (20--34): Unstable governance, frequent regulatory changes, security concerns
> - **CRITICAL** (<20): Sanctioned, authoritarian, or failing state -- limited business viability

---

## 1.2 Political Orientation and Policy Implications for SMBs

### Left-Leaning Governments (Colombia, Mexico, Bolivia, Honduras)

**Typical policy patterns:**
- Higher minimum wages and expanded labor protections
- Increased social spending funded by corporate/income tax hikes
- Price controls on essential goods (risk for food, pharma, energy SMBs)
- Strengthened unions and collective bargaining mandates
- Suspicion toward foreign investment and free trade agreements
- Expanded public health and education mandates affecting employer obligations

**SMB impact:** Higher operating costs, more compliance burden, but larger consumer base from social spending.

### Right-Leaning / Market-Friendly Governments (Chile, Argentina, El Salvador, Paraguay, Panama)

**Typical policy patterns:**
- Tax simplification and potential rate reductions
- Deregulation and reduced bureaucratic requirements
- Trade liberalization and FDI promotion
- Flexible labor markets and contractor-friendly policies
- Privatization of state enterprises
- Cryptocurrency and fintech-friendly regulation

**SMB impact:** Lower compliance burden, more competitive markets, but reduced social safety nets may limit consumer spending.

### Centrist / Pragmatic Governments (Uruguay, Dominican Republic, Costa Rica, Ecuador)

**Typical policy patterns:**
- Incremental reform rather than radical shifts
- Public-private partnerships
- Balanced trade policy
- Gradual digitization of government services
- Moderate tax adjustments

**SMB impact:** Most predictable operating environment, gradual changes allow planning.

---

# 2. Election Calendar 2026--2030

> Elections are the single largest source of regulatory discontinuity in LatAm. Policy shifts
> of 180 degrees are common after a change in government. Kitz must track election dates to
> warn SMB owners about potential regulatory changes and advise on timing of investments,
> contracts, and expansion.

---

## 2.1 Presidential Elections

### 2026 -- The Super-Cycle Year

| Country | Election Type | Date (Round 1) | Runoff Date | Current President | Term-Limited? |
|---|---|---|---|---|---|
| **Costa Rica** | Presidential + Legislative | Feb 1, 2026 | Apr 5, 2026 | Rodrigo Chaves | Yes (single term) |
| **Bolivia** | Subnational (gubernatorial, municipal) | Mar 22, 2026 | Apr 19, 2026 | Luis Arce | N/A (subnational) |
| **Peru** | Presidential + Legislative | Apr 12, 2026 | Jun 7, 2026 | Dina Boluarte | Yes |
| **Colombia** | Presidential (+ Legislative Mar 8) | May 31, 2026 | Jun 21, 2026 | Gustavo Petro | Yes (single term) |
| **Brazil** | Presidential + Gubernatorial + Legislative | Oct 4, 2026 | Oct 25, 2026 | Lula da Silva | Can run (2 consecutive terms) |
| **Haiti** | Presidential + Legislative (tentative) | Aug 30, 2026 | Dec 6, 2026 | Transitional council | N/A |

### 2027

| Country | Election Type | Expected Date | Notes |
|---|---|---|---|
| **Mexico** | Midterm legislative (Chamber of Deputies) | Jun 2027 | Sheinbaum midterm -- potential coalition shift |
| **Honduras** | Presidential + Legislative | Nov 2027 | Castro term-limited; MAS vs Libre party dynamics |
| **Argentina** | Midterm legislative | Oct 2027 | Milei midterm referendum -- critical for reform agenda |

### 2028

| Country | Election Type | Expected Date | Notes |
|---|---|---|---|
| **Paraguay** | Presidential + Legislative | Apr 2028 | Pena ineligible for reelection |
| **El Salvador** | Presidential + Legislative | Feb 2028 | Bukele eligible under new rules; opposition fragmented |
| **Panama** | Presidential + Legislative | May 2028 | Mulino term-limited (single term) |
| **Dominican Republic** | Presidential + Legislative | May 2028 | Abinader -- term-limited after 2nd term |
| **Guatemala** | Presidential + Legislative | Jun 2028 | Arevalo ineligible; anti-corruption agenda at risk |

### 2029

| Country | Election Type | Expected Date | Notes |
|---|---|---|---|
| **Ecuador** | Presidential + Legislative | Feb 2029 | Noboa eligible for reelection |
| **Uruguay** | Presidential + Legislative | Oct 2029 | Orsi can run for 2nd non-consecutive term |
| **Chile** | Presidential + Legislative | Nov 2029 | Kast term-limited (single consecutive term) |

### 2030

| Country | Election Type | Expected Date | Notes |
|---|---|---|---|
| **Bolivia** | Presidential + Legislative | Oct 2030 | Arce/MAS dynamics; potential Morales return |
| **Brazil** | Midterm subnational | Oct 2030 | Municipal elections -- mayor and city council |
| **Colombia** | Subnational | Oct 2030 | Governors and mayors |

---

## 2.2 Historical Post-Election Policy Shift Patterns

| Pattern | Historical Examples | SMB Impact |
|---|---|---|
| **Tax regime overhaul** | Colombia 2022 (Petro tax reform within 6 months), Argentina 2023 (Milei emergency decree) | Immediate cost structure changes -- invoice systems, withholding rates |
| **Labor law expansion** | Mexico 2018 (AMLO vacation reform, outsourcing ban), Chile 2022 (40-hour workweek) | Payroll recalculation, compliance deadlines |
| **Currency controls** | Argentina (every cycle), Venezuela 2013+ | Payment processing disruption, forex risk |
| **Trade policy reversal** | Mexico 2018 (airport cancellation), Ecuador 2023 (FTA negotiations) | Supply chain repricing, tariff changes |
| **Regulatory freeze** | Peru 2021-2023 (Castillo instability), Bolivia 2019 (post-Morales) | Permit delays, contract uncertainty |
| **Digital regulation push** | Brazil 2023 (AI regulation bill), Mexico 2024 (fintech enforcement) | Platform compliance requirements |

**Kitz recommendation engine rule:** Flag any country entering an election window (6 months before election date) as "ELEVATED REGULATORY UNCERTAINTY" and advise SMBs to:
1. Lock in contracts before election
2. Defer non-essential capital expenditures
3. Review tax and labor compliance for both possible outcomes
4. Ensure payment systems can handle potential currency policy changes

---

# 3. Tax Reform Pipeline

> Tax reform is the most frequent and impactful form of regulatory change for LatAm SMBs.
> Unlike developed markets where tax changes are incremental, LatAm governments routinely
> pass sweeping reforms that restructure rates, regimes, and compliance obligations within
> months.

---

## 3.1 Active and Pending Tax Reforms (2025--2026)

### Brazil -- CBS/IBS Indirect Tax Reform (Constitutional Amendment 132/2023)

**Status:** Enacted, implementation in progress (2026--2033 transition)
**What changed:**
- Replaces 5 indirect taxes (PIS, COFINS, IPI, ICMS, ISS) with 2 value-added taxes:
  - **CBS** (Contribuicao sobre Bens e Servicos) -- federal, replacing PIS/COFINS/IPI
  - **IBS** (Imposto sobre Bens e Servicos) -- subnational, replacing ICMS/ISS
- Combined standard rate estimated at 26.5--28% (one of the highest VAT rates globally)
- Destination-based taxation (collected where goods/services are consumed, not produced)
- Full input credit system (eliminates cascading taxes)

**Timeline:**
- 2026: Testing period begins; CBS at 0.9%, IBS at 0.1% (creditable against current taxes)
- 2027: CBS replaces PIS/COFINS at reduced rate; IBS coexists with ICMS/ISS
- 2029--2032: Gradual phase-out of ICMS/ISS with proportional IBS increase
- 2033: Full implementation of new system

**SMB impact:**
- Massive invoice system overhaul required -- dual tax codes during transition
- Simples Nacional (simplified SMB regime) remains but with adjustments
- Input credit recovery becomes possible for first time for many SMBs
- Geographic arbitrage eliminated -- businesses cannot locate in low-tax states to save

**Kitz action:** Invoice system must support dual tax regimes during 2026--2032 transition period.

### Colombia -- Failed Tax Reform 2.0 (2025)

**Status:** Proposed by Petro administration, rejected by Congress in late 2025
**What was proposed:**
- Corporate income tax surcharge for mining and energy companies
- Expanded wealth tax with lower thresholds
- New taxes on sugar-sweetened beverages and ultra-processed foods
- Higher withholding rates on services payments
- Digital services tax on foreign platforms

**Current status:** Corporate tax rate remains at 35% (one of the highest in LatAm). Potential for new reform attempt under next president (election May 2026).

**SMB impact:** Stability for now, but election outcome will determine 2027+ trajectory.

### Mexico -- 2026 Fiscal Miscellany (Ley de Ingresos 2026)

**Status:** Enacted December 2025
**Key changes:**
- No new taxes or rate increases (continuing Sheinbaum's "no tax reform" pledge)
- Strengthened anti-avoidance rules and transfer pricing scrutiny
- Expanded electronic audit powers for SAT (tax authority)
- New beneficial ownership reporting requirements
- Tighter rules for RESICO (simplified SMB regime) eligibility
- Increased penalties for CFDI (electronic invoice) non-compliance

**SMB impact:** No rate changes but significantly higher enforcement risk. SAT's AI-powered audit capabilities expanding rapidly.

### Chile -- Tax Compliance Program (Cumplimiento Tributario)

**Status:** Enacted 2024, implementation ongoing through 2026
**Key changes:**
- New anti-evasion measures targeting underreporting
- Enhanced digital reporting requirements
- Expanded SII (tax authority) data-matching capabilities
- Simplified voluntary disclosure program for past non-compliance
- No significant rate changes (corporate rate remains at 27%)

**SMB impact:** Higher audit risk but stable rates. Good opportunity for SMBs to regularize past issues.

### Argentina -- Milei's Tax Simplification Agenda

**Status:** Ongoing through decree and congressional negotiation
**Key changes enacted or proposed:**
- Elimination of export taxes (retenciones) on most agricultural products -- partially implemented
- Reduction of Ingresos Brutos (provincial turnover tax) through fiscal pacts with provinces
- Simplification of Monotributo (simplified SMB regime) categories
- Personal income tax reform to raise exempt threshold
- Potential elimination of check tax (impuesto al cheque/debitos y creditos)

**SMB impact:** Significant cost reduction if fully implemented. Monotributo simplification directly benefits micro-enterprises.

### Peru -- Mining Royalty and VAT Reforms

**Status:** Pending; subject to 2026 election outcome
**Proposed:**
- Increased mining royalties (opposed by mining chambers)
- IGV (VAT) rate reduction from 18% to 16% (popular but fiscally challenging)
- Simplified RUS (simplified regime) expansion
- New digital services tax proposal

**SMB impact:** Uncertain until new government is installed (Jul 2026).

---

## 3.2 Corporate Tax Rate Comparison (2026)

| Country | Standard Corporate Rate | SMB Simplified Regime | Regime Name | Revenue Threshold |
|---|---|---|---|---|
| Brazil | 34% (IRPJ 15% + CSLL 9% + surcharge 10%) | 4--19% (effective) | Simples Nacional | BRL 4.8M/year (~$830K) |
| Mexico | 30% | 1--2.5% (on revenue) | RESICO | MXN 3.5M/year (~$195K) |
| Colombia | 35% | Exempt or 1.2%+ | Regimen Simple (RST) | Up to 100,000 UVT (~$1.1M) |
| Argentina | 25--35% (graduated) | 0--5% (on revenue) | Monotributo | ARS variable (updated quarterly) |
| Chile | 27% | 0.25--1% (on revenue) | Regimen ProPyme | UF 75,000 (~$2.7M) |
| Peru | 29.5% | Various | RUS / RER / Mype | Up to S/1.7M (~$450K) |
| Panama | 25% | Varies | SEM (micro-enterprise) | $150K/year |
| Costa Rica | 30% | 5--20% (graduated) | Simplified regime | CRC 112M (~$210K) |
| Ecuador | 25% | 1--2% (on revenue) | RIMPE | $300K/year |
| Uruguay | 25% (IRAE) | Monotributo | Monotributo | UI 305,000 (~$40K) |
| Dominican Republic | 27% | ISR simplified | ISR Simplificado | DOP 8.7M (~$145K) |
| Paraguay | 10% | 10% of net | IRE Resimple | PYG 2B (~$260K) |
| Guatemala | 25% (on profits) or 5% (on revenue) | 5% on revenue | Optional simplified | No threshold |
| El Salvador | 25--30% | 0--25% (graduated) | Standard regime | No special SMB regime |
| Honduras | 25% | Various | Standard | L 600K threshold |

---

# 4. Labor Law Changes

> Labor regulation is the second-highest compliance burden for LatAm SMBs after tax. The
> region is experiencing a generational shift: remote work legislation, gig economy rules,
> and workweek reduction movements are fundamentally changing employer obligations.

---

## 4.1 Minimum Wage Trends (2024--2026)

| Country | 2024 (Local/mo) | 2025 (Local/mo) | 2026 (Local/mo) | YoY Change | USD Approx (2026) |
|---|---|---|---|---|---|
| Mexico | MXN 7,468 | MXN 8,364 | MXN 9,451 | +13.0% | ~$520 |
| Colombia | COP 1,300,000 | COP 1,423,500 | COP 1,522,500 | +7.0% | ~$345 |
| Brazil | BRL 1,412 | BRL 1,518 | BRL 1,621 | +6.8% | ~$280 |
| Argentina | ARS 202,800 | ARS 313,400 | ARS ~420,000 | ~34% | ~$340 |
| Chile | CLP 500,000 | CLP 500,000 | CLP 535,000 | +7.0% | ~$548 |
| Peru | PEN 1,025 | PEN 1,130 | PEN 1,130 | 0% | ~$305 |
| Costa Rica | CRC 352,000 | CRC 367,108 | CRC 386,000 | +5.1% | ~$720 |
| Panama | USD 326--971 | USD 326--971 | USD 326--971 | 0% | $326--971 |
| Ecuador | USD 460 | USD 470 | USD 482 | +2.6% | $482 |
| Dominican Rep. | DOP 12,900--21,000 | DOP 15,860--27,989 | DOP 19,832--34,986 | +25% | ~$315--555 |
| Paraguay | PYG 2,680,373 | PYG 2,798,309 | PYG 2,920,000 | +4.3% | ~$375 |
| Uruguay | UYU 22,268 | UYU 23,604 | UYU 25,000 | +5.9% | ~$570 |
| Guatemala | GTQ 3,268 | GTQ 3,398 | GTQ 3,530 | +3.9% | ~$450 |
| El Salvador | USD 365 | USD 365 | USD 365 | 0% | $365 |
| Honduras | HNL 9,798--12,357 | HNL 10,278--12,975 | HNL 10,792--13,624 | +5% | ~$425--540 |
| Bolivia | BOB 2,362 | BOB 2,500 | BOB 2,600 | +4.0% | ~$375 |

> **Key trend:** Mexico's aggressive minimum wage increases (cumulative 110%+ since 2019) are
> the most impactful in the region. Combined with the pending 40-hour workweek reduction, Mexican
> SMBs face the steepest labor cost escalation in LatAm.

---

## 4.2 Remote Work Legislation Status

| Country | Law/Regulation | Key Requirements | Employer Obligations |
|---|---|---|---|
| **Mexico** | NOM-037-STPS-2023 | Written agreement, right to disconnect, OSH verification | Provide equipment, pay proportional electricity/internet, annual OSH inspection |
| **Colombia** | Ley 2121/2021 (Trabajo Remoto) + Ley 2088/2021 (Teletrabajo) + Ley 1221/2008 | Three distinct legal frameworks: teletrabajo, trabajo remoto, trabajo en casa | Varies by modality -- teletrabajo requires ARL enrollment, equipment, connectivity subsidy |
| **Brazil** | CLT Art. 75-A to 75-F (Lei 14.442/2022) | Written addendum, expense reimbursement, right to disconnect | Provide or reimburse equipment, respect work hours, not reduce in-person benefits |
| **Argentina** | Ley 27.555 (2020) | Right to disconnect, reversibility, voluntary basis | Provide equipment, reimburse connectivity/expenses, respect working hours |
| **Chile** | Ley 21.220 (2020) + Ley 21.561 (40-hour week) | Written agreement, equipment provision, disconnect rights | Tools and equipment, OSH compliance in home workspace, proportional costs |
| **Peru** | Ley 31572 (2022) | Written agreement, right to disconnect, digital OSH | Provide or compensate equipment and services, respect work hours |
| **Costa Rica** | Ley 9738 (2019) | Voluntary, written agreement, reversible | Provide equipment or compensate, OSH standards apply |
| **Panama** | Ley 126/2020 (COVID-era) + evolving | Not yet permanent comprehensive framework | Employer provides equipment; disconnect rights under discussion |
| **Ecuador** | Ministerial Agreement MDT-2020-076 | Written annexation to contract | Equipment, connectivity, OSH obligations extend to home |
| **Uruguay** | Ley 19.978 (2021) | Written agreement, right to disconnect, voluntary | Equipment and cost compensation, OSH, disconnect enforcement |

---

## 4.3 Gig Economy Regulation Status

| Country | Status | Key Developments |
|---|---|---|
| **Mexico** | Regulation pending | Platform companies face reclassification risk; IMSS (social security) studying mandatory coverage for gig workers; Uber/Rappi negotiations ongoing |
| **Colombia** | Active regulation | Decree 555/2024 requires platforms to ensure ARL (occupational risk) coverage; gig workers get partial social security access |
| **Brazil** | Landmark regulation enacted | PL 12/2024 signed into law; requires platforms to contribute to INSS (social security); minimum hourly guarantees; does not create employment relationship |
| **Chile** | Ley 21.431 (2022) in effect | Platform companies must provide accident insurance, minimum income guarantees; workers remain independent but with protections |
| **Argentina** | No specific regulation | Gig workers treated as independent contractors; union pressure for regulation growing; Buenos Aires city attempted regulation in 2023 |
| **Peru** | Draft legislation pending | Multiple bills in Congress; gig workers currently outside labor protections |
| **Costa Rica** | No specific regulation | Gig economy growing rapidly but no dedicated framework |
| **Ecuador** | No specific regulation | Informal economy dominant (60%+); gig regulation low priority |

---

## 4.4 Workweek Reduction Movement

| Country | Current Legal Maximum | Proposed/Enacted Reduction | Timeline |
|---|---|---|---|
| **Mexico** | 48 hours/week | Bill to reduce to 40 hours by 2030 (2 hours/year starting 2027) | 2027--2030 gradual |
| **Chile** | 45 hours/week | Reduced to 40 hours (Ley 21.561) | Fully effective Apr 2028 |
| **Colombia** | 47 hours/week (reduced from 48 in Jul 2024) | Reducing to 42 hours by Jul 2026 (Ley 2101/2021) | 1 hour/year reduction |
| **Brazil** | 44 hours/week | 4-day workweek pilots growing; no legislation yet | No firm timeline |
| **Ecuador** | 40 hours/week | Already at 40 hours | N/A |
| **Peru** | 48 hours/week | Reduction proposed but not advanced | Stalled |
| **Argentina** | 48 hours/week | Milei opposes reduction; unlikely during current term | Not expected before 2028 |

---

# 5. Regulatory Environment

> The regulatory burden is one of the primary determinants of SMB survival rates in LatAm.
> Time spent on compliance is time not spent on revenue generation. Kitz's automation of
> regulatory tasks (invoicing, tax filing, labor compliance) directly addresses this pain point.

---

## 5.1 World Bank B-READY and Legacy Doing Business Indicators

The World Bank's Business Ready (B-READY) project replaced the discontinued Doing Business report in 2024. B-READY assesses regulatory framework, public services, and operational efficiency across 10 topics. Coverage is expanding to 180 economies by 2026.

### Regulatory Burden Composite Scores (Kitz-calculated)

| Country | Business Registration (days) | Construction Permits (days) | Property Registration (days) | Tax Compliance (hours/year) | Regulatory Quality (WGI percentile) | Kitz Burden Score |
|---|---|---|---|---|---|---|
| **Chile** | 4 | 150 | 28 | 291 | 82 | LOW |
| **Uruguay** | 7 | 180 | 45 | 163 | 70 | LOW |
| **Costa Rica** | 9 | 120 | 21 | 151 | 67 | LOW |
| **Panama** | 6 | 90 | 16 | 266 | 55 | MEDIUM |
| **Mexico** | 8 | 82 | 34 | 241 | 58 | MEDIUM |
| **Colombia** | 10 | 87 | 16 | 239 | 55 | MEDIUM |
| **Peru** | 26 | 138 | 6 | 260 | 52 | MEDIUM |
| **Dominican Republic** | 7 | 196 | 45 | 317 | 45 | MEDIUM-HIGH |
| **Brazil** | 17 | 290 | 31 | 1,501 | 42 | HIGH |
| **Argentina** | 12 | 341 | 52 | 312 | 18 | HIGH |
| **Ecuador** | 30 | 132 | 25 | 654 | 30 | HIGH |
| **Guatemala** | 15 | 170 | 23 | 256 | 35 | MEDIUM-HIGH |
| **Paraguay** | 35 | 90 | 46 | 378 | 32 | HIGH |
| **Honduras** | 13 | 96 | 22 | 224 | 28 | HIGH |
| **El Salvador** | 17 | 105 | 31 | 224 | 42 | MEDIUM |
| **Bolivia** | 50 | 213 | 90 | 1,025 | 12 | CRITICAL |
| **Venezuela** | 230+ | 500+ | 120+ | 2,000+ | 2 | CRITICAL |
| **Nicaragua** | 13 | 165 | 55 | 201 | 10 | CRITICAL |

> **Note on Brazil:** Brazil's 1,501 hours/year for tax compliance is the single highest figure in
> the world (global average is ~234 hours). This is precisely why Brazil's CBS/IBS reform is so
> significant -- it aims to cut this dramatically. However, the transition period (2026--2033) will
> temporarily increase complexity before reducing it.

---

## 5.2 Permit and License Timelines by Country

### Business Formation (Typical SMB -- retail or services)

| Country | Company Type | Steps | Total Time | Cost (% GNI per capita) | Online Available? |
|---|---|---|---|---|---|
| Chile | SPA (Sociedad por Acciones) | 1 (Empresa en un Dia) | 1 day | 0.5% | Yes -- full online |
| Panama | S.A. or SRL | 3--5 | 6--10 days | 3.5% | Partial |
| Mexico | SAS or S de RL | 3--5 | 8--12 days | 4.2% | Yes (SAS fully online) |
| Colombia | SAS | 2--3 | 10--14 days | 3.8% | Yes (via CAE) |
| Brazil | LTDA or MEI | 3--6 | 17--25 days | 2.1% | Partial (MEI online, LTDA mixed) |
| Peru | SAC or SRL | 5--7 | 26--35 days | 5.1% | Partial |
| Argentina | SAS or SRL | 4--7 | 12--20 days | 3.9% | Yes (SAS online in CABA) |
| Costa Rica | SRL | 3--5 | 9--14 days | 5.3% | Partial |
| Ecuador | SAS | 3--5 | 30--45 days | 5.8% | Partial |
| Uruguay | SAS | 2--3 | 7--10 days | 2.9% | Yes (via empresa.gub.uy) |
| Dom. Republic | SRL | 3--5 | 7--12 days | 4.1% | Partial |
| Paraguay | SRL | 5--7 | 35--45 days | 6.2% | Limited |

---

## 5.3 Sector-Specific Regulatory Complexity

| Sector | Highest Burden Countries | Key Regulatory Requirements | Kitz Automation Opportunity |
|---|---|---|---|
| **Food & Beverage** | Brazil, Colombia, Mexico | Sanitary permits (INVIMA, COFEPRIS, ANVISA), labeling rules, nutritional front-of-pack | Auto-generate permit renewal reminders, labeling compliance check |
| **Retail / E-commerce** | Brazil, Argentina, Mexico | Consumer protection (CDC, PROFECO), electronic invoice mandates, return policies | Invoice automation, consumer rights compliance templates |
| **Professional Services** | All countries | Professional licensing, anti-money laundering for accountants/lawyers, tax withholding | AML screening, withholding calculators |
| **Construction** | Brazil, Argentina, Colombia | Environmental permits, zoning, labor safety, social security for workers | Permit tracking, worker registration automation |
| **Transport / Logistics** | Mexico, Brazil, Colombia | Carta Porte (Mexico), CT-e (Brazil), fleet permits, driver certifications | Complemento Carta Porte generation, permit tracking |
| **Health & Wellness** | All countries | Health authority licenses, professional certifications, sanitary permits | License renewal tracking, compliance checklists |

---

# 6. Trade Policy

> Trade policy directly impacts SMBs that import inputs, export products, or operate in
> supply chains connected to international trade. The 2025--2026 period has been defined
> by US tariff escalation, nearshoring acceleration, and the USMCA 2026 review.

---

## 6.1 US Tariff Impact on LatAm (Post-February 2025)

Following the US tariff escalation beginning in February 2025, Latin American and Caribbean
countries face an average effective tariff rate of approximately 10% in the US market -- 7
percentage points lower than the global average, but still a significant increase from
pre-2025 levels.

| Country | Average Effective US Tariff | Key Affected Exports | USMCA/FTA Protected? | Nearshoring Benefit? |
|---|---|---|---|---|
| **Mexico** | ~8% (most USMCA-exempt) | Autos, electronics, agriculture | Yes (USMCA review Jul 2026) | HIGH -- largest beneficiary |
| **Brazil** | ~33% | Steel, aluminum, agriculture, aircraft | No FTA with US | LOW -- high tariff exposure |
| **Colombia** | ~12% | Coffee, oil, flowers, textiles | US-Colombia FTA (TPA) | MEDIUM |
| **Chile** | ~10% | Copper, lithium, wine, fruits | US-Chile FTA | MEDIUM |
| **Peru** | ~10% | Mining, agriculture, textiles | US-Peru TPA | MEDIUM |
| **Costa Rica** | ~8% | Medical devices, electronics, ag | DR-CAFTA | HIGH -- medical device nearshoring |
| **Dominican Republic** | ~8% | Textiles, cigars, medical devices | DR-CAFTA | MEDIUM-HIGH |
| **Panama** | ~10% | Services hub (limited goods) | US-Panama TPA | LOW (services-based) |
| **Argentina** | ~20% | Agriculture, lithium, wine | No FTA with US | LOW |
| **Uruguay** | ~20% | Beef, soybeans, dairy | No FTA with US | LOW |
| **Ecuador** | ~15% | Oil, shrimp, bananas, flowers | No FTA with US | LOW |
| **Paraguay** | ~15% | Soybeans, beef, electricity | No FTA with US | LOW |
| **Guatemala** | ~8% | Coffee, textiles, sugar | DR-CAFTA | MEDIUM |
| **El Salvador** | ~8% | Textiles, coffee | DR-CAFTA | MEDIUM |
| **Honduras** | ~8% | Textiles, coffee, palm oil | DR-CAFTA | MEDIUM-HIGH (textile nearshoring) |
| **Nicaragua** | ~18% | Agriculture, textiles | DR-CAFTA (partial suspension risk) | LOW (sanctions risk) |

---

## 6.2 USMCA 2026 Review -- Critical for Mexico-Linked SMBs

The United States-Mexico-Canada Agreement (USMCA) enters its mandatory joint review by
July 1, 2026. This is the single most consequential trade policy event for LatAm SMBs,
given Mexico's position as the US's largest trading partner.

**Key review issues:**
- **Automotive rules of origin:** Higher regional value content requirements likely; affects entire auto parts supply chain
- **Labor enforcement:** Chapter 23 Rapid Response Mechanism has been aggressively used; compliance audits expanding
- **Energy policy:** Mexico's energy sovereignty provisions vs. US investment access demands
- **Digital trade:** Data localization, cross-border data flows, source code protection
- **Agricultural market access:** US demands on biotech crop approvals, sanitary measures
- **Nearshoring rules:** Potential new provisions to encourage vs. restrict Chinese-origin investment in Mexico

**SMB impact:** Any disruption to USMCA would have cascading effects on:
- Cross-border e-commerce (de minimis thresholds at risk)
- Input costs for Mexican manufacturers
- Logistics and customs clearance times
- Financial services passporting

---

## 6.3 Regional Trade Agreements

| Agreement | Members | Status (2026) | SMB Relevance |
|---|---|---|---|
| **Pacific Alliance** | Mexico, Colombia, Chile, Peru | Active but politically strained (Colombia semi-withdrawn under Petro) | Tariff reductions, integrated stock exchange, visa facilitation |
| **MERCOSUR** | Brazil, Argentina, Uruguay, Paraguay (+Bolivia) | EU-MERCOSUR agreement ratified 2024, implementation pending | EU market access for agricultural exports |
| **DR-CAFTA** | US, DR, Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica | Active; Nicaragua compliance under review | Preferential US market access |
| **CPTPP** | Chile, Mexico, Peru + 8 others | Active; Costa Rica, Ecuador, Uruguay seeking accession | Asia-Pacific market access, digital trade rules |
| **Alianza del Pacifico** | Mexico, Colombia, Chile, Peru | Stalled under Petro; potential revival post-2026 Colombian election | Supply chain integration |

---

## 6.4 Local Content Requirements

| Country | Sectors with LCR | Requirement | Penalty |
|---|---|---|---|
| **Brazil** | Oil & gas, IT, defense, telecom | 30--65% local content (varies by sector) | Tax benefits denial, contract disqualification |
| **Mexico** | Energy (hydrocarbons), automotive | 75% regional value (USMCA autos), various energy LCRs | USMCA non-compliance, government contract exclusion |
| **Argentina** | Mining, oil & gas, telecom | "Compre Argentino" -- government procurement preference for local firms | Contract disqualification for non-local content |
| **Colombia** | Oil & gas, mining, government IT | Government procurement preferences for local firms; oil sector workforce LCRs | Procurement point deductions |
| **Ecuador** | Government procurement | "Compras Publicas" preference for Ecuadorian products/services | Bid disqualification |

---

# 7. FATF & Anti-Money Laundering

> AML compliance is non-negotiable for any financial platform operating in LatAm. Kitz
> processes payments, invoices, and financial data -- all of which carry AML obligations.
> The FATF grey list status of a country directly affects banking access, correspondent
> banking relationships, and cross-border payment processing.

---

## 7.1 FATF Status by Country (as of February 2026)

| Country | FATF Status | GAFILAT Member? | Last Mutual Evaluation | Key Deficiencies | Risk Level |
|---|---|---|---|---|---|
| **Bolivia** | GREY LIST (since Jun 2025) | Yes | 2024 | Beneficial ownership, STR effectiveness, financial intelligence | HIGH |
| **Venezuela** | GREY LIST (longstanding) | Suspended | 2019 | Systemic AML failures, sanctions nexus, corruption | CRITICAL |
| **Panama** | Clean (removed from grey list Oct 2023) | Yes | 2024 | Monitoring ongoing; beneficial ownership registry still maturing | MEDIUM |
| **Mexico** | Clean | Yes (GAFILAT founder) | 2023 | Cash-intensive economy, informal sector, cartel-related laundering | MEDIUM |
| **Brazil** | Clean | Yes | 2023 | Large informal economy, real estate laundering | MEDIUM |
| **Colombia** | Clean | Yes | 2022 | Drug trade proceeds, cash economy, gold laundering | MEDIUM |
| **Argentina** | Clean | Yes | 2023 | Capital controls create informal forex market; crypto laundering growing | MEDIUM |
| **Chile** | Clean | Yes | 2022 | Generally strong framework; free trade zones monitored | LOW |
| **Peru** | Clean | Yes | 2023 | Mining sector cash flows, informal economy | MEDIUM |
| **Costa Rica** | Clean | Yes | 2023 | Strong framework for country size; real estate sector monitored | LOW |
| **Uruguay** | Clean | Yes | 2023 | Free trade zones, beneficial ownership reforms ongoing | LOW |
| **Ecuador** | Clean | Yes | 2024 | Drug transit route; port sector risks; improving framework | MEDIUM-HIGH |
| **Paraguay** | Clean (but monitored) | Yes | 2022 | Triple border concerns, contraband, tobacco smuggling | MEDIUM-HIGH |
| **Dominican Republic** | Clean | Yes (CFATF) | 2023 | Growing financial center; real estate and free zone risks | MEDIUM |
| **Guatemala** | Clean | Yes (CFATF) | 2022 | Weak enforcement, corruption, drug transit | HIGH |
| **Honduras** | Clean | Yes (CFATF) | 2023 | Drug trafficking, weak institutions | HIGH |
| **El Salvador** | Clean | Yes (CFATF) | 2022 | Bitcoin adoption created novel AML challenges; FATF watching closely | MEDIUM-HIGH |
| **Nicaragua** | Clean (but limited cooperation) | Yes (CFATF) | 2017 | Sanctions regime limits cooperation; outdated evaluation | HIGH |

---

## 7.2 AML Compliance Requirements for Kitz

### Mandatory KYC (Know Your Customer) by Country

| Country | KYC Authority | Business KYC Requirements | Individual KYC | Threshold for Enhanced Due Diligence |
|---|---|---|---|---|
| **Mexico** | CNBV, UIF | RFC, acta constitutiva, legal rep ID, proof of address, beneficial owners | INE/IFE + CURP + proof of address | Transactions >$3,340 USD (cash); >$8,350 (wire) |
| **Brazil** | COAF, BCB | CNPJ, contrato social, legal rep CPF/RG, beneficial owners with 25%+ ownership | CPF + RG + proof of address | BRL 50,000+ single transaction; BRL 10,000+ cash |
| **Colombia** | UIAF, SFC | NIT, camara de comercio, legal rep cedula, beneficial owners >5% | Cedula + proof of address | COP 50M+ (~$11K) single; COP 150M+ cumulative/month |
| **Argentina** | UIF | CUIT, estatuto social, acta de directorio, beneficial owners >20% | DNI + CUIL + proof of address | ARS equivalent of $5K+ USD (cash); $30K+ (transfers) |
| **Chile** | UAF | RUT, escritura social, legal rep RUT/CI, beneficial owners >10% | RUT/CI + proof of address | UF 450+ (~$16K) |
| **Peru** | SBS, UIF-Peru | RUC, partida registral, legal rep DNI, beneficial owners >10% | DNI + RUC + proof of address | S/10,000+ single; S/30,000+ cumulative |
| **Panama** | UAF | RUC, pacto social, directores/dignatarios, beneficial owners (all) | Cedula or passport + utility bill + bank reference | $10,000+ (cash); $50,000+ (wire) |
| **Costa Rica** | ICD | Cedula juridica, personeria, beneficial owners (all per Ley 9416) | Cedula + proof of address | $10,000+ (all transactions) |

### STR (Suspicious Transaction Report) Requirements

| Country | Reporting Authority | Filing Deadline | Minimum Staff Training | Penalties for Non-Compliance |
|---|---|---|---|---|
| Mexico | UIF (Unidad de Inteligencia Financiera) | 24 hours for unusual; 24 hours for concerning | Annual AML training mandatory | Fines up to 100,000 UMA (~$1M); criminal prosecution |
| Brazil | COAF | 24 hours from detection | Semi-annual training | Fines up to BRL 20M; loss of operating license |
| Colombia | UIAF | Immediately upon detection | Annual certification | Fines up to 200 SMMLV (~$70K); criminal liability |
| Chile | UAF | Immediately | Annual compliance program | Fines up to UTA 5,000 (~$350K); criminal prosecution |
| Peru | UIF-Peru | 15 business days | Annual training program | Fines up to 200 UIT (~$1M); suspension |
| Panama | UAF | 5 business days | Annual (Ley 23/2015) | Fines $50K--$1M; loss of license; criminal prosecution |
| Argentina | UIF | 24 hours (terrorism); 30 days (laundering) | Annual training + exam | Fines 1--10x transaction value; criminal liability |
| Costa Rica | ICD | Immediately | Annual (Ley 8204) | Fines up to CRC 200M (~$370K); criminal prosecution |

---

## 7.3 Beneficial Ownership Registries

| Country | Registry | Status | Public Access? | Kitz Integration Need |
|---|---|---|---|---|
| **Brazil** | CNPJ (Receita Federal) | Operational | Partial (basic info public) | Auto-verify via Receita API |
| **Mexico** | RNBD (in development) | Being implemented (SAT) | No (authority access only) | Prepare for mandatory reporting |
| **Colombia** | RUB (Registro Unico de Beneficiarios) | Operational since 2023 | No (DIAN access) | Submit via DIAN portal |
| **Chile** | Registro de Beneficiarios (SII) | Operational since 2024 | No (authority access) | Submit with annual tax return |
| **Panama** | Sistema de Custodia (SBP) | Operational since 2022 (post-grey list) | No (authority access) | Resident agent files; Kitz assists data collection |
| **Costa Rica** | RTBF (Registro de Transparencia y Beneficiarios) | Operational since 2020 | Partial | Annual filing via BCR platform |
| **Argentina** | Registro de Beneficiarios (UIF/IGJ) | Operational | No | Report through AFIP/IGJ filings |
| **Peru** | Registro de Beneficiarios (SUNARP/UIF) | Partial implementation | No | Report with annual declarations |
| **Uruguay** | Registro de Beneficiarios (BCU) | Operational since 2017 | No | BCU reporting obligation |

---

# 8. Sanctions & Compliance

> Sanctions compliance is a hard legal requirement. Processing a payment to a sanctioned entity
> can result in criminal prosecution, massive fines, and loss of banking relationships. Kitz must
> screen every transaction counterparty against sanctions lists.

---

## 8.1 OFAC Sanctions -- LatAm Countries

### Venezuela (Evolving Regime -- Post-Maduro Transition)

**Current status (Feb 2026):** Rapidly evolving following the January 2026 departure of
Nicolas Maduro from power.

**Key General Licenses (Jan-Feb 2026):**
- **GL 46** (Jan 29, 2026): Authorizes established US companies to engage in broad business activities involving Venezuelan oil
- **GL 47** (Feb 3, 2026): Expanded energy sector activities
- **GL 48** (Feb 10, 2026): Further authorization -- excludes transactions with Russia, Iran, North Korea, Cuba, China entities
- **GL 49 & 50** (Feb 13, 2026): Additional carve-outs for specific sectors

**What remains prohibited:**
- Transactions with specifically designated nationals (SDN) on OFAC's SDN list
- Dealings with PDVSA entities except as authorized by specific GLs
- Payments to sanctioned individuals (must be deposited into US Treasury accounts per EO 14373)
- Any transactions involving Russia/Iran/North Korea/Cuba/China-linked parties to Venezuelan energy assets

**Kitz compliance requirement:** Screen all Venezuelan-origin or Venezuelan-destination transactions against SDN list. Flag any energy-sector transactions for enhanced review.

### Cuba (Comprehensive Embargo)

**Current status:** Most comprehensively sanctioned jurisdiction in the Western Hemisphere.

**Key restrictions:**
- Near-total embargo on US person transactions (31 CFR Part 515)
- Specific licenses required for most activities
- Remittance caps ($1,000/quarter to close family under current rules)
- No US bank correspondent banking
- Travel restrictions (12 categories of authorized travel)

**Kitz compliance requirement:** Block all Cuba-nexus transactions by default. No payment processing to/from Cuba without specific OFAC license verification.

### Nicaragua (Targeted Sanctions)

**Current status:** Targeted sanctions against Ortega regime officials and entities.

**Key restrictions:**
- EO 13851 (Nov 2018): Sanctions on government officials
- NICA Act: Requires US opposition to IFI loans to Nicaragua
- Individual SDN designations against senior officials
- No comprehensive trade embargo (civilian commerce generally permitted)

**Kitz compliance requirement:** Screen counterparties against SDN list. Flag government-connected entities for enhanced review.

---

## 8.2 EU Sanctions Affecting LatAm

| Target | EU Measures | Impact on LatAm Business |
|---|---|---|
| **Venezuela** | Arms embargo + individual sanctions on officials | European banks restrict Venezuela-related transactions |
| **Nicaragua** | Individual sanctions on officials | Limited commercial impact; EU aid reduced |
| **Haiti** | Individual sanctions on gang leaders | Minimal commercial impact |

---

## 8.3 SDN List Screening Requirements

The Specially Designated Nationals and Blocked Persons List (SDN List) is maintained by OFAC
and contains approximately 12,000+ entries. For LatAm operations, the highest-density areas are:

| Category | Approximate LatAm-Related Entries | Key Countries |
|---|---|---|
| Narcotics trafficking (SDNT) | ~3,500 | Colombia, Mexico, Venezuela, Peru, Bolivia |
| Venezuela sanctions (SDNTK/VENEZUELA) | ~400 | Venezuela |
| Transnational criminal organizations | ~800 | Mexico, Central America, Colombia |
| Cuba sanctions | ~200 | Cuba |
| Terrorism-related | ~150 | Colombia (FARC/ELN remnants), Paraguay (Tri-Border) |
| Corruption (Global Magnitsky) | ~200 | Guatemala, Honduras, El Salvador, Nicaragua |

**Screening frequency requirement:**
- At onboarding: Full name + alias + DOB + nationality against SDN + consolidated lists
- At every transaction: Counterparty name against SDN list
- Monthly: Full customer base re-screening against updated lists
- On list update: OFAC publishes updates approximately 2--4 times per month

---

## 8.4 Secondary Sanctions Risk

Secondary sanctions apply to non-US persons who engage in significant transactions with
sanctioned parties. For LatAm SMBs:

| Scenario | Risk Level | Example |
|---|---|---|
| Venezuelan government entity as customer | HIGH | Colombian SMB selling goods to Venezuelan state entity |
| Cuban supplier or buyer | HIGH | Panamanian trading company with Cuban connections |
| Russian-linked entity operating in LatAm | MEDIUM-HIGH | Brazilian company sourcing from Russian-owned subsidiary |
| Iranian-linked entity | MEDIUM | Free trade zone company with Iranian beneficial owner |

**Kitz compliance action:** Implement cascading sanctions screening -- not just the direct counterparty but beneficial owners, connected entities, and geographic nexus.

---

# 9. Expropriation & Property Rights

> While full-scale expropriation is rare in modern LatAm, regulatory taking, permit
> revocation, and contract modification by government act remain significant risks.
> Investment treaty protection provides recourse but is expensive and slow.

---

## 9.1 Historical Expropriation Events (2000--2026)

| Year | Country | Event | Sector | Outcome | Current Risk of Recurrence |
|---|---|---|---|---|---|
| 2007--2014 | **Venezuela** | Systematic nationalization of oil (PDVSA takeover of foreign JVs), cement, steel, telecommunications, banking, food processing | All sectors | ICSID arbitration awards >$10B total; largely uncollected | DECLINING (post-Maduro transition) |
| 2012 | **Argentina** | YPF nationalization (Repsol's 51% stake) | Oil & gas | $5B compensation agreed in 2014 via bonds | LOW (Milei pro-private sector) |
| 2008--2010 | **Bolivia** | Nationalization of telecom (ETI), oil & gas (YPFB), tin mines | Energy, telecom, mining | Partial compensation via bilateral negotiations | MEDIUM (Arce government) |
| 2006--2009 | **Ecuador** | Oil sector renegotiation (Oxy expropriation, windfall taxes) | Oil & gas | ICSID awards; $1.4B Occidental v Ecuador | LOW (Noboa market-friendly) |
| 2022 | **Mexico** | Lithium nationalization (creation of LitioMx) | Mining | Private concessions revoked by constitutional reform | MEDIUM (energy sector only) |
| 2019--2023 | **Mexico** | Energy sector: AMLO/Sheinbaum regulatory changes blocking private electricity | Energy | Ongoing arbitration under USMCA Ch. 14 | MEDIUM (limited to energy) |
| 2023 | **Peru** | Mining permit delays/revocations (political instability) | Mining | Regulatory taking claims emerging | MEDIUM (election uncertainty) |

---

## 9.2 Investment Treaty Protection for SMBs

| Country | BITs in Force | ICSID Member? | Key Treaty Partners | SMB Relevance |
|---|---|---|---|---|
| **Mexico** | 33 BITs + USMCA Ch. 14 | Yes | US, Canada, Spain, UK, Germany, Netherlands | HIGH (USMCA protections strongest) |
| **Brazil** | 0 traditional BITs (uses CFIA model) | Not an ICSID member | India, UAE, Ethiopia (CFIAs) | LOW (no investor-state arbitration) |
| **Colombia** | 16 BITs + FTA investment chapters | Yes | US, Spain, UK, Switzerland, France | MEDIUM |
| **Chile** | 52 BITs + FTA investment chapters | Yes | US, Spain, France, UK, Germany, Korea | HIGH (most extensive network) |
| **Argentina** | 55 BITs (some denounced) | Yes | US (denounced 2024 renegotiation), Spain, France, UK, Italy | MEDIUM (treaty coverage shrinking) |
| **Peru** | 32 BITs + FTA investment chapters | Yes | US, Spain, UK, Australia, China | MEDIUM |
| **Panama** | 25 BITs + FTA investment chapters | Yes | US, UK, Spain, France | MEDIUM |
| **Costa Rica** | 15 BITs + DR-CAFTA | Yes | US (DR-CAFTA), Spain, Germany | MEDIUM |
| **Ecuador** | 17 BITs (several denounced under Correa, some restored) | Yes (rejoined 2021) | US, Spain, China, UK | MEDIUM (improving) |
| **Bolivia** | 18 BITs (denounced ICSID in 2007, some restored) | Rejoined 2023 | Spain, UK, Netherlands, Germany | MEDIUM (improving) |
| **Uruguay** | 31 BITs | Yes | US, Spain, France, UK, Finland | MEDIUM |

---

## 9.3 Contract Enforceability

| Country | Contract Enforcement Time (days, World Bank legacy) | Contract Enforcement Cost (% of claim) | Quality of Judicial Process Index (0--18) | Kitz Assessment |
|---|---|---|---|---|
| **Mexico** | 341 | 33.0% | 11.5 | MEDIUM -- slow but improving with online courts |
| **Brazil** | 731 | 22.0% | 13.5 | POOR -- extremely slow; arbitration preferred |
| **Colombia** | 1,288 | 45.8% | 8.0 | POOR -- longest in LatAm; ADR essential |
| **Chile** | 480 | 28.6% | 11.5 | FAIR -- improving with judicial modernization |
| **Argentina** | 590 | 29.0% | 10.5 | FAIR -- Buenos Aires courts backlogged |
| **Peru** | 426 | 35.7% | 11.0 | FAIR -- improving |
| **Panama** | 686 | 50.0% | 7.0 | POOR -- high cost relative to claim value |
| **Costa Rica** | 852 | 24.3% | 9.5 | POOR -- slow but reasonable cost |
| **Ecuador** | 588 | 27.2% | 9.0 | FAIR -- arbitration centers growing |
| **Uruguay** | 725 | 20.0% | 12.0 | FAIR -- good process quality but slow |
| **Dominican Rep.** | 460 | 40.9% | 7.5 | MEDIUM -- improving with commercial courts |

**Kitz recommendation:** For any contract >$10K USD, recommend arbitration clauses (ICC, IACAC, or local chamber) rather than reliance on judicial enforcement.

---

# 10. Corruption & Transparency

> Corruption is the single largest hidden cost for LatAm SMBs. It manifests as bribery demands
> for permits, customs delays, tax audit "arrangements," and procurement exclusion. Kitz must
> help SMB owners navigate this environment legally while protecting them from compliance risk
> under FCPA, UK Bribery Act, and local anti-corruption laws.

---

## 10.1 Corruption Perceptions Index 2025 (Transparency International)

| Country | CPI Score (0--100) | Global Rank (/182) | Trend (5-year) | Kitz Risk Tier |
|---|---|---|---|---|
| **Uruguay** | 73 | 15 | Stable | LOW |
| **Chile** | 65 | 28 | Declining (-4) | LOW |
| **Costa Rica** | 54 | 48 | Declining (-3) | MEDIUM |
| **Argentina** | 38 | 85 | Volatile | MEDIUM-HIGH |
| **Colombia** | 37 | 99 | Declining (-7 positions from 2024) | MEDIUM-HIGH |
| **Brazil** | 35 | 106 | Declining (-3) | HIGH |
| **Panama** | 36 | 102 | Stable | MEDIUM-HIGH |
| **Peru** | 33 | 115 | Declining | HIGH |
| **Ecuador** | 28 | 132 | Declining sharply | HIGH |
| **Mexico** | 27 | 138 | Declining | HIGH |
| **Dominican Republic** | 37 | 95 | Improving (+3) | MEDIUM-HIGH |
| **El Salvador** | 32 | 118 | Declining | HIGH |
| **Paraguay** | 28 | 130 | Stable-low | HIGH |
| **Bolivia** | 27 | 136 | Declining | HIGH |
| **Guatemala** | 24 | 148 | Declining | CRITICAL |
| **Honduras** | 22 | 155 | Declining | CRITICAL |
| **Nicaragua** | 14 | 173 | Declining | CRITICAL |
| **Venezuela** | 10 | 180 | Bottom 3 globally | CRITICAL |
| **Haiti** | 16 | 170 | Bottom 15 globally | CRITICAL |

> **Regional average:** 42/100 (no improvement since 2012). 12 of 33 Americas countries
> have significantly worsened. Only Dominican Republic and Guyana have significantly improved.

---

## 10.2 Common Corruption Scenarios for SMBs

| Scenario | Countries Most Affected | Typical Cost | Legal Risk |
|---|---|---|---|
| **Permit "facilitation fees"** | Mexico, Guatemala, Honduras, Paraguay, Ecuador | 5--15% of permit value | FCPA violation if US nexus; local bribery laws |
| **Customs clearance bribes** | Mexico, Colombia, Ecuador, Paraguay, Bolivia | $50--$500 per shipment | Criminal prosecution; goods seizure |
| **Tax audit "arrangements"** | Argentina, Mexico, Peru, Ecuador, Colombia | 10--30% of disputed amount | Criminal tax fraud; FCPA secondary violation |
| **Government procurement kickbacks** | All countries (worst: Guatemala, Honduras, Paraguay) | 10--25% of contract value | Criminal prosecution; contract voidance |
| **Utility connection "expediting"** | Bolivia, Paraguay, Honduras, Guatemala | $200--$2,000 per connection | Local anti-corruption laws |
| **Zoning/construction "approvals"** | Mexico, Colombia, Peru, Ecuador | 3--10% of project value | Criminal prosecution; project cancellation |
| **Police/regulatory "fines"** | Mexico, Argentina, Colombia, Ecuador | $20--$500 per incident | Extortion charges possible against payer |

---

## 10.3 Anti-Corruption Legal Framework

### FCPA (Foreign Corrupt Practices Act -- US)

**Applicability to LatAm SMBs:** Any company that:
- Has securities listed in the US (ADRs, dual-listing)
- Uses US banking system (correspondent banking, USD wire transfers)
- Has a US person (citizen, resident, entity) as agent, employee, or beneficial owner
- Uses US interstate commerce (email through US servers, etc.)

**Penalties:** Up to $250K per individual violation + 5 years imprisonment; $2M per entity violation; disgorgement of profits.

### UK Bribery Act

**Applicability:** Any company with UK nexus (even minimal commercial presence). "Failure to prevent bribery" is a strict liability offense unless company can demonstrate "adequate procedures."

**Key difference from FCPA:** Covers commercial (private-to-private) bribery, not just government officials.

### Local Anti-Corruption Laws

| Country | Key Law | Key Features | Enforcement Effectiveness |
|---|---|---|---|
| **Brazil** | Lei Anticorrupcao 12.846/2013 | Strict corporate liability; leniency agreements; CEP (Clean Company Register) | HIGH (Lava Jato legacy; Car Wash operatives) |
| **Mexico** | Ley General del Sistema Nacional Anticorrupcion (2016) | National Anti-Corruption System; declaration of interests; Fiscalia Anticorrupcion | MEDIUM (political interference concerns) |
| **Colombia** | Estatuto Anticorrupcion (Ley 1474/2011) | Anti-corruption statute; corporate liability; debarment | MEDIUM (improving) |
| **Chile** | Ley 20.393 (2009, reformed 2024) | Corporate criminal liability; compliance programs as defense | HIGH (strongest enforcement in LatAm) |
| **Peru** | Ley 30424 (2016, modified 2018) | Corporate criminal liability; compliance models as defense | MEDIUM (Odebrecht cases driving enforcement) |
| **Argentina** | Ley 27.401 (2017) | Corporate liability for transnational bribery; compliance programs as defense | MEDIUM (early enforcement stage) |
| **Panama** | Codigo Penal + Ley 2/2017 | Limited corporate liability; individual criminal focus | LOW-MEDIUM |
| **Costa Rica** | Ley contra la Corrupcion y el Enriquecimiento Ilicito (2004) | Individual liability; whistleblower protections; conflict of interest rules | MEDIUM |

---

## 10.4 Whistleblower Protections

| Country | Whistleblower Law? | Anonymous Reporting? | Retaliation Protection? | Reward/Incentive? |
|---|---|---|---|---|
| **Brazil** | Yes (various) | Yes | Yes (CLT protection) | No formal reward program |
| **Mexico** | Partial (Sistema Nacional Anticorrupcion) | Yes | Limited (varies by state) | No |
| **Colombia** | Yes (Ley 1474/2011) | Yes | Yes (job protection) | No formal program |
| **Chile** | Yes (Ley 20.205/2007) | Yes | Yes (job protection + anti-retaliation) | No |
| **Peru** | Yes (Ley 29542/2010) | Yes | Yes (job protection) | No |
| **Argentina** | Yes (Ley 27.401 framework) | Yes | Partial | No |
| **Costa Rica** | Yes (Ley 8422/2004) | Yes | Yes | No |
| **Panama** | Limited | Yes | Limited | No |

---

# 11. Digital Regulation

> Digital regulation is the fastest-changing area of LatAm law. Between AI governance,
> cryptocurrency frameworks, fintech licensing, data localization, and platform liability,
> Kitz must track an accelerating pipeline of new rules. As an AI-powered SaaS platform,
> Kitz itself is directly subject to many of these regulations.

---

## 11.1 AI Regulation Status by Country

| Country | AI Legislation Status | Key Bill/Law | Risk-Based Approach? | Effective Date | Kitz Impact |
|---|---|---|---|---|---|
| **Brazil** | Advanced -- Bill in final stages | PL 2338/2023 (AI Framework) | Yes (EU AI Act-inspired tiers) | Expected 2026 | HIGH -- must classify Kitz AI tools by risk tier |
| **Mexico** | Draft stage | Multiple proposals in Congress | TBD | Not before 2027 | LOW (for now) |
| **Colombia** | Framework guidelines | CONPES 3975 (2019) + SIC guidelines | Soft law approach | Ongoing | MEDIUM -- ethical AI principles apply |
| **Chile** | National AI Policy | Politica Nacional de IA 2.0 (2024) | Principles-based | Ongoing | MEDIUM -- transparency and explainability required |
| **Peru** | Early draft | Proyecto de Ley de IA (2024) | TBD | Not before 2027 | LOW |
| **Argentina** | National AI Plan | Plan Nacional de IA (2024) | Principles-based | Ongoing | LOW-MEDIUM |
| **Costa Rica** | National strategy | Estrategia Nacional de IA (2024) | Principles-based | Ongoing | LOW |
| **Panama** | No dedicated framework | General data protection applies | N/A | N/A | LOW |
| **Uruguay** | AI governance framework | Estrategia Nacional de IA (2024) | Principles-based | Ongoing | LOW |
| **Ecuador** | No framework | N/A | N/A | N/A | LOW |

### Brazil PL 2338/2023 -- What Kitz Must Prepare For

**High-risk AI categories (requiring impact assessments and registration):**
- Automated decision-making affecting access to credit or financial services
- Automated hiring/recruitment tools
- Facial recognition and biometric identification
- Healthcare diagnostic tools
- AI in education (grading, admissions)

**Kitz exposure:** Kitz's AI-powered features (invoice analysis, payment recommendations, customer scoring, financial insights) may fall under "automated decision-making affecting access to financial services." Preparation needed:
1. Algorithmic impact assessments for credit-adjacent features
2. Explainability documentation for AI recommendations
3. Human-in-the-loop mechanisms for high-stakes decisions
4. Data governance policies aligned with LGPD + AI law
5. Regular bias audits

---

## 11.2 Cryptocurrency and Digital Asset Regulation

| Country | Legal Status | Regulatory Framework | Exchange Licensing | Stablecoin Rules | Bitcoin as Legal Tender? |
|---|---|---|---|---|---|
| **El Salvador** | Legal tender (since 2021) | Bitcoin Law (Ley Bitcoin) | Licensed under BCR | In development | YES (first and only in LatAm) |
| **Brazil** | Legal (regulated asset) | Lei 14.478/2022 + BCB regulations | BCB licensing (2025-2026 phased) | Under BCB framework | No |
| **Mexico** | Legal (regulated) | Ley Fintech (2018) + CNBV rules | CNBV authorization required | Prohibited by Banxico for payments | No |
| **Argentina** | Legal (taxable asset) | CNV Resolution 1058/2025 | CNV registration (Jul-Sep 2025 deadline) | Unregulated | No |
| **Colombia** | Legal (not legal tender) | SFC sandbox + draft VASP law | Sandbox approvals; full framework pending | Unregulated | No |
| **Chile** | Legal (regulated) | Ley Fintech 21.521 (2023) | CMF registration required | Under CMF framework | No |
| **Peru** | Legal (unregulated) | Draft VASP law in Congress | No licensing framework yet | Unregulated | No |
| **Panama** | Legal (Ley 129/2024 draft) | Ley 129 recognizes BTC, ETH, stablecoins as payment methods | SBP/SMV licensing under development | Recognized for payments | No (but recognized for payments) |
| **Uruguay** | Legal (advisory framework) | BCU guidance issued; legislation pending | No formal licensing | Unregulated | No |
| **Costa Rica** | Legal (unregulated) | No dedicated framework | No licensing | Unregulated | No |
| **Ecuador** | Restricted | BCB prohibits crypto for payments; trading permitted | No framework | Prohibited for payments | No |
| **Bolivia** | Restricted (recently eased) | BCB lifted ban in 2024; framework developing | No licensing | Prohibited | No |
| **Dominican Rep.** | Legal (cautionary stance) | BCRD advisories; no legislation | No framework | Unregulated | No |

---

## 11.3 Fintech Sandbox Status

| Country | Sandbox Operator | Status | Sectors Covered | Notable Participants |
|---|---|---|---|---|
| **Mexico** | CNBV | Operational (since 2018) | Payments, lending, crowdfunding, crypto | 0 formal approvals issued (process bottleneck) |
| **Brazil** | BCB + ANPD | Operational; AI/Data Protection pilot sandbox (2025-2026) | Open banking, payments, AI, data protection | Multiple fintechs participating |
| **Colombia** | SFC (Superintendencia Financiera) | Operational (since 2020) | Payments, lending, crypto, InsurTech | 200+ sandbox applications; expanding to crypto |
| **Chile** | CMF | Operational (Ley Fintech 2023) | Payments, lending, crowdfunding, crypto | First cohort launched 2024 |
| **Peru** | SBS | Early stage (Ley Fintech 2023) | Payments, lending | Regulations being drafted |
| **Argentina** | BCRA/CNV | Informal (no formal sandbox) | Open banking experiments | BCRA "Transferencias 3.0" initiative |
| **Dominican Rep.** | SIB | Launched 2023 | Payments, lending | Early cohorts |

---

## 11.4 Data Localization Requirements

| Country | Data Localization Rule | Scope | Cross-Border Transfer Allowed? | Kitz Infrastructure Impact |
|---|---|---|---|---|
| **Brazil** | No hard localization (LGPD Art. 33) | All personal data | Yes, with adequacy decision, SCCs, or consent | Kitz can serve from US/cloud with proper DPA |
| **Mexico** | No hard localization (LFPDPPP) | Personal data | Yes, with consent or adequate protections | Kitz can serve from US/cloud with proper notice |
| **Colombia** | No hard localization (Ley 1581) | Personal data | Yes, with SIC authorization or adequate country | Kitz can serve from US/cloud; SIC registration needed |
| **Argentina** | Transfer restriction (Ley 25.326) | Personal data | Only to countries with "adequate" protection (EU recognized) | US NOT on adequate list; need contractual clauses |
| **Chile** | Ley 21.719 (effective Dec 2026) | Personal data | Adequacy decision or safeguards required | Prepare for Dec 2026 compliance |
| **Ecuador** | LOPDP (2021) | Personal data | With consent or contractual safeguards | Standard contractual clauses recommended |
| **Panama** | Ley 81/2019 | Personal data | Generally permitted with notice | Minimal restriction |
| **Costa Rica** | Ley 8968 | Personal data | With adequate protections | Standard contractual clauses |
| **Peru** | Ley 29733 | Personal data | Adequate country or consent | Standard contractual clauses |
| **Uruguay** | Ley 18.331 (EU adequate) | Personal data | Adequacy recognized by EU; liberal framework | Minimal restriction |

---

# 12. Security & Crime Risk

> Crime and security costs are a significant and often underestimated component of SMB
> operating expenses in LatAm. Extortion, theft, cybercrime, and violence directly impact
> business viability, insurance costs, and talent retention.

---

## 12.1 Homicide Rates and Crime Index (2024-2025)

The regional average homicide rate is 20.2 per 100,000 inhabitants, nearly four times the
global average. 50% of all homicides in the Americas are connected to organized crime.

| Country | Homicide Rate (per 100K) | Crime Index (Numbeo) | Trend (5-year) | Primary Threat Type | Kitz Security Tier |
|---|---|---|---|---|---|
| **El Salvador** | 2.4 | 38 | Sharply declining (Bukele crackdown) | Residual gang activity | MEDIUM (improving rapidly) |
| **Chile** | 5.6 | 55 | Rising (+139% over decade) | Organized crime infiltration | MEDIUM (worsening) |
| **Uruguay** | 10.2 | 48 | Stable | Drug trafficking-related | MEDIUM |
| **Costa Rica** | 14.8 | 52 | Rising | Drug trafficking routes | MEDIUM-HIGH |
| **Argentina** | 5.3 | 62 | Stable | Property crime, economic crime | MEDIUM |
| **Panama** | 9.5 | 50 | Declining | Drug transit, Darien corridor | MEDIUM |
| **Dominican Republic** | 10.8 | 58 | Declining | Drug trafficking, domestic violence | MEDIUM-HIGH |
| **Paraguay** | 7.8 | 55 | Stable | Smuggling, organized crime | MEDIUM |
| **Peru** | 8.2 | 58 | Rising (+35.9%) | Illegal mining, extortion | MEDIUM-HIGH |
| **Brazil** | 22.4 | 68 | Declining (long-term) | Organized crime (PCC, CV), urban violence | HIGH |
| **Mexico** | 25.1 | 72 | Stable-high | Cartel violence, extortion | HIGH |
| **Colombia** | 25.8 | 65 | Stable | Armed groups, drug trafficking | HIGH |
| **Guatemala** | 18.2 | 65 | Stable | Gang violence, drug transit | HIGH |
| **Honduras** | 35.6 | 75 | Declining from highs but still extreme | Gang violence, drug trafficking | CRITICAL |
| **Ecuador** | 38.8 | 78 | Sharply rising (+547% over decade) | Drug trafficking wars | CRITICAL |
| **Venezuela** | 26.1 | 84 | Declining from extreme highs | State violence, organized crime, economic desperation | CRITICAL |
| **Nicaragua** | 6.5 | 45 | Stable-low | Political repression more than crime | MEDIUM (unique risk profile) |

---

## 12.2 Business-Specific Crime Impact

### Extortion Patterns

| Country | Extortion Type | Affected Sectors | Typical Demand | Frequency |
|---|---|---|---|---|
| **Mexico** | "Cobro de piso" (protection racket) | Retail, restaurants, transport, construction | 2--10% of monthly revenue | Monthly |
| **Guatemala** | Bus/transport extortion; retail protection | Transport, small retail | $50--$500/month | Monthly/weekly |
| **Honduras** | "Impuesto de guerra" (war tax) | All visible businesses | 5--15% of revenue | Monthly |
| **El Salvador** | Declining post-crackdown | Historically all sectors | Historically $50--$1K/month | Rare (2025+) |
| **Ecuador** | Emerging extortion crisis | Mining, agriculture, urban retail | Variable; rapidly growing | Growing |
| **Colombia** | "Vacuna" (vaccination) | Rural businesses, mining, agriculture | 3--8% of revenue | Monthly |
| **Brazil** | "Pedido" in favela-adjacent areas | Small retail, construction | Variable | Varies by region |

### Cargo Theft

| Country | Theft Rate (per 10K shipments) | Hotspot Routes | Typical Value Lost | Insurance Premium Impact |
|---|---|---|---|---|
| **Mexico** | 25+ | Mexico City-Puebla, Veracruz corridor, northern border | $15K--$50K per incident | +15--30% premium |
| **Brazil** | 18 | SP ring road, RJ highways, northeastern routes | $10K--$40K per incident | +20--40% premium |
| **Colombia** | 12 | Buenaventura corridor, Bogota-Medellin | $5K--$25K per incident | +10--20% premium |
| **Guatemala** | 8 | Pacific coast highway, Guatemala City exits | $3K--$15K per incident | +10--15% premium |
| **Chile** | 4 | Northern mining routes (emerging) | $5K--$20K per incident | +5--10% premium |

---

## 12.3 Cybercrime and Digital Security

| Country | Cybercrime Sophistication | Primary Threats | Data Breach Notification Required? | CERT Capability |
|---|---|---|---|---|
| **Brazil** | HIGH | Banking trojans (Grandoreiro, Casbaneiro), ransomware, BEC | Yes (LGPD - ANPD notification) | Strong (CERT.br) |
| **Mexico** | HIGH | Phishing, ransomware, telecom fraud, ATM malware | Yes (LFPDPPP - proposed criminal sanctions) | Medium (CERT-MX) |
| **Colombia** | MEDIUM-HIGH | Phishing, BEC, ransomware, social engineering | Yes (SIC notification) | Medium (ColCERT) |
| **Argentina** | MEDIUM-HIGH | Phishing, credential theft, ransomware | Limited (evolving framework) | Medium (CERT.ar) |
| **Chile** | MEDIUM | Ransomware, phishing, insider threats | Yes (Ley 21.719 from Dec 2026) | Strong (CSIRT Chile) |
| **Peru** | MEDIUM | Phishing, social engineering, mobile malware | Limited | Developing (PeCERT) |
| **Costa Rica** | MEDIUM (post-Conti attack awareness) | Ransomware (2022 Conti attack on government), phishing | Yes (evolving) | Improving (CSIRT-CR) |
| **Panama** | LOW-MEDIUM | BEC, phishing, financial fraud | Limited (Ley 81) | Developing |

---

## 12.4 Security-Related Business Costs

| Country | Private Security Spending (% GDP) | Average Monthly Security Cost (Small Retail) | Insurance Premium Loading (vs. US baseline) | Total Security Tax on SMB |
|---|---|---|---|---|
| **Mexico** | 1.5% | $200--$600 (guard + cameras) | 2.5--4x | 5--12% of revenue |
| **Brazil** | 1.8% | $300--$800 (guard + alarm) | 2--3x | 4--10% of revenue |
| **Colombia** | 1.4% | $150--$500 (guard + alarm) | 2--3x | 3--8% of revenue |
| **Honduras** | 2.0% | $200--$400 (armed guard) | 3--5x | 8--15% of revenue |
| **Ecuador** | 1.6% | $200--$500 (guard + alarm) | 3--4x | 6--12% of revenue |
| **Guatemala** | 1.8% | $200--$400 (guard) | 3--4x | 7--12% of revenue |
| **Chile** | 0.8% | $100--$300 (alarm + cameras) | 1.5--2x | 2--5% of revenue |
| **Uruguay** | 0.6% | $80--$200 (alarm system) | 1.2--1.5x | 1--3% of revenue |
| **Costa Rica** | 0.9% | $120--$350 (guard + alarm) | 1.5--2.5x | 3--6% of revenue |
| **Panama** | 0.7% | $100--$250 (guard + cameras) | 1.3--2x | 2--4% of revenue |

> **Kitz insight:** Security costs represent a hidden 1--15% tax on SMB revenue. The combination
> of private security, insurance premiums, loss from theft/extortion, and employee turnover due
> to violence makes security the third-largest operating cost category after labor and rent in
> many LatAm markets. Kitz should factor this into profitability models and break-even analysis.

---

# 13. TypeScript Implementation

> This section provides production-ready TypeScript modules for political and regulatory risk
> assessment. These integrate with Kitz's existing tool architecture (`ToolSchema` pattern from
> `registry.ts`) and country configuration system (`countryConfigTools.ts`).

---

## 13.1 Core Types and Risk Data Model

```typescript
/**
 * Political & Regulatory Risk Engine -- Core Types
 *
 * Integrates with countryConfigTools.ts for country-level configuration
 * and advisorTools.ts for SMB-facing recommendations.
 */

// ── Risk Tier Enum ──

export enum RiskTier {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  MEDIUM_HIGH = 'MEDIUM_HIGH',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ── Country Code (ISO 3166-1 alpha-2) ──

export type LatAmCountryCode =
  | 'MX' | 'CO' | 'BR' | 'AR' | 'CL' | 'PE' | 'PA' | 'CR'
  | 'EC' | 'UY' | 'PY' | 'DO' | 'GT' | 'SV' | 'HN' | 'BO'
  | 'NI' | 'VE' | 'HT' | 'CU';

// ── Dimension Scores ──

export interface PoliticalRiskDimensions {
  politicalStability: number;     // 0-100 (WGI percentile)
  ruleOfLaw: number;              // 0-100 (WGI percentile)
  governmentEffectiveness: number; // 0-100 (WGI percentile)
  regulatoryQuality: number;      // 0-100 (WGI percentile)
  controlOfCorruption: number;    // 0-100 (CPI score)
  democracyIndex: number;         // 0-10 (EIU)
  amlCompliance: number;          // 0-100 (custom: FATF status weighted)
  sanctionsExposure: number;      // 0-100 (0 = no sanctions, 100 = comprehensive)
  securityEnvironment: number;    // 0-100 (inverted homicide + crime index)
  contractEnforceability: number; // 0-100 (inverted enforcement time + cost)
  digitalReadiness: number;       // 0-100 (regulation maturity + infrastructure)
  tradeOpenness: number;          // 0-100 (FTAs + tariff levels)
}

// ── Country Risk Profile ──

export interface CountryRiskProfile {
  countryCode: LatAmCountryCode;
  countryName: string;
  headOfState: string;
  politicalOrientation: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'authoritarian-left' | 'authoritarian-right' | 'libertarian-right';
  dimensions: PoliticalRiskDimensions;
  compositeScore: number;         // 0-100 weighted average
  riskTier: RiskTier;
  fatfStatus: 'clean' | 'grey_list' | 'black_list' | 'suspended';
  sanctionsRegime: 'none' | 'targeted' | 'sectoral' | 'comprehensive';
  nextPresidentialElection: ElectionEvent | null;
  nextLegislativeElection: ElectionEvent | null;
  electionWindowActive: boolean;  // true if within 6 months of election
  activeReforms: RegulatoryReform[];
  keyRisks: string[];
  lastUpdated: string;            // ISO 8601
}

// ── Election Event ──

export interface ElectionEvent {
  type: 'presidential' | 'legislative' | 'municipal' | 'subnational' | 'referendum';
  date: string;                   // ISO 8601 date
  runoffDate?: string;            // ISO 8601 date if applicable
  country: LatAmCountryCode;
  description: string;
  incumbentCanRun: boolean;
  policyShiftRisk: RiskTier;      // Likelihood of major policy change
  keyIssues: string[];
}

// ── Regulatory Reform ──

export interface RegulatoryReform {
  id: string;
  country: LatAmCountryCode;
  category: 'tax' | 'labor' | 'trade' | 'digital' | 'financial' | 'environmental' | 'anti_corruption';
  title: string;
  status: 'proposed' | 'in_committee' | 'approved' | 'enacted' | 'implementing' | 'effective';
  description: string;
  smbImpact: 'positive' | 'negative' | 'neutral' | 'mixed';
  impactScore: number;            // -10 to +10 (negative = harmful to SMBs)
  effectiveDate?: string;
  transitionDeadline?: string;
  kitzActionRequired: string[];
}

// ── Compliance Check Result ──

export interface ComplianceCheckResult {
  country: LatAmCountryCode;
  timestamp: string;
  sanctions: {
    cleared: boolean;
    matchedEntries: SanctionsMatch[];
    listsChecked: string[];
  };
  aml: {
    kycComplete: boolean;
    enhancedDueDiligenceRequired: boolean;
    strThreshold: { amount: number; currency: string };
    beneficialOwnershipFiled: boolean;
  };
  regulatory: {
    businessRegistered: boolean;
    taxCompliant: boolean;
    laborCompliant: boolean;
    dataProtectionCompliant: boolean;
    sectorPermits: PermitStatus[];
  };
  overallStatus: 'compliant' | 'action_required' | 'blocked';
  requiredActions: string[];
}

export interface SanctionsMatch {
  listName: string;
  matchedName: string;
  matchScore: number;             // 0-100 fuzzy match confidence
  sdnType: string;
  programs: string[];
}

export interface PermitStatus {
  permitType: string;
  status: 'valid' | 'expired' | 'pending' | 'not_required';
  expiryDate?: string;
  renewalDeadline?: string;
}
```

---

## 13.2 Country Risk Database

```typescript
/**
 * Country Risk Database -- Static data refreshed quarterly.
 *
 * Sources: World Bank WGI (2025), TI CPI (2025), EIU Democracy Index (2025),
 * FATF (Feb 2026), OFAC SDN List (Feb 2026), InSight Crime (2024-2025).
 */

const COUNTRY_RISK_DB: Record<LatAmCountryCode, Omit<CountryRiskProfile, 'electionWindowActive' | 'compositeScore' | 'riskTier'>> = {
  UY: {
    countryCode: 'UY',
    countryName: 'Uruguay',
    headOfState: 'Yamandu Orsi',
    politicalOrientation: 'center-left',
    dimensions: {
      politicalStability: 78,
      ruleOfLaw: 71,
      governmentEffectiveness: 68,
      regulatoryQuality: 70,
      controlOfCorruption: 73,
      democracyIndex: 8.61,
      amlCompliance: 82,
      sanctionsExposure: 0,
      securityEnvironment: 60,
      contractEnforceability: 55,
      digitalReadiness: 65,
      tradeOpenness: 55,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2029-10-26',
      runoffDate: '2029-11-30',
      country: 'UY',
      description: 'Uruguayan presidential election 2029',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.LOW,
      keyIssues: ['fiscal_policy', 'security', 'education'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2029-10-26',
      country: 'UY',
      description: 'Uruguayan legislative election 2029 (concurrent with presidential)',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.LOW,
      keyIssues: ['fiscal_policy', 'security'],
    },
    activeReforms: [],
    keyRisks: ['MERCOSUR dependency', 'Small domestic market', 'Regional contagion from Argentina/Brazil'],
    lastUpdated: '2026-02-25',
  },

  CL: {
    countryCode: 'CL',
    countryName: 'Chile',
    headOfState: 'Jose Antonio Kast',
    politicalOrientation: 'center-right',
    dimensions: {
      politicalStability: 55,
      ruleOfLaw: 80,
      governmentEffectiveness: 75,
      regulatoryQuality: 82,
      controlOfCorruption: 65,
      democracyIndex: 7.92,
      amlCompliance: 85,
      sanctionsExposure: 0,
      securityEnvironment: 58,
      contractEnforceability: 62,
      digitalReadiness: 72,
      tradeOpenness: 85,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2029-11-16',
      runoffDate: '2029-12-14',
      country: 'CL',
      description: 'Chilean presidential election 2029',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['security', 'mining_regulation', 'pension_reform', 'immigration'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2029-11-16',
      country: 'CL',
      description: 'Chilean congressional election 2029',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['security', 'tax_reform'],
    },
    activeReforms: [
      {
        id: 'CL-TAX-2024',
        country: 'CL',
        category: 'tax',
        title: 'Tax Compliance Program (Cumplimiento Tributario)',
        status: 'implementing',
        description: 'Enhanced anti-evasion measures, digital reporting, SII data-matching expansion',
        smbImpact: 'mixed',
        impactScore: -2,
        effectiveDate: '2024-09-01',
        transitionDeadline: '2026-12-31',
        kitzActionRequired: ['Update SII reporting formats', 'Enhanced audit trail for transactions'],
      },
      {
        id: 'CL-LABOR-2024',
        country: 'CL',
        category: 'labor',
        title: '40-Hour Workweek (Ley 21.561)',
        status: 'implementing',
        description: 'Gradual reduction from 45 to 40 hours per week',
        smbImpact: 'negative',
        impactScore: -4,
        effectiveDate: '2024-04-26',
        transitionDeadline: '2028-04-26',
        kitzActionRequired: ['Payroll calculator update for phased reduction', 'Overtime threshold adjustment'],
      },
    ],
    keyRisks: ['Rising crime rates', 'Lithium nationalization debate', 'Immigration pressures', 'Divided congress'],
    lastUpdated: '2026-02-25',
  },

  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    headOfState: 'Claudia Sheinbaum',
    politicalOrientation: 'left',
    dimensions: {
      politicalStability: 15,
      ruleOfLaw: 28,
      governmentEffectiveness: 42,
      regulatoryQuality: 58,
      controlOfCorruption: 27,
      democracyIndex: 5.69,
      amlCompliance: 62,
      sanctionsExposure: 5,
      securityEnvironment: 22,
      contractEnforceability: 55,
      digitalReadiness: 60,
      tradeOpenness: 75,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2030-06-07',
      country: 'MX',
      description: 'Mexican presidential election 2030',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.MEDIUM_HIGH,
      keyIssues: ['security', 'USMCA', 'energy_policy', 'nearshoring'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2027-06-06',
      country: 'MX',
      description: 'Mexican midterm elections 2027 (Chamber of Deputies)',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['MORENA supermajority', 'judicial_reform', 'security'],
    },
    activeReforms: [
      {
        id: 'MX-LABOR-2025',
        country: 'MX',
        category: 'labor',
        title: 'Workweek Reduction to 40 Hours',
        status: 'proposed',
        description: 'Bill to reduce from 48 to 40 hours per week by 2030 (2 hours/year from 2027)',
        smbImpact: 'negative',
        impactScore: -6,
        effectiveDate: '2027-01-01',
        transitionDeadline: '2030-01-01',
        kitzActionRequired: ['Payroll cost projections', 'Overtime recalculation engine', 'Shift scheduling update'],
      },
      {
        id: 'MX-TAX-2026',
        country: 'MX',
        category: 'tax',
        title: 'Ley de Ingresos 2026 -- Enhanced SAT Enforcement',
        status: 'effective',
        description: 'No new taxes but expanded electronic audit, beneficial ownership reporting, RESICO tightening',
        smbImpact: 'mixed',
        impactScore: -3,
        effectiveDate: '2026-01-01',
        kitzActionRequired: ['Beneficial ownership reporting module', 'RESICO eligibility checker update', 'CFDI compliance hardening'],
      },
      {
        id: 'MX-TRADE-2026',
        country: 'MX',
        category: 'trade',
        title: 'USMCA 2026 Joint Review',
        status: 'in_committee',
        description: 'Mandatory tripartite review of USMCA by July 1, 2026',
        smbImpact: 'mixed',
        impactScore: -2,
        effectiveDate: '2026-07-01',
        kitzActionRequired: ['Monitor review outcomes', 'Prepare tariff recalculation engine', 'Alert affected import/export SMBs'],
      },
    ],
    keyRisks: ['Cartel violence', 'USMCA review risk', 'Judicial reform impact', 'SAT audit escalation', 'Energy sector restrictions'],
    lastUpdated: '2026-02-25',
  },

  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    headOfState: 'Gustavo Petro',
    politicalOrientation: 'left',
    dimensions: {
      politicalStability: 10,
      ruleOfLaw: 35,
      governmentEffectiveness: 40,
      regulatoryQuality: 55,
      controlOfCorruption: 37,
      democracyIndex: 6.72,
      amlCompliance: 65,
      sanctionsExposure: 5,
      securityEnvironment: 28,
      contractEnforceability: 30,
      digitalReadiness: 58,
      tradeOpenness: 62,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2026-05-31',
      runoffDate: '2026-06-21',
      country: 'CO',
      description: 'Colombian presidential election 2026 -- Petro term-limited',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.HIGH,
      keyIssues: ['tax_reform', 'peace_process', 'energy_transition', 'labor_reform'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2026-03-08',
      country: 'CO',
      description: 'Colombian congressional election March 2026',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM_HIGH,
      keyIssues: ['coalition_dynamics', 'reform_agenda'],
    },
    activeReforms: [
      {
        id: 'CO-LABOR-2025',
        country: 'CO',
        category: 'labor',
        title: 'Workweek Reduction (Ley 2101/2021)',
        status: 'implementing',
        description: 'Gradual reduction from 48 to 42 hours/week by July 2026',
        smbImpact: 'negative',
        impactScore: -4,
        effectiveDate: '2023-07-15',
        transitionDeadline: '2026-07-15',
        kitzActionRequired: ['Payroll recalculation for 42-hour week', 'Overtime threshold updates'],
      },
    ],
    keyRisks: ['Election uncertainty (May 2026)', 'Armed group violence', 'Tax reform risk under new president', 'Peso volatility', 'CPI corruption score declining'],
    lastUpdated: '2026-02-25',
  },

  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    headOfState: 'Luiz Inacio Lula da Silva',
    politicalOrientation: 'center-left',
    dimensions: {
      politicalStability: 30,
      ruleOfLaw: 44,
      governmentEffectiveness: 48,
      regulatoryQuality: 42,
      controlOfCorruption: 35,
      democracyIndex: 6.68,
      amlCompliance: 72,
      sanctionsExposure: 0,
      securityEnvironment: 25,
      contractEnforceability: 35,
      digitalReadiness: 65,
      tradeOpenness: 40,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2026-10-04',
      runoffDate: '2026-10-25',
      country: 'BR',
      description: 'Brazilian general election 2026 -- Lula can run for consecutive reelection',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.HIGH,
      keyIssues: ['fiscal_policy', 'tax_reform_implementation', 'deforestation', 'inflation'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2026-10-04',
      country: 'BR',
      description: 'Brazilian congressional + gubernatorial elections 2026',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM_HIGH,
      keyIssues: ['fiscal_austerity', 'reform_continuation'],
    },
    activeReforms: [
      {
        id: 'BR-TAX-2023',
        country: 'BR',
        category: 'tax',
        title: 'CBS/IBS Indirect Tax Reform (EC 132/2023)',
        status: 'implementing',
        description: 'Replaces PIS/COFINS/IPI/ICMS/ISS with CBS (federal) and IBS (subnational). 2026-2033 transition.',
        smbImpact: 'mixed',
        impactScore: -3,
        effectiveDate: '2026-01-01',
        transitionDeadline: '2033-01-01',
        kitzActionRequired: [
          'Dual tax code support for transition period',
          'CBS 0.9% + IBS 0.1% test rates in 2026',
          'Simples Nacional compatibility layer',
          'Input credit tracking system',
          'Destination-based tax calculation engine',
        ],
      },
      {
        id: 'BR-AI-2026',
        country: 'BR',
        category: 'digital',
        title: 'AI Regulation Framework (PL 2338/2023)',
        status: 'in_committee',
        description: 'EU AI Act-inspired risk-based regulation; impact assessments for high-risk AI',
        smbImpact: 'mixed',
        impactScore: -2,
        kitzActionRequired: [
          'Classify Kitz AI features by risk tier',
          'Prepare algorithmic impact assessments',
          'Implement explainability for financial recommendations',
          'Human-in-the-loop for credit-adjacent decisions',
        ],
      },
    ],
    keyRisks: ['Tax reform complexity (CBS/IBS transition)', 'Election October 2026', 'Real volatility', 'Fiscal deficit concerns', 'AI regulation impact on Kitz', 'World-highest tax compliance hours'],
    lastUpdated: '2026-02-25',
  },

  AR: {
    countryCode: 'AR',
    countryName: 'Argentina',
    headOfState: 'Javier Milei',
    politicalOrientation: 'libertarian-right',
    dimensions: {
      politicalStability: 35,
      ruleOfLaw: 32,
      governmentEffectiveness: 38,
      regulatoryQuality: 18,
      controlOfCorruption: 38,
      democracyIndex: 6.41,
      amlCompliance: 58,
      sanctionsExposure: 0,
      securityEnvironment: 52,
      contractEnforceability: 42,
      digitalReadiness: 55,
      tradeOpenness: 30,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2027-10-24',
      country: 'AR',
      description: 'Argentine midterm legislative elections 2027',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM_HIGH,
      keyIssues: ['dollarization_debate', 'deregulation', 'fiscal_balance', 'inflation'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2027-10-24',
      country: 'AR',
      description: 'Argentine midterm elections 2027 -- Milei referendum',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM_HIGH,
      keyIssues: ['reform_mandate', 'economic_stabilization'],
    },
    activeReforms: [
      {
        id: 'AR-TAX-2024',
        country: 'AR',
        category: 'tax',
        title: 'Milei Tax Simplification Package',
        status: 'implementing',
        description: 'Export tax elimination, Ingresos Brutos reduction, Monotributo simplification, check tax phase-out',
        smbImpact: 'positive',
        impactScore: 7,
        kitzActionRequired: ['Monotributo category recalculation', 'Provincial tax rate updates', 'Export tax removal for affected products'],
      },
    ],
    keyRisks: ['Currency controls still partially in place', 'Peso volatility', 'Political polarization', 'Midterm risk to reform agenda', 'Informal economy 40%+'],
    lastUpdated: '2026-02-25',
  },

  PE: {
    countryCode: 'PE',
    countryName: 'Peru',
    headOfState: 'Dina Boluarte',
    politicalOrientation: 'center-right',
    dimensions: {
      politicalStability: 18,
      ruleOfLaw: 30,
      governmentEffectiveness: 33,
      regulatoryQuality: 52,
      controlOfCorruption: 33,
      democracyIndex: 5.85,
      amlCompliance: 62,
      sanctionsExposure: 0,
      securityEnvironment: 40,
      contractEnforceability: 50,
      digitalReadiness: 48,
      tradeOpenness: 68,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2026-04-12',
      runoffDate: '2026-06-07',
      country: 'PE',
      description: 'Peruvian general election April 2026 -- highly uncertain outcome',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.HIGH,
      keyIssues: ['mining_regulation', 'tax_reform', 'security', 'constitutional_reform'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2026-04-12',
      country: 'PE',
      description: 'Peruvian congressional election April 2026 (concurrent)',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.HIGH,
      keyIssues: ['fragmented_congress', 'governance_reform'],
    },
    activeReforms: [],
    keyRisks: ['Extreme political instability (6 presidents in 5 years)', 'April 2026 election uncertainty', 'Rising crime', 'Mining sector regulation risk', 'Fragmented Congress blocks all reform'],
    lastUpdated: '2026-02-25',
  },

  PA: {
    countryCode: 'PA',
    countryName: 'Panama',
    headOfState: 'Jose Raul Mulino',
    politicalOrientation: 'center-right',
    dimensions: {
      politicalStability: 52,
      ruleOfLaw: 45,
      governmentEffectiveness: 42,
      regulatoryQuality: 55,
      controlOfCorruption: 36,
      democracyIndex: 7.05,
      amlCompliance: 60,
      sanctionsExposure: 0,
      securityEnvironment: 55,
      contractEnforceability: 35,
      digitalReadiness: 52,
      tradeOpenness: 78,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2029-05-06',
      country: 'PA',
      description: 'Panamanian presidential election 2029 -- Mulino term-limited (single term)',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['canal_management', 'mining_moratorium', 'fiscal_policy', 'AML_compliance'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2029-05-06',
      country: 'PA',
      description: 'Panamanian legislative election 2029 (concurrent)',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['fiscal_reform', 'public_spending'],
    },
    activeReforms: [],
    keyRisks: ['Post-FATF grey list monitoring', 'First Quantum mining dispute', 'Canal water level issues', 'Darien migration corridor', 'High contract enforcement costs'],
    lastUpdated: '2026-02-25',
  },

  CR: {
    countryCode: 'CR',
    countryName: 'Costa Rica',
    headOfState: 'TBD (Feb 2026 election)',
    politicalOrientation: 'center',
    dimensions: {
      politicalStability: 62,
      ruleOfLaw: 65,
      governmentEffectiveness: 58,
      regulatoryQuality: 67,
      controlOfCorruption: 54,
      democracyIndex: 7.88,
      amlCompliance: 75,
      sanctionsExposure: 0,
      securityEnvironment: 48,
      contractEnforceability: 38,
      digitalReadiness: 60,
      tradeOpenness: 72,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2026-02-01',
      runoffDate: '2026-04-05',
      country: 'CR',
      description: 'Costa Rican presidential election February 2026',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['fiscal_deficit', 'security', 'nearshoring_opportunity', 'healthcare'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2026-02-01',
      country: 'CR',
      description: 'Costa Rican legislative election February 2026 (concurrent)',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['fiscal_reform', 'security_spending'],
    },
    activeReforms: [],
    keyRisks: ['New government transition (Feb-May 2026)', 'Rising drug trafficking violence', 'Fiscal deficit', 'High labor costs relative to region'],
    lastUpdated: '2026-02-25',
  },

  EC: {
    countryCode: 'EC',
    countryName: 'Ecuador',
    headOfState: 'Daniel Noboa',
    politicalOrientation: 'center-right',
    dimensions: {
      politicalStability: 8,
      ruleOfLaw: 22,
      governmentEffectiveness: 28,
      regulatoryQuality: 30,
      controlOfCorruption: 28,
      democracyIndex: 5.80,
      amlCompliance: 52,
      sanctionsExposure: 0,
      securityEnvironment: 15,
      contractEnforceability: 42,
      digitalReadiness: 38,
      tradeOpenness: 48,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2029-02-17',
      runoffDate: '2029-04-14',
      country: 'EC',
      description: 'Ecuadorian presidential election 2029',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM_HIGH,
      keyIssues: ['security_crisis', 'economic_reform', 'dollarization', 'mining_policy'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2029-02-17',
      country: 'EC',
      description: 'Ecuadorian legislative election 2029 (concurrent)',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['security_spending', 'fiscal_reform'],
    },
    activeReforms: [],
    keyRisks: ['Extreme security crisis (547% homicide rise)', 'Drug trafficking wars', 'Energy blackouts', 'Fiscal pressures', 'ICSID arbitration exposure'],
    lastUpdated: '2026-02-25',
  },

  DO: {
    countryCode: 'DO',
    countryName: 'Dominican Republic',
    headOfState: 'Luis Abinader',
    politicalOrientation: 'center-right',
    dimensions: {
      politicalStability: 48,
      ruleOfLaw: 38,
      governmentEffectiveness: 35,
      regulatoryQuality: 45,
      controlOfCorruption: 37,
      democracyIndex: 6.45,
      amlCompliance: 62,
      sanctionsExposure: 0,
      securityEnvironment: 42,
      contractEnforceability: 45,
      digitalReadiness: 42,
      tradeOpenness: 60,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2028-05-21',
      country: 'DO',
      description: 'Dominican Republic presidential election 2028 -- Abinader term-limited',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['fiscal_reform', 'energy_sector', 'Haiti_relations', 'tourism'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2028-05-21',
      country: 'DO',
      description: 'Dominican Republic congressional election 2028',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['fiscal_reform', 'energy_reform'],
    },
    activeReforms: [
      {
        id: 'DO-LABOR-2025',
        country: 'DO',
        category: 'labor',
        title: 'Phased Minimum Wage Increase',
        status: 'implementing',
        description: '25% minimum wage increase phased over 2025-2026',
        smbImpact: 'negative',
        impactScore: -5,
        effectiveDate: '2025-04-01',
        transitionDeadline: '2026-12-31',
        kitzActionRequired: ['Payroll recalculation for phased increases', 'Cost projection models'],
      },
    ],
    keyRisks: ['Haiti border security', 'Energy infrastructure fragility', 'Tourism dependency', 'Minimum wage escalation'],
    lastUpdated: '2026-02-25',
  },

  PY: {
    countryCode: 'PY',
    countryName: 'Paraguay',
    headOfState: 'Santiago Pena',
    politicalOrientation: 'center-right',
    dimensions: {
      politicalStability: 38,
      ruleOfLaw: 25,
      governmentEffectiveness: 20,
      regulatoryQuality: 32,
      controlOfCorruption: 28,
      democracyIndex: 6.14,
      amlCompliance: 48,
      sanctionsExposure: 0,
      securityEnvironment: 48,
      contractEnforceability: 38,
      digitalReadiness: 28,
      tradeOpenness: 52,
    },
    fatfStatus: 'clean',
    sanctionsRegime: 'none',
    nextPresidentialElection: {
      type: 'presidential',
      date: '2028-04-22',
      country: 'PY',
      description: 'Paraguayan presidential election 2028',
      incumbentCanRun: false,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['corruption', 'infrastructure', 'triple_border_security'],
    },
    nextLegislativeElection: {
      type: 'legislative',
      date: '2028-04-22',
      country: 'PY',
      description: 'Paraguayan congressional election 2028 (concurrent)',
      incumbentCanRun: true,
      policyShiftRisk: RiskTier.MEDIUM,
      keyIssues: ['fiscal_reform', 'institutional_reform'],
    },
    activeReforms: [],
    keyRisks: ['Triple border AML concerns', 'Contraband economy', 'Low institutional capacity', 'Corruption', 'Slow business registration'],
    lastUpdated: '2026-02-25',
  },

  GT: {
    countryCode: 'GT',
    countryName: 'Guatemala',
    headOfState: 'Bernardo Arevalo',
    politicalOrientation: 'center-left',
    dimensions: {
      politicalStability: 22, ruleOfLaw: 12, governmentEffectiveness: 18, regulatoryQuality: 35,
      controlOfCorruption: 24, democracyIndex: 4.80, amlCompliance: 40, sanctionsExposure: 5,
      securityEnvironment: 32, contractEnforceability: 35, digitalReadiness: 25, tradeOpenness: 55,
    },
    fatfStatus: 'clean', sanctionsRegime: 'targeted',
    nextPresidentialElection: { type: 'presidential', date: '2028-06-16', country: 'GT', description: 'Guatemalan presidential election 2028', incumbentCanRun: false, policyShiftRisk: RiskTier.HIGH, keyIssues: ['anti_corruption', 'security', 'migration'] },
    nextLegislativeElection: { type: 'legislative', date: '2028-06-16', country: 'GT', description: 'Guatemalan congressional election 2028', incumbentCanRun: true, policyShiftRisk: RiskTier.HIGH, keyIssues: ['anti_corruption', 'judicial_independence'] },
    activeReforms: [],
    keyRisks: ['Anti-corruption backlash from political establishment', 'Gang violence', 'Weak institutions', 'Magnitsky sanctions on officials', 'Permit corruption'],
    lastUpdated: '2026-02-25',
  },

  SV: {
    countryCode: 'SV',
    countryName: 'El Salvador',
    headOfState: 'Nayib Bukele',
    politicalOrientation: 'authoritarian-right',
    dimensions: {
      politicalStability: 42, ruleOfLaw: 20, governmentEffectiveness: 30, regulatoryQuality: 42,
      controlOfCorruption: 32, democracyIndex: 4.18, amlCompliance: 45, sanctionsExposure: 5,
      securityEnvironment: 70, contractEnforceability: 40, digitalReadiness: 42, tradeOpenness: 58,
    },
    fatfStatus: 'clean', sanctionsRegime: 'targeted',
    nextPresidentialElection: { type: 'presidential', date: '2030-02-03', country: 'SV', description: 'Salvadoran presidential election 2030', incumbentCanRun: true, policyShiftRisk: RiskTier.LOW, keyIssues: ['bitcoin_policy', 'democratic_norms', 'economy'] },
    nextLegislativeElection: { type: 'legislative', date: '2030-02-03', country: 'SV', description: 'Salvadoran legislative election 2030', incumbentCanRun: true, policyShiftRisk: RiskTier.LOW, keyIssues: ['Nuevas Ideas dominance'] },
    activeReforms: [],
    keyRisks: ['Bitcoin legal tender experiment', 'Democratic backsliding', 'FATF monitoring of crypto AML', 'Concentrated executive power', 'US relations volatility'],
    lastUpdated: '2026-02-25',
  },

  HN: {
    countryCode: 'HN',
    countryName: 'Honduras',
    headOfState: 'Xiomara Castro',
    politicalOrientation: 'left',
    dimensions: {
      politicalStability: 15, ruleOfLaw: 10, governmentEffectiveness: 12, regulatoryQuality: 28,
      controlOfCorruption: 22, democracyIndex: 4.65, amlCompliance: 38, sanctionsExposure: 5,
      securityEnvironment: 18, contractEnforceability: 30, digitalReadiness: 20, tradeOpenness: 55,
    },
    fatfStatus: 'clean', sanctionsRegime: 'targeted',
    nextPresidentialElection: { type: 'presidential', date: '2027-11-28', country: 'HN', description: 'Honduran presidential election 2027', incumbentCanRun: false, policyShiftRisk: RiskTier.HIGH, keyIssues: ['security', 'corruption', 'economic_policy'] },
    nextLegislativeElection: { type: 'legislative', date: '2027-11-28', country: 'HN', description: 'Honduran congressional election 2027', incumbentCanRun: true, policyShiftRisk: RiskTier.HIGH, keyIssues: ['security', 'institutional_reform'] },
    activeReforms: [],
    keyRisks: ['Extreme violence and extortion', 'Corruption', 'Weak institutions', 'Drug trafficking', 'Magnitsky sanctions on officials'],
    lastUpdated: '2026-02-25',
  },

  BO: {
    countryCode: 'BO',
    countryName: 'Bolivia',
    headOfState: 'Luis Arce',
    politicalOrientation: 'left',
    dimensions: {
      politicalStability: 12, ruleOfLaw: 15, governmentEffectiveness: 18, regulatoryQuality: 12,
      controlOfCorruption: 27, democracyIndex: 4.48, amlCompliance: 25, sanctionsExposure: 5,
      securityEnvironment: 45, contractEnforceability: 25, digitalReadiness: 18, tradeOpenness: 35,
    },
    fatfStatus: 'grey_list', sanctionsRegime: 'targeted',
    nextPresidentialElection: { type: 'presidential', date: '2030-10-18', country: 'BO', description: 'Bolivian presidential election 2030', incumbentCanRun: true, policyShiftRisk: RiskTier.HIGH, keyIssues: ['MAS_internal_split', 'economic_crisis', 'gas_decline'] },
    nextLegislativeElection: { type: 'legislative', date: '2030-10-18', country: 'BO', description: 'Bolivian legislative election 2030', incumbentCanRun: true, policyShiftRisk: RiskTier.HIGH, keyIssues: ['MAS_factions', 'fiscal_crisis'] },
    activeReforms: [],
    keyRisks: ['FATF grey list -- banking access issues', 'Gas revenue decline', 'Currency peg under pressure', 'MAS political crisis', 'ICSID re-accession complications', 'Highest regulatory burden in LatAm'],
    lastUpdated: '2026-02-25',
  },

  NI: {
    countryCode: 'NI',
    countryName: 'Nicaragua',
    headOfState: 'Daniel Ortega',
    politicalOrientation: 'authoritarian-left',
    dimensions: {
      politicalStability: 18, ruleOfLaw: 5, governmentEffectiveness: 8, regulatoryQuality: 10,
      controlOfCorruption: 14, democracyIndex: 2.64, amlCompliance: 20, sanctionsExposure: 55,
      securityEnvironment: 55, contractEnforceability: 18, digitalReadiness: 12, tradeOpenness: 40,
    },
    fatfStatus: 'clean', sanctionsRegime: 'targeted',
    nextPresidentialElection: null,
    nextLegislativeElection: null,
    activeReforms: [],
    keyRisks: ['Authoritarian regime', 'US/EU targeted sanctions', 'Civil society repression', 'NICA Act restrictions', 'No independent judiciary', 'DR-CAFTA suspension risk'],
    lastUpdated: '2026-02-25',
  },

  VE: {
    countryCode: 'VE',
    countryName: 'Venezuela',
    headOfState: 'Post-Maduro transition',
    politicalOrientation: 'authoritarian-left',
    dimensions: {
      politicalStability: 3, ruleOfLaw: 1, governmentEffectiveness: 2, regulatoryQuality: 2,
      controlOfCorruption: 10, democracyIndex: 2.08, amlCompliance: 8, sanctionsExposure: 85,
      securityEnvironment: 8, contractEnforceability: 5, digitalReadiness: 8, tradeOpenness: 10,
    },
    fatfStatus: 'grey_list', sanctionsRegime: 'comprehensive',
    nextPresidentialElection: null,
    nextLegislativeElection: null,
    activeReforms: [],
    keyRisks: ['Comprehensive OFAC sanctions (evolving post-Maduro)', 'FATF grey list', 'Collapsed institutions', 'Hyperinflation legacy', 'SDN list density', 'Oil sector GL complexity', 'Banking access near-impossible'],
    lastUpdated: '2026-02-25',
  },

  HT: {
    countryCode: 'HT',
    countryName: 'Haiti',
    headOfState: 'Transitional Council',
    politicalOrientation: 'center',
    dimensions: {
      politicalStability: 2, ruleOfLaw: 3, governmentEffectiveness: 2, regulatoryQuality: 5,
      controlOfCorruption: 16, democracyIndex: 2.80, amlCompliance: 15, sanctionsExposure: 25,
      securityEnvironment: 5, contractEnforceability: 8, digitalReadiness: 5, tradeOpenness: 30,
    },
    fatfStatus: 'clean', sanctionsRegime: 'targeted',
    nextPresidentialElection: { type: 'presidential', date: '2026-08-30', runoffDate: '2026-12-06', country: 'HT', description: 'Haitian presidential election 2026 (tentative)', incumbentCanRun: false, policyShiftRisk: RiskTier.CRITICAL, keyIssues: ['gang_control', 'state_rebuilding', 'humanitarian_crisis'] },
    nextLegislativeElection: { type: 'legislative', date: '2026-08-30', country: 'HT', description: 'Haitian legislative election 2026 (tentative)', incumbentCanRun: false, policyShiftRisk: RiskTier.CRITICAL, keyIssues: ['institutional_rebuilding'] },
    activeReforms: [],
    keyRisks: ['Failed state conditions', 'Gang control of 80%+ of Port-au-Prince', 'No functioning government', 'Humanitarian crisis', 'MINUSMA/international intervention', 'Zero business viability for most sectors'],
    lastUpdated: '2026-02-25',
  },

  CU: {
    countryCode: 'CU',
    countryName: 'Cuba',
    headOfState: 'Miguel Diaz-Canel',
    politicalOrientation: 'authoritarian-left',
    dimensions: {
      politicalStability: 30, ruleOfLaw: 15, governmentEffectiveness: 12, regulatoryQuality: 5,
      controlOfCorruption: 42, democracyIndex: 2.50, amlCompliance: 20, sanctionsExposure: 95,
      securityEnvironment: 65, contractEnforceability: 10, digitalReadiness: 10, tradeOpenness: 5,
    },
    fatfStatus: 'clean', sanctionsRegime: 'comprehensive',
    nextPresidentialElection: null,
    nextLegislativeElection: null,
    activeReforms: [],
    keyRisks: ['Comprehensive US embargo', 'Near-total financial isolation', 'Energy crisis', 'Economic collapse', 'No private sector framework', 'Kitz cannot operate'],
    lastUpdated: '2026-02-25',
  },
};
```

---

## 13.3 Risk Scoring Engine

```typescript
/**
 * Risk Scoring Engine
 *
 * Calculates composite country risk scores using a weighted average of
 * dimension scores. Weights are calibrated for SMB operational relevance.
 */

const DIMENSION_WEIGHTS: Record<keyof PoliticalRiskDimensions, number> = {
  politicalStability: 0.10,
  ruleOfLaw: 0.12,
  governmentEffectiveness: 0.08,
  regulatoryQuality: 0.10,
  controlOfCorruption: 0.10,
  democracyIndex: 0.05,          // Normalized to 0-100 in calculation
  amlCompliance: 0.10,
  sanctionsExposure: 0.10,       // Inverted: 100 - exposure = score
  securityEnvironment: 0.08,
  contractEnforceability: 0.07,
  digitalReadiness: 0.05,
  tradeOpenness: 0.05,
};

function calculateCompositeScore(dimensions: PoliticalRiskDimensions): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const dim = key as keyof PoliticalRiskDimensions;
    let value = dimensions[dim];

    // Normalize democracy index from 0-10 to 0-100
    if (dim === 'democracyIndex') {
      value = value * 10;
    }

    // Invert sanctions exposure (higher exposure = lower score)
    if (dim === 'sanctionsExposure') {
      value = 100 - value;
    }

    weightedSum += value * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

function scoreToRiskTier(score: number): RiskTier {
  if (score >= 70) return RiskTier.LOW;
  if (score >= 50) return RiskTier.MEDIUM;
  if (score >= 35) return RiskTier.MEDIUM_HIGH;
  if (score >= 20) return RiskTier.HIGH;
  return RiskTier.CRITICAL;
}

function isElectionWindowActive(election: ElectionEvent | null): boolean {
  if (!election) return false;
  const electionDate = new Date(election.date);
  const now = new Date();
  const sixMonthsBefore = new Date(electionDate);
  sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 6);
  return now >= sixMonthsBefore && now <= electionDate;
}

export function getCountryRiskProfile(countryCode: LatAmCountryCode): CountryRiskProfile {
  const raw = COUNTRY_RISK_DB[countryCode];
  if (!raw) {
    throw new Error(`Country ${countryCode} not found in risk database`);
  }

  const compositeScore = calculateCompositeScore(raw.dimensions);
  const riskTier = scoreToRiskTier(compositeScore);
  const electionWindowActive =
    isElectionWindowActive(raw.nextPresidentialElection) ||
    isElectionWindowActive(raw.nextLegislativeElection);

  return {
    ...raw,
    compositeScore,
    riskTier,
    electionWindowActive,
  };
}

export function getAllCountryRiskProfiles(): CountryRiskProfile[] {
  return (Object.keys(COUNTRY_RISK_DB) as LatAmCountryCode[])
    .map(getCountryRiskProfile)
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

export function getCountriesByRiskTier(tier: RiskTier): CountryRiskProfile[] {
  return getAllCountryRiskProfiles().filter(p => p.riskTier === tier);
}

export function getCountriesInElectionWindow(): CountryRiskProfile[] {
  return getAllCountryRiskProfiles().filter(p => p.electionWindowActive);
}
```

---

## 13.4 Election Countdown Tracker

```typescript
/**
 * Election Countdown Tracker
 *
 * Provides countdown timers, alerts, and advisory content for upcoming
 * elections that may affect SMB operations.
 */

export interface ElectionCountdown {
  event: ElectionEvent;
  daysUntilElection: number;
  daysUntilRunoff: number | null;
  phase: 'pre_campaign' | 'campaign' | 'election_week' | 'post_election' | 'transition' | 'past';
  urgency: 'none' | 'low' | 'medium' | 'high' | 'critical';
  advisories: string[];
}

export function getElectionCountdown(event: ElectionEvent): ElectionCountdown {
  const now = new Date();
  const electionDate = new Date(event.date);
  const diffMs = electionDate.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let daysUntilRunoff: number | null = null;
  if (event.runoffDate) {
    const runoffDate = new Date(event.runoffDate);
    daysUntilRunoff = Math.ceil((runoffDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Determine election phase
  let phase: ElectionCountdown['phase'];
  if (daysUntil > 180) {
    phase = 'pre_campaign';
  } else if (daysUntil > 7) {
    phase = 'campaign';
  } else if (daysUntil >= -1) {
    phase = 'election_week';
  } else if (daysUntil >= -90) {
    phase = 'post_election';
  } else if (daysUntil >= -180) {
    phase = 'transition';
  } else {
    phase = 'past';
  }

  // Calculate urgency
  let urgency: ElectionCountdown['urgency'];
  if (daysUntil > 365) {
    urgency = 'none';
  } else if (daysUntil > 180) {
    urgency = 'low';
  } else if (daysUntil > 60) {
    urgency = 'medium';
  } else if (daysUntil > 14) {
    urgency = 'high';
  } else if (daysUntil > -90) {
    urgency = 'critical';
  } else {
    urgency = 'none';
  }

  // Generate advisories based on phase and risk
  const advisories: string[] = [];

  if (phase === 'campaign' && event.policyShiftRisk !== RiskTier.LOW) {
    advisories.push(
      `Election in ${event.country} in ${daysUntil} days. Policy shift risk: ${event.policyShiftRisk}.`
    );
    advisories.push('Consider locking in contracts and supplier terms before election.');
    advisories.push('Review tax and labor compliance for potential post-election changes.');
    if (event.keyIssues.includes('tax_reform')) {
      advisories.push('TAX REFORM is a key election issue. Defer non-essential tax planning until outcome is clear.');
    }
    if (event.keyIssues.includes('labor_reform')) {
      advisories.push('LABOR REFORM is a key election issue. Review payroll cost projections for both scenarios.');
    }
  }

  if (phase === 'election_week') {
    advisories.push(`ELECTION WEEK in ${event.country}. Expect potential market volatility.`);
    advisories.push('Avoid large currency conversions this week.');
    advisories.push('Ensure all pending government filings are completed before election day.');
  }

  if (phase === 'post_election') {
    advisories.push(`Post-election period in ${event.country}. Monitor new administration\'s policy announcements.`);
    advisories.push('Expect 60-90 day policy clarification period before major changes.');
    if (daysUntilRunoff && daysUntilRunoff > 0) {
      advisories.push(`Runoff election in ${daysUntilRunoff} days. Outcome still uncertain.`);
    }
  }

  if (phase === 'transition') {
    advisories.push(`New government transition in ${event.country}. Regulatory changes may begin taking effect.`);
    advisories.push('Review all compliance obligations against new government\'s announced agenda.');
  }

  return {
    event,
    daysUntilElection: daysUntil,
    daysUntilRunoff,
    phase,
    urgency,
    advisories,
  };
}

export function getUpcomingElections(months: number = 12): ElectionCountdown[] {
  const allProfiles = getAllCountryRiskProfiles();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() + months);

  const elections: ElectionCountdown[] = [];

  for (const profile of allProfiles) {
    for (const election of [profile.nextPresidentialElection, profile.nextLegislativeElection]) {
      if (election && new Date(election.date) <= cutoff && new Date(election.date) >= new Date()) {
        elections.push(getElectionCountdown(election));
      }
    }
  }

  return elections.sort((a, b) => a.daysUntilElection - b.daysUntilElection);
}
```

---

## 13.5 Regulatory Change Monitor

```typescript
/**
 * Regulatory Change Monitor
 *
 * Tracks active regulatory reforms and generates alerts for SMBs
 * based on their country, sector, and compliance status.
 */

export interface RegulatoryAlert {
  id: string;
  country: LatAmCountryCode;
  reform: RegulatoryReform;
  alertType: 'new_reform' | 'deadline_approaching' | 'status_change' | 'kitz_action_needed';
  severity: 'info' | 'warning' | 'urgent' | 'critical';
  message: string;
  daysUntilDeadline: number | null;
  actionItems: string[];
}

export function getActiveReforms(countryCode?: LatAmCountryCode): RegulatoryReform[] {
  if (countryCode) {
    const profile = COUNTRY_RISK_DB[countryCode];
    return profile ? profile.activeReforms : [];
  }

  return Object.values(COUNTRY_RISK_DB).flatMap(p => p.activeReforms);
}

export function getReformsByCategory(category: RegulatoryReform['category']): RegulatoryReform[] {
  return getActiveReforms().filter(r => r.category === category);
}

export function generateRegulatoryAlerts(
  countryCode: LatAmCountryCode,
  businessSectors: string[] = []
): RegulatoryAlert[] {
  const reforms = getActiveReforms(countryCode);
  const alerts: RegulatoryAlert[] = [];
  const now = new Date();

  for (const reform of reforms) {
    // Check for approaching deadlines
    if (reform.transitionDeadline) {
      const deadline = new Date(reform.transitionDeadline);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 90 && daysUntil > 0) {
        const severity = daysUntil <= 30 ? 'critical' : daysUntil <= 60 ? 'urgent' : 'warning';
        alerts.push({
          id: `${reform.id}-deadline`,
          country: countryCode,
          reform,
          alertType: 'deadline_approaching',
          severity,
          message: `Compliance deadline for "${reform.title}" in ${daysUntil} days (${reform.transitionDeadline}).`,
          daysUntilDeadline: daysUntil,
          actionItems: reform.kitzActionRequired,
        });
      }
    }

    // Check for Kitz platform action needed
    if (reform.kitzActionRequired.length > 0 && reform.status !== 'effective') {
      alerts.push({
        id: `${reform.id}-action`,
        country: countryCode,
        reform,
        alertType: 'kitz_action_needed',
        severity: reform.impactScore <= -5 ? 'urgent' : 'warning',
        message: `Kitz platform updates needed for "${reform.title}" (${reform.status}).`,
        daysUntilDeadline: reform.transitionDeadline
          ? Math.ceil((new Date(reform.transitionDeadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        actionItems: reform.kitzActionRequired,
      });
    }

    // Impact severity alert for negative SMB impact
    if (reform.smbImpact === 'negative' && reform.impactScore <= -4) {
      alerts.push({
        id: `${reform.id}-impact`,
        country: countryCode,
        reform,
        alertType: 'new_reform',
        severity: reform.impactScore <= -7 ? 'critical' : 'warning',
        message: `High-impact regulatory change: "${reform.title}" -- negative SMB impact score: ${reform.impactScore}/10.`,
        daysUntilDeadline: null,
        actionItems: [
          `Review ${reform.category} compliance for ${COUNTRY_RISK_DB[countryCode]?.countryName}`,
          'Update cost projections for affected business operations',
          ...reform.kitzActionRequired,
        ],
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, urgent: 1, warning: 2, info: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
```

---

## 13.6 Compliance Checker

```typescript
/**
 * Compliance Checker
 *
 * Validates SMB compliance status against country-specific requirements.
 * Integrates with sanctions screening and AML obligations.
 */

export interface SanctionsScreeningInput {
  name: string;
  aliases?: string[];
  countryCode: LatAmCountryCode;
  taxId?: string;
  dateOfBirth?: string;
}

const SDN_LISTS = [
  'OFAC SDN',
  'OFAC Consolidated',
  'EU Consolidated Sanctions',
  'UN Security Council',
  'UK HMT Sanctions',
] as const;

// STR thresholds by country (in local currency)
const STR_THRESHOLDS: Record<string, { amount: number; currency: string; type: string }> = {
  MX: { amount: 64_710, currency: 'MXN', type: 'cash' },      // ~$3,340 USD
  BR: { amount: 50_000, currency: 'BRL', type: 'single' },
  CO: { amount: 50_000_000, currency: 'COP', type: 'single' }, // ~$11K USD
  AR: { amount: 960_000, currency: 'ARS', type: 'cash' },      // ~$5K USD equivalent
  CL: { amount: 13_500_000, currency: 'CLP', type: 'single' }, // UF 450 ~$16K
  PE: { amount: 10_000, currency: 'PEN', type: 'single' },
  PA: { amount: 10_000, currency: 'USD', type: 'cash' },
  CR: { amount: 10_000, currency: 'USD', type: 'all' },
  EC: { amount: 10_000, currency: 'USD', type: 'single' },
  UY: { amount: 400_000, currency: 'UYU', type: 'cash' },      // ~$10K USD
  DO: { amount: 600_000, currency: 'DOP', type: 'single' },    // ~$10K USD
  PY: { amount: 75_000_000, currency: 'PYG', type: 'single' }, // ~$10K USD
  GT: { amount: 75_000, currency: 'GTQ', type: 'single' },     // ~$10K USD
  SV: { amount: 10_000, currency: 'USD', type: 'single' },
  HN: { amount: 250_000, currency: 'HNL', type: 'single' },    // ~$10K USD
  BO: { amount: 70_000, currency: 'BOB', type: 'single' },     // ~$10K USD
};

/**
 * Fuzzy name matching for sanctions screening.
 * Uses Levenshtein distance normalized to a 0-100 confidence score.
 */
function fuzzyNameMatch(name1: string, name2: string): number {
  const s1 = name1.toLowerCase().trim();
  const s2 = name2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  const distance = matrix[len1][len2];
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Screen a name against sanctions lists.
 * In production, this would call OFAC's API or a sanctions screening service.
 * This implementation demonstrates the matching logic.
 */
export async function screenAgainstSanctions(
  input: SanctionsScreeningInput
): Promise<ComplianceCheckResult['sanctions']> {
  const namesToCheck = [input.name, ...(input.aliases || [])];
  const matchedEntries: SanctionsMatch[] = [];

  // In production: call OFAC screening API, OpenSanctions, or Dow Jones Risk
  // This is a stub showing the matching logic pattern
  const sanctionsEntries: Array<{ name: string; sdnType: string; programs: string[]; list: string }> = [];

  // Screen each name variant against each list
  for (const nameToCheck of namesToCheck) {
    for (const entry of sanctionsEntries) {
      const score = fuzzyNameMatch(nameToCheck, entry.name);
      if (score >= 85) { // 85% threshold for potential match
        matchedEntries.push({
          listName: entry.list,
          matchedName: entry.name,
          matchScore: score,
          sdnType: entry.sdnType,
          programs: entry.programs,
        });
      }
    }
  }

  return {
    cleared: matchedEntries.length === 0,
    matchedEntries,
    listsChecked: [...SDN_LISTS],
  };
}

export function getAmlRequirements(countryCode: LatAmCountryCode): ComplianceCheckResult['aml'] {
  const threshold = STR_THRESHOLDS[countryCode] || { amount: 10_000, currency: 'USD', type: 'single' };
  const profile = getCountryRiskProfile(countryCode);

  return {
    kycComplete: false, // Populated by workspace-level data
    enhancedDueDiligenceRequired:
      profile.riskTier === RiskTier.HIGH ||
      profile.riskTier === RiskTier.CRITICAL ||
      profile.fatfStatus === 'grey_list',
    strThreshold: { amount: threshold.amount, currency: threshold.currency },
    beneficialOwnershipFiled: false, // Populated by workspace-level data
  };
}

export async function runComplianceCheck(
  countryCode: LatAmCountryCode,
  entityName: string,
  aliases?: string[]
): Promise<ComplianceCheckResult> {
  const sanctions = await screenAgainstSanctions({
    name: entityName,
    aliases,
    countryCode,
  });

  const aml = getAmlRequirements(countryCode);
  const profile = getCountryRiskProfile(countryCode);

  const requiredActions: string[] = [];

  if (!sanctions.cleared) {
    requiredActions.push('CRITICAL: Potential sanctions match detected. Do NOT process transaction. Escalate to compliance officer.');
  }

  if (aml.enhancedDueDiligenceRequired) {
    requiredActions.push(`Enhanced due diligence required for ${profile.countryName} (${profile.fatfStatus === 'grey_list' ? 'FATF grey list' : 'high-risk tier'}).`);
  }

  if (!aml.kycComplete) {
    requiredActions.push('Complete KYC documentation before processing transactions.');
  }

  if (!aml.beneficialOwnershipFiled) {
    requiredActions.push('File beneficial ownership declaration with relevant authority.');
  }

  if (profile.sanctionsRegime === 'comprehensive') {
    requiredActions.push(`BLOCKED: ${profile.countryName} is under comprehensive sanctions. No transactions permitted without specific license.`);
  }

  const overallStatus: ComplianceCheckResult['overallStatus'] =
    !sanctions.cleared || profile.sanctionsRegime === 'comprehensive'
      ? 'blocked'
      : requiredActions.length > 0
        ? 'action_required'
        : 'compliant';

  return {
    country: countryCode,
    timestamp: new Date().toISOString(),
    sanctions,
    aml,
    regulatory: {
      businessRegistered: false, // Populated from workspace data
      taxCompliant: false,
      laborCompliant: false,
      dataProtectionCompliant: false,
      sectorPermits: [],
    },
    overallStatus,
    requiredActions,
  };
}
```

---

## 13.7 Country Risk Dashboard Tool (ToolSchema Integration)

```typescript
/**
 * Country Risk Dashboard Tools -- MCP-compatible tool definitions.
 *
 * Registers with Kitz's tool registry (registry.ts) to expose political
 * and regulatory risk analysis through the agent conversation interface.
 */

import type { ToolSchema } from './registry.js';

export function getAllPoliticalRiskTools(): ToolSchema[] {
  return [
    {
      name: 'risk_countryProfile',
      description:
        'Get the full political and regulatory risk profile for a LatAm country. ' +
        'Returns composite risk score, risk tier, political stability metrics, ' +
        'election status, active reforms, sanctions status, and key risks.',
      parameters: {
        type: 'object',
        properties: {
          countryCode: {
            type: 'string',
            description: 'ISO 3166-1 alpha-2 country code (e.g., MX, CO, BR, PA)',
            enum: [
              'MX', 'CO', 'BR', 'AR', 'CL', 'PE', 'PA', 'CR',
              'EC', 'UY', 'PY', 'DO', 'GT', 'SV', 'HN', 'BO',
              'NI', 'VE', 'HT', 'CU',
            ],
          },
        },
        required: ['countryCode'],
      },
      riskLevel: 'low',
      execute: async (args: { countryCode: LatAmCountryCode }) => {
        const profile = getCountryRiskProfile(args.countryCode);
        return {
          success: true,
          data: profile,
          summary: `${profile.countryName}: Risk tier ${profile.riskTier} (score: ${profile.compositeScore}/100). ` +
            `Head of state: ${profile.headOfState} (${profile.politicalOrientation}). ` +
            `FATF: ${profile.fatfStatus}. Sanctions: ${profile.sanctionsRegime}. ` +
            `Election window active: ${profile.electionWindowActive}. ` +
            `Key risks: ${profile.keyRisks.slice(0, 3).join('; ')}.`,
        };
      },
    },

    {
      name: 'risk_electionCalendar',
      description:
        'Get upcoming elections across LatAm with countdown timers, ' +
        'policy shift risk assessments, and SMB advisory content.',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description: 'Number of months ahead to look (default: 12)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args: { months?: number }) => {
        const elections = getUpcomingElections(args.months || 12);
        return {
          success: true,
          data: elections,
          summary: `${elections.length} upcoming elections in the next ${args.months || 12} months. ` +
            elections
              .filter(e => e.urgency !== 'none')
              .map(e => `${e.event.country}: ${e.event.type} in ${e.daysUntilElection} days (${e.urgency})`)
              .join('; '),
        };
      },
    },

    {
      name: 'risk_regulatoryAlerts',
      description:
        'Get regulatory change alerts for a specific country. Returns ' +
        'active reforms, approaching deadlines, and required Kitz platform actions.',
      parameters: {
        type: 'object',
        properties: {
          countryCode: {
            type: 'string',
            description: 'ISO 3166-1 alpha-2 country code',
          },
          businessSectors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Business sectors to filter alerts (e.g., retail, food, transport)',
          },
        },
        required: ['countryCode'],
      },
      riskLevel: 'low',
      execute: async (args: { countryCode: LatAmCountryCode; businessSectors?: string[] }) => {
        const alerts = generateRegulatoryAlerts(args.countryCode, args.businessSectors);
        return {
          success: true,
          data: alerts,
          summary: `${alerts.length} regulatory alerts for ${args.countryCode}. ` +
            `Critical: ${alerts.filter(a => a.severity === 'critical').length}. ` +
            `Urgent: ${alerts.filter(a => a.severity === 'urgent').length}. ` +
            `Warning: ${alerts.filter(a => a.severity === 'warning').length}.`,
        };
      },
    },

    {
      name: 'risk_complianceCheck',
      description:
        'Run a compliance check on an entity -- screens against sanctions lists, ' +
        'checks AML requirements, and validates country-level compliance status.',
      parameters: {
        type: 'object',
        properties: {
          countryCode: {
            type: 'string',
            description: 'Country where the entity operates',
          },
          entityName: {
            type: 'string',
            description: 'Legal name of the entity to screen',
          },
          aliases: {
            type: 'array',
            items: { type: 'string' },
            description: 'Known aliases or trade names',
          },
        },
        required: ['countryCode', 'entityName'],
      },
      riskLevel: 'medium',
      execute: async (args: { countryCode: LatAmCountryCode; entityName: string; aliases?: string[] }) => {
        const result = await runComplianceCheck(args.countryCode, args.entityName, args.aliases);
        return {
          success: true,
          data: result,
          summary: `Compliance check for "${args.entityName}" in ${args.countryCode}: ` +
            `Status: ${result.overallStatus.toUpperCase()}. ` +
            `Sanctions cleared: ${result.sanctions.cleared}. ` +
            `EDD required: ${result.aml.enhancedDueDiligenceRequired}. ` +
            `Actions needed: ${result.requiredActions.length}.`,
        };
      },
    },

    {
      name: 'risk_compareCounsties',
      description:
        'Compare political and regulatory risk profiles across multiple countries. ' +
        'Useful for expansion planning and market entry decisions.',
      parameters: {
        type: 'object',
        properties: {
          countryCodes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of ISO 3166-1 alpha-2 country codes to compare',
            minItems: 2,
            maxItems: 6,
          },
        },
        required: ['countryCodes'],
      },
      riskLevel: 'low',
      execute: async (args: { countryCodes: LatAmCountryCode[] }) => {
        const profiles = args.countryCodes.map(getCountryRiskProfile);
        const ranked = profiles.sort((a, b) => b.compositeScore - a.compositeScore);

        const comparison = ranked.map(p => ({
          country: p.countryName,
          code: p.countryCode,
          compositeScore: p.compositeScore,
          riskTier: p.riskTier,
          fatfStatus: p.fatfStatus,
          sanctionsRegime: p.sanctionsRegime,
          electionWindow: p.electionWindowActive,
          activeReformCount: p.activeReforms.length,
          topRisks: p.keyRisks.slice(0, 2),
        }));

        return {
          success: true,
          data: comparison,
          summary: `Country comparison (best to worst): ` +
            ranked.map(p => `${p.countryCode}=${p.compositeScore}`).join(', ') +
            `. Best for SMB expansion: ${ranked[0].countryName} (${ranked[0].riskTier}).`,
        };
      },
    },

    {
      name: 'risk_dashboard',
      description:
        'Get the full political risk dashboard -- aggregated view of all LatAm countries ' +
        'with risk tiers, active election windows, regulatory alerts, and sanctions status.',
      parameters: { type: 'object', properties: {} },
      riskLevel: 'low',
      execute: async () => {
        const profiles = getAllCountryRiskProfiles();
        const electionsActive = profiles.filter(p => p.electionWindowActive);
        const greyListCountries = profiles.filter(p => p.fatfStatus === 'grey_list');
        const sanctionedCountries = profiles.filter(p => p.sanctionsRegime !== 'none');
        const criticalCountries = profiles.filter(p => p.riskTier === RiskTier.CRITICAL);
        const totalAlerts = profiles.reduce(
          (sum, p) => sum + generateRegulatoryAlerts(p.countryCode).length,
          0
        );

        return {
          success: true,
          data: {
            totalCountries: profiles.length,
            byTier: {
              LOW: profiles.filter(p => p.riskTier === RiskTier.LOW).map(p => p.countryCode),
              MEDIUM: profiles.filter(p => p.riskTier === RiskTier.MEDIUM).map(p => p.countryCode),
              MEDIUM_HIGH: profiles.filter(p => p.riskTier === RiskTier.MEDIUM_HIGH).map(p => p.countryCode),
              HIGH: profiles.filter(p => p.riskTier === RiskTier.HIGH).map(p => p.countryCode),
              CRITICAL: profiles.filter(p => p.riskTier === RiskTier.CRITICAL).map(p => p.countryCode),
            },
            activeElectionWindows: electionsActive.map(p => ({
              country: p.countryCode,
              election: p.nextPresidentialElection?.date || p.nextLegislativeElection?.date,
            })),
            fatfGreyList: greyListCountries.map(p => p.countryCode),
            sanctioned: sanctionedCountries.map(p => ({ country: p.countryCode, regime: p.sanctionsRegime })),
            critical: criticalCountries.map(p => p.countryCode),
            totalRegulatoryAlerts: totalAlerts,
          },
          summary:
            `LatAm Risk Dashboard: ${profiles.length} countries tracked. ` +
            `${electionsActive.length} in active election windows. ` +
            `${greyListCountries.length} on FATF grey list. ` +
            `${sanctionedCountries.length} under sanctions. ` +
            `${criticalCountries.length} at CRITICAL risk. ` +
            `${totalAlerts} active regulatory alerts.`,
        };
      },
    },
  ];
}
```

---

## 13.8 Usage Examples

```typescript
// ── Example 1: Get country risk profile ──
const mexicoRisk = getCountryRiskProfile('MX');
console.log(`Mexico risk: ${mexicoRisk.riskTier} (${mexicoRisk.compositeScore}/100)`);
console.log(`Election window: ${mexicoRisk.electionWindowActive}`);
console.log(`FATF: ${mexicoRisk.fatfStatus}, Sanctions: ${mexicoRisk.sanctionsRegime}`);

// ── Example 2: Election countdown ──
const elections = getUpcomingElections(12);
for (const e of elections) {
  console.log(`${e.event.country} ${e.event.type}: ${e.daysUntilElection} days (${e.urgency})`);
  for (const advisory of e.advisories) {
    console.log(`  -> ${advisory}`);
  }
}

// ── Example 3: Regulatory alerts for Colombia ──
const alerts = generateRegulatoryAlerts('CO');
for (const alert of alerts) {
  console.log(`[${alert.severity.toUpperCase()}] ${alert.message}`);
  for (const action of alert.actionItems) {
    console.log(`  Action: ${action}`);
  }
}

// ── Example 4: Compliance check ──
const check = await runComplianceCheck('VE', 'Petroleum Corp Venezuela', ['PCV SA']);
console.log(`Status: ${check.overallStatus}`);
console.log(`Sanctions cleared: ${check.sanctions.cleared}`);
for (const action of check.requiredActions) {
  console.log(`  Required: ${action}`);
}

// ── Example 5: Country comparison for expansion ──
const tools = getAllPoliticalRiskTools();
const compareTool = tools.find(t => t.name === 'risk_compareCounsties');
if (compareTool) {
  const result = await compareTool.execute({ countryCodes: ['PA', 'CR', 'CO', 'MX'] });
  console.log(result.summary);
}

// ── Example 6: Full dashboard ──
const dashboardTool = tools.find(t => t.name === 'risk_dashboard');
if (dashboardTool) {
  const dashboard = await dashboardTool.execute({});
  console.log(dashboard.summary);
}
```

---

## Appendix: Data Sources and Refresh Cadence

| Source | Data Used | URL | Refresh Frequency |
|---|---|---|---|
| World Bank WGI | Political stability, rule of law, gov. effectiveness, regulatory quality, corruption control | info.worldbank.org/governance/wgi | Annually (December) |
| Transparency International CPI | Corruption scores | transparency.org/en/cpi | Annually (January) |
| EIU Democracy Index | Democracy classification and scores | eiu.com/n/campaigns/democracy-index | Annually (February) |
| FATF | Grey/black list status, AML compliance | fatf-gafi.org/en/countries/black-and-grey-lists | Tri-annually (Feb, Jun, Oct) |
| OFAC | Sanctions lists, SDN entries, general licenses | ofac.treasury.gov | Bi-monthly or as updated |
| AS/COA | Election calendar, political analysis | as-coa.org | Continuous |
| Georgetown SIGLA | Electoral data, political indicators | sigla.georgetown.domains | Continuous |
| InSight Crime | Homicide rates, organized crime analysis | insightcrime.org | Quarterly |
| World Bank B-READY | Business environment, regulatory quality | worldbank.org/en/businessready | Annually |
| ECLAC | Trade data, tariff analysis | cepal.org | Annually |
| National tax authorities | Tax rates, reform details, compliance rules | Various (SAT, DIAN, Receita, SII, etc.) | As updated |

---

*End of document. This intelligence brief should be refreshed quarterly or upon any major
political event (election, coup, sanctions change, FATF plenary). The TypeScript
implementation should be deployed as `politicalRiskTools.ts` in `kitz_os/src/tools/` and
registered in `registry.ts`.*
