# Employment Law Intelligence for LatAm SMBs

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Audience:** Kitz platform -- AI agents and SMB owners
**Scope:** 10 major LatAm markets -- employment law, mandatory benefits, hiring costs, severance

> **Disclaimer:** This document provides general guidance based on publicly available legal
> information. Labor laws change frequently. Always consult local legal counsel before making
> employment decisions. Rates and figures reflect 2025-2026 data as of the document date.

---

## Table of Contents

1. [Cross-Country Comparison Tables](#cross-country-comparison-tables)
2. [Mexico](#1-mexico)
3. [Colombia](#2-colombia)
4. [Brazil](#3-brazil)
5. [Argentina](#4-argentina)
6. [Chile](#5-chile)
7. [Peru](#6-peru)
8. [Panama](#7-panama)
9. [Costa Rica](#8-costa-rica)
10. [Ecuador](#9-ecuador)
11. [Dominican Republic](#10-dominican-republic)
12. [Contractor vs Employee Classification](#contractor-vs-employee-classification)
13. [TypeScript Implementation: Employer Cost Calculator](#typescript-implementation)
14. [TypeScript Implementation: Severance Calculator](#severance-calculator)

---

## Cross-Country Comparison Tables

### Minimum Wages (2025-2026)

| Country            | Local Currency (Monthly)       | Approx. USD/Month | Effective Date |
|--------------------|--------------------------------|--------------------|----------------|
| Mexico             | MXN $9,451 (general zone)      | ~$475              | Jan 2026       |
| Colombia           | COP $1,423,500 (+$200k transp) | ~$340              | Jan 2025       |
| Brazil             | BRL R$1,518 (federal)          | ~$262              | Jan 2025       |
| Argentina          | ARS $313,400                   | ~$287              | Jun 2025       |
| Chile              | CLP $539,000                   | ~$548              | Jan 2026       |
| Peru               | PEN S/1,130                    | ~$305              | Jan 2025       |
| Panama             | USD $326 - $971 (by sector)    | $326 - $971        | Varies         |
| Costa Rica         | CRC 367,108 (unskilled)       | ~$700              | Jan 2025       |
| Ecuador            | USD $482                       | $482               | Jan 2026       |
| Dominican Republic | DOP $15,860 - $27,989 (by size)| ~$270 - $475       | Apr 2025       |

> **Note on Argentina:** USD conversions are approximate due to multiple exchange rates.
> Panama and Ecuador use USD as legal tender.

### Total Employer Cost as % Above Gross Salary

| Country            | Social Security | Mandatory Bonuses | Other Provisions | Total Employer Burden |
|--------------------|-----------------|-------------------|------------------|-----------------------|
| Mexico             | ~25-35%         | ~10-12%           | ~5% (INFONAVIT)  | **40-52%**            |
| Colombia           | ~22-25%         | ~18-20%           | ~9% (parafiscal) | **50-58%**            |
| Brazil             | ~28-31%         | ~11-14%           | ~8% (FGTS)       | **68-80%**            |
| Argentina          | ~27-30%         | ~8-10%            | ~3%              | **38-45%**            |
| Chile              | ~5-7%           | ~8-10%            | ~2%              | **15-20%**            |
| Peru               | ~9%             | ~17-18%           | ~8% (CTS)        | **35-40%**            |
| Panama             | ~13-15%         | ~8-10%            | ~3%              | **25-30%**            |
| Costa Rica         | ~27%            | ~8-9%             | ~3%              | **38-42%**            |
| Ecuador            | ~12%            | ~17-18%           | ~8% (reserve)    | **38-45%**            |
| Dominican Republic | ~16-17%         | ~8-10%            | ~3%              | **28-32%**            |

### Vacation Days by Seniority

| Country            | Year 1   | Year 2   | Year 5    | Year 10   |
|--------------------|----------|----------|-----------|-----------|
| Mexico             | 12 days  | 14 days  | 20 days   | 22 days   |
| Colombia           | 15 days  | 15 days  | 15 days   | 15 days   |
| Brazil             | 30 days  | 30 days  | 30 days   | 30 days   |
| Argentina          | 14 days  | 14 days  | 21 days   | 28 days   |
| Chile              | 15 days  | 15 days  | 15 days   | 15 days   |
| Peru               | 30 days  | 30 days  | 30 days   | 30 days   |
| Panama             | 30 days  | 30 days  | 30 days   | 30 days   |
| Costa Rica         | 14 days  | 14 days  | 14 days   | 14 days   |
| Ecuador            | 15 days  | 16 days  | 20 days   | 25 days   |
| Dominican Republic | 14 days  | 14 days  | 14 days   | 18 days   |

### Mandatory Annual Bonuses

| Country            | Bonus Name(s)                     | Total Amount             |
|--------------------|-----------------------------------|--------------------------|
| Mexico             | Aguinaldo + Prima Vacacional      | 15 days + 25% of vac pay|
| Colombia           | Prima + Cesantias + Interest      | ~2.12 months/year        |
| Brazil             | 13 Salario + Ferias bonus (1/3)   | ~1.33 months/year        |
| Argentina          | SAC (Aguinaldo)                   | 1 month/year             |
| Chile              | Gratificacion                     | Up to 4.75 months/year   |
| Peru               | Gratificaciones (x2) + Bonif.     | ~2.18 months/year        |
| Panama             | Decimo Tercer Mes                 | 1 month/year             |
| Costa Rica         | Aguinaldo                         | 1 month/year             |
| Ecuador            | Decimo 3ro + Decimo 4to           | ~1.97 months/year        |
| Dominican Republic | Salario de Navidad                | 1 month/year             |

### Social Security Rates (Employer + Employee)

| Country            | Employer %    | Employee %  | Total %     |
|--------------------|---------------|-------------|-------------|
| Mexico             | 25-35%        | 3-5%        | 28-40%      |
| Colombia           | 22-25%        | 8%          | 30-33%      |
| Brazil             | 28-31%        | 7.5-14%     | 35.5-45%    |
| Argentina          | 27-30%        | 17%         | 44-47%      |
| Chile              | 5-7%          | 18-20%      | 23-27%      |
| Peru               | 9%            | 13%         | 22%         |
| Panama             | 13-15%        | 9.25%       | 22-24%      |
| Costa Rica         | 26.67%        | 10.67%      | 37.34%      |
| Ecuador            | 12.15%        | 9.45%       | 21.60%      |
| Dominican Republic | 16-17%        | 5.91%       | 22-23%      |

### Termination Costs (Without Cause, 5 Years of Service)

| Country            | Approximate Severance (months of salary) |
|--------------------|------------------------------------------|
| Mexico             | ~6.3 months (3 const. + 20d x 5yr)      |
| Colombia           | ~5.0 months (30d yr1 + 20d yrs 2-5)     |
| Brazil             | ~4.0 months (40% of FGTS balance)       |
| Argentina          | ~5.0 months (1 month per year)           |
| Chile              | ~5.0 months (1 month per year, cap 11)   |
| Peru               | ~4.2 months (1.5 salary x years/12)     |
| Panama             | ~3.6 months (varies by tenure)           |
| Costa Rica         | ~4.7 months (sliding scale, cap 8)       |
| Ecuador            | ~4.2 months (25% salary x years + 3mo)  |
| Dominican Republic | ~3.5 months (21 days x 5 years)          |

---

## 1. Mexico

**Governing law:** Ley Federal del Trabajo (LFT)
**Key institutions:** IMSS, INFONAVIT, SAT, CONASAMI, STPS

### 1.1 Minimum Wage (2026)

- **General Zone:** MXN $315.04/day = MXN ~$9,451/month
- **Free Zone of the Northern Border (ZLFN):** MXN $440.87/day = MXN ~$13,226/month
- Adjusted annually by CONASAMI; 2026 represents a ~13% increase over 2025
- Professional minimum wages apply to ~61 specific occupations

### 1.2 Working Hours

| Shift Type | Hours/Day | Hours/Week | Overtime Rate         |
|------------|-----------|------------|-----------------------|
| Day        | 8         | 48         | 200% first 9hrs/week  |
| Night      | 7         | 42         | 300% beyond 9hrs/week |
| Mixed      | 7.5       | 45         | Same as above          |

- Maximum overtime: 3 hours/day, no more than 3 consecutive days/week
- First 9 overtime hours/week: paid at 200% (double time)
- Beyond 9 overtime hours/week: paid at 300% (triple time)
- Sundays worked: 25% premium (prima dominical)
- Proposed 40-hour workweek reform may take effect in 2027

### 1.3 Mandatory Benefits

#### Vacation (Post-2023 Reform)

| Years of Service | Vacation Days |
|------------------|---------------|
| 1                | 12            |
| 2                | 14            |
| 3                | 16            |
| 4                | 18            |
| 5                | 20            |
| 6-10             | 22            |
| 11-15            | 24            |
| 16-20            | 26            |
| 21-25            | 28            |
| 26-30            | 30            |
| 31-35            | 32            |

- **Prima Vacacional:** At least 25% of salary for vacation days
- Vacation must be granted within 6 months of completing each year of service

#### Aguinaldo (Christmas Bonus)

- Minimum 15 days of salary, paid by December 20
- Prorated for employees who have not completed a full year
- Calculated on base salary (not integrated salary)

#### Social Security (IMSS) -- Employer Contributions

| Concept                                   | Employer %   | Employee % |
|-------------------------------------------|-------------|------------|
| Enfermedades y Maternidad (fixed)         | 20.40%*     | 0%         |
| Enfermedades y Maternidad (excess)        | 1.10%       | 0.40%      |
| Gastos Medicos Pensionados                | 1.05%       | 0.375%     |
| Invalidez y Vida                          | 1.75%       | 0.625%     |
| Retiro (SAR)                              | 2.00%       | 0%         |
| Cesantia en Edad Avanzada y Vejez (2025)  | ~5.15-6.42% | 1.125%     |
| Riesgo de Trabajo                         | 0.50-7.59%  | 0%         |
| Guarderias                                | 1.00%       | 0%         |

*Fixed quota over UMA, not percentage of salary.

> The Cesantia en Edad Avanzada y Vejez (CEAV) employer rate increases
> annually under the 2020 pension reform, reaching 11.87% by 2030. The rate
> varies by salary band measured in UMA multiples.

- **INFONAVIT (Housing):** Employer pays 5% of salary
- **State Payroll Tax:** 2-3% depending on state (e.g., Mexico City = 3%)
- **Total employer burden:** Approximately 30-40% above gross salary

#### Profit Sharing (PTU)

- Companies must distribute 10% of pre-tax profits to employees
- Paid annually by May 30
- Cap: maximum of 3 months salary or the average of the last 3 years' PTU (whichever is higher)
- Exemptions: new companies (first year), INFONAVIT, certain non-profits
- Post-2021 outsourcing reform significantly expanded PTU obligations

### 1.4 Hiring Requirements

- **Contract types:** Indefinite (default), fixed-term (seasonal/specific project), probation
- **Probation period:** Up to 30 days (180 days for management/technical roles)
- **Written contract required** -- if none exists, the law presumes the relationship in favor of the worker
- Must register employees with IMSS within 5 business days of hire
- INFONAVIT and SAR registration is automatic through IMSS

### 1.5 Termination Rules

#### Just Cause (Rescision)

- Must be documented and notified to the employee in writing
- Causes defined in Article 47 of LFT (dishonesty, violence, negligence, etc.)
- Employee receives only: prorated aguinaldo, prorated vacation + prima, pending wages

#### Without Cause (Despido Injustificado)

**Severance formula (Liquidacion):**

```
Severance = Constitutional Indemnity (3 months salary)
          + Seniority Premium (20 days salary per year of service)
          + Prorated Aguinaldo
          + Prorated Vacation + Prima Vacacional
          + Any pending wages
```

- Salary used: Daily Integrated Salary (SDI), which includes base + proportional bonuses
- Seniority Premium (Prima de Antiguedad): 12 days per year, capped at 2x minimum wage/day
  (paid on any separation after 15+ years, or on unjustified dismissal regardless of tenure)

### 1.6 Contractor vs Employee

- **2021 Outsourcing Reform** (Subcontratacion): Virtually eliminated traditional outsourcing
- Companies cannot subcontract personnel for their core business activities
- Specialized services allowed only with REPSE registry (Registro de Prestadoras de Servicios Especializados)
- Misclassification risk: IMSS back-contributions + fines + criminal liability
- Independent contractors must have genuine autonomy, own tools, serve multiple clients
- The SAT and IMSS actively audit contractor relationships

### 1.7 Special Protections

- **Maternity leave:** 12 weeks (6 before + 6 after birth), paid by IMSS at 100% (capped at 25x UMA)
- **Paternity leave:** 5 working days, paid by employer
- **Adoption leave:** 6 weeks
- **Nursing breaks:** 2 x 30-minute breaks daily for 6 months post-birth
- **Disability:** Employer cannot terminate for work-related disability; IMSS covers incapacity
- **Anti-discrimination:** NOM-035 (psychosocial risk), anti-harassment protocols mandatory
- **Union rights:** Freedom of association; collective bargaining agreements common; annual proof of legitimacy required

---

## 2. Colombia

**Governing law:** Codigo Sustantivo del Trabajo (CST)
**Key institutions:** EPS, ARL, AFP, Cajas de Compensacion, SENA, ICBF

### 2.1 Minimum Wage (2025)

- **SMMLV:** COP $1,423,500/month
- **Transport Allowance:** COP $200,000/month (mandatory for employees earning up to 2x SMMLV)
- 9.50% increase over 2024

### 2.2 Working Hours

- **Standard week:** 46 hours (as of July 2025: 44 hours; July 2026: 42 hours -- gradual reduction)
- **Overtime:** 125% for daytime overtime; 175% for nighttime overtime
- **Night shift:** 135% surcharge (9 PM to 6 AM)
- **Sundays/holidays:** 175% surcharge; if habitual (3+ Sundays/month), additional compensatory rest

### 2.3 Mandatory Benefits

#### Vacation

- 15 business days per year of service
- Can be accumulated up to 2 years (4 years for technical/managerial roles)
- May be partially compensated in cash (up to 50%)

#### Prima de Servicios (Service Bonus)

- 1 month salary per year, paid in two installments:
  - First half: by June 30
  - Second half: by December 20
- Includes transport allowance in the calculation base

#### Cesantias (Severance Savings)

- 1 month salary per year (prorated), deposited into employee's chosen severance fund by February 14
- Calculated as of December 31 each year
- Employee can withdraw for housing or education

#### Intereses sobre Cesantias (Interest on Severance)

- 12% annual interest on the cesantias balance
- Paid directly to employee by January 31

#### Dotacion (Work Clothing)

- Employees earning up to 2x SMMLV who have worked 3+ months receive uniforms/shoes
- 3 times per year (April, August, December)

### 2.4 Social Security Contributions

| Concept                    | Employer %  | Employee % |
|----------------------------|-------------|------------|
| Pension (AFP)              | 12%         | 4%         |
| Health (EPS)               | 8.5%        | 4%         |
| Occupational Risk (ARL)    | 0.522-6.96%| 0%         |
| SENA                       | 2%          | 0%         |
| ICBF                       | 3%          | 0%         |
| Caja de Compensacion       | 4%          | 0%         |

- SENA and ICBF contributions exempt for employees earning <10x SMMLV if covered by CREE tax
- **Total employer contributions:** ~30-35% of gross salary (before bonuses)
- **Total employer burden with all benefits:** ~50-58% above gross salary

### 2.5 Hiring Requirements

- **Contract types:** Indefinite (default), fixed-term (max 3 years), project-based, learning contract
- **Probation period:** 2 months (indefinite contracts), up to 1/5 of contract length (fixed-term)
- Written contracts recommended; indefinite assumed if not documented
- Registration with EPS, AFP, ARL, and Caja de Compensacion required before work begins

### 2.6 Termination Rules

#### Just Cause

- Defined in Articles 62-63 of CST
- Must follow due process (descargos hearing)
- Employee receives prorated benefits but no indemnizacion

#### Without Cause -- Severance (Indemnizacion)

**For indefinite contracts:**
- 1-10 years: 30 days salary for year 1, then 20 days per additional year
- 10+ years: 45 days salary for year 1, then 40 days per additional year

**For fixed-term contracts:**
- Remaining salary through end of contract (minimum 15 days)

**Liquidacion (final settlement) always includes:**
- Prorated prima de servicios
- Prorated cesantias + interest
- Prorated vacation
- Pending wages

### 2.7 Contractor vs Employee

- Contractors (prestacion de servicios) must be genuinely independent
- Key indicators: control of schedule, own tools, serves multiple clients, bears own risk
- Law 221 of 2021 strengthened protections for gig/dependent contractors
- Misclassification penalty: retroactive payment of all benefits, social security, fines
- Common red flags: fixed schedule, exclusive dedication, company-provided tools

### 2.8 Special Protections

- **Maternity leave:** 18 weeks (paid, 1 week before + 17 after; flexible distribution possible)
- **Paternity leave:** 2 weeks (paid by EPS)
- **Fuero de maternidad:** Cannot terminate pregnant employees or during lactation (up to 6 months post-birth) without judicial authorization
- **Disability:** Stability reinforcement (estabilidad laboral reforzada) protects employees with health conditions
- **Unions:** Freedom of association; collective bargaining rights; fuero sindical (union member protection)
- **Anti-discrimination:** Law 1010 of 2006 (workplace harassment); Law 1482 of 2011 (discrimination)

---

## 3. Brazil

**Governing law:** CLT (Consolidacao das Leis do Trabalho)
**Key institutions:** INSS, FGTS, eSocial, CAGED, Ministerio do Trabalho

### 3.1 Minimum Wage (2025)

- **Federal minimum:** BRL R$1,518/month (~USD $262)
- States may set higher minimums (e.g., Sao Paulo, Rio de Janeiro, Parana)
- 2026 increase to R$1,626 (effective January 1, 2026)

### 3.2 Working Hours

- **Standard:** 8 hours/day, 44 hours/week (220 hours/month)
- **Overtime:** Maximum 2 hours/day; paid at minimum 150% (50% premium)
- **Sundays/holidays:** 200% (100% premium)
- **Banco de horas (time bank):** Can be negotiated individually (6-month offset) or collectively (12-month offset)
- Night shift (10 PM - 5 AM): 20% premium; night hour = 52.5 minutes

### 3.3 Mandatory Benefits

#### Ferias (Vacation)

- 30 calendar days per year after 12 months of service
- Can be split into up to 3 periods (one must be at least 14 days)
- **Vacation bonus (Abono de Ferias):** 1/3 of monthly salary (terco constitucional), paid on top of vacation pay
- Employee can sell up to 10 days back to employer (abono pecuniario)

#### 13 Salario (13th Month Salary)

- 1 full monthly salary per year
- Paid in 2 installments: 1st by November 30 (50%), 2nd by December 20 (50%)
- Prorated for partial years
- Subject to INSS and FGTS contributions

#### Vale-Transporte (Transportation Voucher)

- Mandatory for commuting costs; employer can deduct up to 6% of employee's base salary
- Employer pays the remainder of actual transport costs

#### Vale-Refeicao / Vale-Alimentacao (Meal/Food Voucher)

- Not legally mandatory but extremely common (often required by collective agreements)
- Tax-deductible for employer under PAT program

### 3.4 Social Security and Payroll Contributions

| Concept                          | Employer %    | Employee %    |
|----------------------------------|---------------|---------------|
| INSS (Social Security)           | 20%           | 7.5-14%*      |
| FGTS (Severance Fund)            | 8%            | 0%            |
| RAT (Work Accident Insurance)    | 1-3%          | 0%            |
| Third parties (S System)         | ~3.3%         | 0%            |
| Salario Educacao                 | 2.5%          | 0%            |
| INCRA                            | 0.2%          | 0%            |

*Employee INSS is progressive: 7.5% (up to R$1,518), 9% (R$1,518-R$2,427), 12% (R$2,427-R$3,641), 14% (R$3,641-R$7,087)

- **Total employer payroll burden:** ~35-40% of gross salary (contributions only)
- **Total cost including 13th salary, vacation bonus, FGTS:** ~68-80% above gross salary
- Companies under Simples Nacional have reduced rates

### 3.5 Hiring Requirements

- **Contract types:** Indefinite (CLT), fixed-term (max 2 years), temporary (180 days + 90 extension), intermittent
- **Probation period (experiencia):** Up to 90 days (can be single 90-day or two periods totaling 90 days)
- Registration on eSocial mandatory before first day of work
- CTPS (Carteira de Trabalho) digital registration required
- Admissional medical exam required

### 3.6 Termination Rules

#### Just Cause (Justa Causa) -- Art. 482 CLT

- 13 specific causes (dishonesty, insubordination, habitual drunkenness, etc.)
- Employee loses: FGTS withdrawal rights, 40% FGTS penalty, notice period pay
- Employee receives only: pending wages, prorated vacation + 1/3

#### Without Cause (Sem Justa Causa)

**Severance includes:**
- 30 days advance notice (aviso previo) + 3 days per year of service (capped at 90 days total)
- 40% penalty on total FGTS balance (paid by employer to FGTS account)
- Prorated 13th salary
- Prorated vacation + 1/3
- Right to withdraw full FGTS balance
- Seguro-desemprego (unemployment insurance) eligibility

#### Mutual Agreement (Rescisao por Acordo) -- Art. 484-A CLT

- Aviso previo: 50% (15 days)
- FGTS penalty: 20% (instead of 40%)
- Withdrawal of 80% of FGTS balance
- No unemployment insurance

### 3.7 Contractor vs Employee

- CLT presumes employment relationship when: habitualidade (regularity), subordinacao (subordination), onerosidade (payment), pessoalidade (personal service)
- PJ (Pessoa Juridica) arrangements are extremely common -- and extremely risky
- "Pejotizacao" (forcing employees to open PJ) is heavily penalized
- Workers can file labor claims free of charge; courts strongly favor employee classification
- Misclassification: retroactive CLT benefits + FGTS + INSS + fines + moral damages
- MEI (Microempreendedor Individual) status does not protect against reclassification

### 3.8 Special Protections

- **Maternity leave:** 120 days paid (180 days under Empresa Cidada program)
- **Paternity leave:** 5 days (20 days under Empresa Cidada)
- **Estabilidade gestante:** Cannot terminate from pregnancy confirmation until 5 months after birth
- **CIPA stability:** Workplace safety committee members have 1 year post-term protection
- **Disability:** Employees returning from INSS disability have 12 months of job stability
- **Unions:** Mandatory representation by category; collective agreements override CLT in many areas
- **Anti-discrimination:** Law 9.029/95 prohibits discrimination in hiring/employment

---

## 4. Argentina

**Governing law:** Ley de Contrato de Trabajo (LCT) No. 20.744
**Key institutions:** ANSES, AFIP, Superintendencia de Riesgos del Trabajo, Obras Sociales

### 4.1 Minimum Wage (2025-2026)

- **SMVM (Salario Minimo Vital y Movil):** ARS $313,400/month (June 2025)
- Adjusted periodically by the Consejo Nacional del Empleo
- Rates change frequently due to inflation; always verify current rate

### 4.2 Working Hours

- **Standard:** 8 hours/day, 48 hours/week
- **Night shift (9 PM - 6 AM):** 7 hours/day
- **Mixed shift:** 7.5 hours/day
- **Overtime:** 150% on weekdays; 200% on Saturdays (after 1 PM), Sundays, and holidays
- Maximum: 3 hours/day, 30 hours/month, 200 hours/year

### 4.3 Mandatory Benefits

#### Vacation (Vacaciones)

| Seniority         | Calendar Days |
|-------------------|---------------|
| Up to 5 years     | 14            |
| 5-10 years        | 21            |
| 10-20 years       | 28            |
| 20+ years         | 35            |

- Must be taken between October 1 and April 30
- Employer must provide at least 45 days advance notice

#### SAC / Aguinaldo (13th Month Salary)

- 1 full month salary per year
- Paid in 2 installments:
  - First: by June 30
  - Second: by December 18
- Each installment = 50% of the highest monthly gross salary earned in that semester

#### Social Security Contributions

| Concept                        | Employer %   | Employee % |
|--------------------------------|-------------|------------|
| Jubilacion (Pension)           | 10.17%      | 11%        |
| INSSJP (Elderly healthcare)    | 1.50%       | 3%         |
| Obra Social (Health)           | 6.00%       | 3%         |
| Asignaciones Familiares        | 4.44%       | 0%         |
| Fondo Nacional de Empleo       | 0.89%       | 0%         |
| ART (Labor Risk Insurance)     | ~2.41%      | 0%         |
| Life Insurance                 | ~0.50%      | 0%         |

- **Total employer contribution:** ~26-30% of gross salary
- **Total employer burden with SAC and provisions:** ~38-45% above gross salary

### 4.4 Hiring Requirements

- **Contract types:** Indefinite (default and preferred by law), fixed-term, seasonal, part-time, eventual
- **Probation period:** 3 months (first 3 months of any indefinite contract)
- During probation, employer can terminate without severance but must give 15 days notice
- Registration with AFIP (Alta Temprana) mandatory before first day of work
- Medical pre-employment exam required

### 4.5 Termination Rules

#### Just Cause (Con Justa Causa)

- Must be communicated in writing with detailed reasons
- No severance, but all accrued benefits must be paid

#### Without Cause (Sin Causa)

**Indemnizacion por Antiguedad (Art. 245 LCT):**

```
Severance = Best Monthly Salary x Years of Service
```

- "Best monthly, normal, and habitual salary" of the last 12 months
- Minimum: 1 month salary (even for <1 year of service after probation)
- Cap per year: 3x the average CBA (collective bargaining agreement) salary for the category
- **Preaviso (Notice period):**
  - During probation: 15 days
  - Up to 5 years: 1 month
  - 5+ years: 2 months
  - If not provided, employer must pay equivalent salary (Indemnizacion Sustitutiva de Preaviso)
- **Integracion del mes de despido:** If termination is mid-month, employer pays through month-end

### 4.6 Contractor vs Employee

- "Monotributista" (simplified tax regime) arrangements are common
- Courts will reclassify if: fixed schedule, single client, employer tools, subordination
- Penalties: retroactive registration, full labor benefits, social security contributions + interest + fines
- Recent 2025 labor reform discussions may adjust classification criteria

### 4.7 Special Protections

- **Maternity leave:** 90 days (typically 45 before + 45 after birth), paid by ANSES
- **Paternity leave:** 2 days (many CBAs extend this)
- **Excedencia:** After maternity, employee can take 3-6 months unpaid leave
- **Estabilidad por matrimonio/embarazo:** Cannot terminate 7.5 months before/after marriage or during pregnancy + 7.5 months post-birth; penalty = 13 months salary
- **Disability:** 3-12 months paid sick leave depending on seniority and dependents
- **Unions:** Extremely strong in Argentina; collective bargaining agreements (CCT) override individual contracts
- **Anti-discrimination:** Law 23.592; workplace violence law (Ley Micaela)

---

## 5. Chile

**Governing law:** Codigo del Trabajo
**Key institutions:** AFP (pension), FONASA/ISAPRE (health), AFC (unemployment), Mutuales

### 5.1 Minimum Wage (2026)

- **Standard (18-65):** CLP $539,000/month (~USD $548)
- **Under 18 / Over 65:** CLP $394,622/month
- Increased from CLP $529,000 (May 2025)

### 5.2 Working Hours

- **Standard:** 45 hours/week (maximum 10 hours/day)
- **Overtime:** 50% premium; max 2 hours/day; requires written agreement
- Overtime must be paid within the same pay period
- No mandatory Sunday rest for all sectors; rotation schedules common in commerce

### 5.3 Mandatory Benefits

#### Vacation (Feriado Anual)

- 15 working days per year after 1 year of service
- Additional "progressive vacation": 1 extra day per every 3 years with same or different employers (after 10 total years in workforce)
- Can accumulate up to 2 years

#### Gratificacion (Profit Sharing)

Two calculation methods (employer chooses):
1. **Article 47:** 30% of net profits distributed proportionally (capped at 4.75 monthly minimum wages per employee)
2. **Article 50:** Pay 25% of annual salary (capped at 4.75 monthly minimum wages). Most employers choose this option as it provides certainty.

#### Social Security Contributions

| Concept                          | Employer %    | Employee %     |
|----------------------------------|---------------|----------------|
| AFP (Pension)                    | 0%*           | ~10% + 0.5-1.5% commission |
| Health (FONASA/ISAPRE)           | 0%*           | 7%             |
| Unemployment Insurance (AFC)     | 2.4%          | 0.6%           |
| Workplace Accident (Mutual)      | 0.95%+        | 0%             |
| SIS (Disability/Life Insurance)  | 1.41-1.88%    | 0%             |
| Additional Pension (2025+)       | 1-1.5%**      | 0%             |

*Chile is unique: pension and health are primarily employee-funded
**New employer pension contribution phasing in from Aug 2025, reaching 7% by 2033

- **Total employer contribution:** ~5-7% of gross (rising to ~12% by 2033)
- **Total employer burden with gratificacion + provisions:** ~15-20% above gross (rising)

### 5.4 Hiring Requirements

- **Contract types:** Indefinite, fixed-term (max 1 year, 2 years for managers/professionals), per-project
- **Probation:** No formal probation period in Chilean law (use fixed-term contracts instead)
- Written contract required within 15 days of start (5 days for contracts <30 days)
- Registration with AFP and health provider mandatory

### 5.5 Termination Rules

#### Just Cause (Causal) -- Art. 160

- 7 specific causes (serious misconduct, negligent damage, unjustified absences, etc.)
- No severance; prorated vacation and pending wages only

#### Needs of the Company (Necesidades de la Empresa) -- Art. 161

**Indemnizacion por Anos de Servicio:**

```
Severance = Monthly Salary x Years of Service
(capped at 11 months; salary capped at 90 UF/month)
```

- 1 month salary per year of service (fractions >6 months round up)
- Maximum: 11 months (for employees with 11+ years)
- Monthly salary cap: 90 UF (~CLP $3.5M)
- Plus 30 days advance notice (or pay in lieu)
- **Seguro de Cesantia (Unemployment Insurance):** Separate from severance; employee can access AFC funds

#### Mutual Agreement

- Employee can access individual AFC account balance

### 5.6 Contractor vs Employee

- "Boleta de honorarios" (fee receipt) contractors are common
- Courts evaluate: subordination and dependency as key factors
- Misclassification: retroactive employment relationship + all benefits + contributions
- "Articulo 22" (exemption from hour limits) does not create contractor status -- it applies to specific employees

### 5.7 Special Protections

- **Maternity leave:** 6 weeks prenatal + 12 weeks postnatal (18 weeks total); paid by State (ISAPRE/FONASA subsidy)
- **Postnatal parental:** Additional 12 weeks (full-time) or 18 weeks (part-time); can transfer up to 6 weeks to father
- **Paternity leave:** 5 days paid
- **Fuero maternal:** Cannot terminate from pregnancy until 1 year after maternity leave ends
- **Nursing break:** 1 hour/day for feeding until child is 2 years old
- **Disability:** Job stability during sick leave; cannot terminate while on medical leave
- **Unions:** Collective bargaining with right to strike; fuero sindical protections

---

## 6. Peru

**Governing law:** DL 728 (Ley de Productividad y Competitividad Laboral)
**Key institutions:** ESSALUD, AFP/ONP, SUNAFIL, MTPE

### 6.1 Minimum Wage (2025)

- **RMV (Remuneracion Minima Vital):** PEN S/1,130/month (~USD $305)
- No differentiation by region or sector

### 6.2 Working Hours

- **Standard:** 8 hours/day, 48 hours/week
- **Overtime:** 125% for first 2 hours; 135% beyond 2 hours
- Night shift (10 PM - 6 AM): 35% premium
- Mandatory weekly rest: 24 consecutive hours (typically Sunday)

### 6.3 Mandatory Benefits

#### Vacation

- 30 calendar days per year after 1 year of service
- At least 15 consecutive days must be taken
- Can sell up to 15 days back to employer (compensacion vacacional)
- Unused vacation: employer must pay triple (regular pay + penalty + vacation pay)

#### Gratificaciones (Bonuses)

- 2 extra monthly salaries per year:
  - **Fiestas Patrias:** Paid in July
  - **Navidad:** Paid in December
- Each = 1 full monthly salary (prorated if <6 months in the period)
- **Bonificacion Extraordinaria:** Additional 9% of each gratificacion (replaces employer ESSALUD contribution on the bonus)

#### CTS (Compensacion por Tiempo de Servicios)

- Employer deposits equivalent of approximately 1 month salary per year into employee's bank account
- Paid in 2 installments:
  - By May 15 (for Nov-April period)
  - By November 15 (for May-October period)
- Acts as a savings/severance cushion
- Employee can withdraw amounts exceeding 4x RMV

#### Asignacion Familiar

- PEN S/113/month (10% of RMV) for employees with minor children
- Paid monthly by employer regardless of number of children

### 6.4 Social Security Contributions

| Concept                    | Employer %  | Employee %   |
|----------------------------|-------------|--------------|
| ESSALUD (Health)           | 9%          | 0%           |
| Pension (AFP)              | 0%          | ~13%*        |
| Pension (ONP, if chosen)   | 0%          | 13%          |
| SCTR (High-risk sectors)   | ~1.5%       | 0%           |

*AFP employee rate: 10% + commission (~1.5-2%) + insurance (~1.5%)

- **Total employer contribution:** ~9-10.5% of gross salary
- **Total employer burden with CTS, gratificaciones, vacation:** ~35-40% above gross salary

### 6.5 Hiring Requirements

- **Contract types:** Indefinite (default), fixed-term (must justify with specific cause, max 5 years), part-time
- **Probation period:** 3 months (6 months for qualified/trust positions; 12 months for directors)
- Written contract required for fixed-term; indefinite can be verbal (but written recommended)
- Registration with ESSALUD (T-Registro) before first day

### 6.6 Termination Rules

#### Just Cause

- Must follow pre-termination process (carta de preaviso + 6 days to respond)
- Causes: serious misconduct, criminal conviction, disability (if no reassignment possible)

#### Without Cause (Despido Arbitrario)

**Indemnizacion:**
- For indefinite contracts: 1.5 monthly salaries per year of service (capped at 12 months)
- For fixed-term contracts: 1.5 monthly salaries per month remaining on contract (capped at 12 months)

**Final settlement includes:**
- Prorated CTS
- Prorated gratificaciones + 9% bonus
- Prorated vacation (or triple if untaken)
- Certificate of employment

### 6.7 Contractor vs Employee

- "Locacion de servicios" (service agreements) for genuine contractors
- SUNAFIL inspects for: subordination, fixed schedule, exclusive dedication, integration into business
- Misclassification: retroactive employment relationship + full benefits + fines
- Peru has a large informal economy; formalization incentives exist for micro/small businesses

### 6.8 Special Protections

- **Maternity leave:** 98 days (49 pre + 49 post, flexible); paid by ESSALUD
- **Paternity leave:** 10 days (20 for complicated births)
- **Lactation break:** 1 hour/day until child is 1 year old
- **Disability:** Cannot terminate during medical leave
- **Anti-discrimination:** Law 30709 (equal pay); Law 29973 (disability)
- **Unions:** Freedom of association; collective bargaining protected; 3% of workers needed to form a union

---

## 7. Panama

**Governing law:** Codigo de Trabajo
**Key institutions:** CSS (Caja de Seguro Social), MITRADEL

### 7.1 Minimum Wage (2025)

- Varies by region and economic activity
- **Region 1 (urban):** USD $340-$971/month depending on sector
- **Region 2 (rural):** USD $315-$600/month depending on sector
- Panama uses USD as legal currency -- no exchange rate risk

### 7.2 Working Hours

- **Standard:** 8 hours/day, 48 hours/week
- **Night shift:** 7 hours/day, 42 hours/week
- **Mixed:** 7.5 hours/day, 45 hours/week
- **Overtime:** 125% for daytime; 150% for nighttime; 175% on Sundays/holidays
- Maximum: 3 overtime hours/day, 9 hours/week

### 7.3 Mandatory Benefits

#### Vacation

- 30 days per year (for every 11 months of continuous service)
- Must be taken consecutively (unless otherwise agreed)
- Cash compensation allowed for unused vacation at termination

#### Decimo Tercer Mes (13th Month)

- 1 month salary per year, paid in 3 installments:
  - April 15 (for Dec-Mar period)
  - August 15 (for Apr-Jul period)
  - December 15 (for Aug-Nov period)
- Based on total regular earnings in each 4-month period

### 7.4 Social Security Contributions (CSS)

| Concept                    | Employer %    | Employee %  |
|----------------------------|---------------|-------------|
| CSS (Social Security)      | 12.25%        | 9.75%       |
| Educational Insurance      | 1.50%         | 1.25%       |
| Occupational Risk          | varies        | 0%          |

- Under Law 462 (phased increases): employer CSS rate increasing gradually to ~14.25% by 2028
- **Total employer contribution:** ~13-15% of gross salary
- **Total employer burden with 13th month + severance provisions:** ~25-30% above gross salary

### 7.5 Hiring Requirements

- **Contract types:** Indefinite, fixed-term (max 1 year), project-based
- **Probation period:** Up to 3 months (or as specified in contract, cannot exceed this)
- Written contract required; must be registered with MITRADEL
- Foreign workers: work permit required; 90/10 rule (90% local / 10% foreign) for most sectors

### 7.6 Termination Rules

#### Just Cause

- Defined in Article 213 of Codigo de Trabajo
- No severance; prorated benefits only

#### Without Cause

**Prima de Antiguedad (Seniority Premium):**
- 1 week of salary per year of service (from year 2 onwards)
- No cap

**Indemnizacion:**
- 3.4 weeks of salary per year of service
- Capped at the equivalent of the employee's total salary for the remaining term of the contract (fixed-term) or calculated based on actual service years

**Additional payments:**
- 30 days advance notice (or pay in lieu)
- Prorated 13th month
- Prorated vacation

### 7.7 Special Protections

- **Maternity leave:** 14 weeks (6 prenatal + 8 postnatal); paid by CSS
- **Paternity leave:** Not mandatory by law (some companies offer voluntarily)
- **Fuero de maternidad:** Cannot terminate from pregnancy notification until 1 year after return
- **Disability:** CSS covers temporary disability; employer must hold position
- **Unions:** Legal right to organize; collective bargaining protected
- **Anti-discrimination:** Constitutional protections; Law 11 of 2005

---

## 8. Costa Rica

**Governing law:** Codigo de Trabajo
**Key institutions:** CCSS (Caja Costarricense de Seguro Social), INS, INA, MTSS

### 8.1 Minimum Wage (2025)

- Varies by occupation category:
  - **Unskilled worker:** CRC 367,108/month (~USD $700)
  - **Semi-skilled worker:** CRC 395,000/month
  - **Skilled worker:** CRC 418,000/month
  - **University professional:** CRC 784,139/month
- Updated annually by the Consejo Nacional de Salarios

### 8.2 Working Hours

- **Standard day shift:** 8 hours/day, 48 hours/week
- **Night shift:** 6 hours/day, 36 hours/week
- **Mixed:** 7 hours/day, 42 hours/week
- **Overtime:** 150% (time and a half); prohibited to exceed working-day equivalent in overtime

### 8.3 Mandatory Benefits

#### Vacation (Vacaciones)

- 2 weeks (14 calendar days, approximately 12 working days) per year after 50 weeks of service
- Cannot be compensated in cash while employed (only at termination)

#### Aguinaldo (Christmas Bonus)

- 1 month salary per year
- Calculated as 1/12 of all earnings from December 1 to November 30
- Must be paid by December 20
- Tax-exempt

### 8.4 Social Security Contributions (CCSS + Others)

| Concept                       | Employer %   | Employee %  |
|-------------------------------|-------------|-------------|
| SEM (Health Insurance)        | 9.25%       | 5.50%       |
| IVM (Pension)                 | 5.25%*      | 4.00%*      |
| Banco Popular                 | 0.25%       | 1.00%       |
| INA (Training)                | 1.50%       | 0%          |
| IMAS (Social Assistance)      | 0.50%       | 0%          |
| Asignaciones Familiares       | 5.00%       | 0%          |
| INS (Workplace Risk)          | ~2.00%      | 0%          |
| FCL (Capitalizacion Laboral)  | 3.00%       | 0%          |

*IVM rates increasing in January 2026 to 5.58% employer and 4.33% employee

- **Total employer contribution:** ~26.67% of gross salary
- **Total employer burden with aguinaldo + provisions:** ~38-42% above gross salary

### 8.5 Hiring Requirements

- **Contract types:** Indefinite (default), fixed-term (only for specific, justified work), project-based
- **Probation period:** 3 months (first 3 months of employment; reduced protections)
- Written contract not legally required but strongly recommended
- Registration with CCSS mandatory within 8 days of hire

### 8.6 Termination Rules

#### Just Cause

- Must be exercised within 1 month of the employer learning of the cause
- Employee receives: pending wages, prorated vacation, prorated aguinaldo only

#### Without Cause

**Preaviso (Advance Notice):**

| Service Length    | Notice Period |
|-------------------|---------------|
| 3-6 months        | 1 week        |
| 6 months - 1 year | 15 days       |
| 1+ years          | 1 month       |

**Cesantia (Severance):**

| Years of Service | Days of Salary per Year |
|------------------|------------------------|
| 3-6 months       | 7 days                 |
| 6 months - 1 year| 14 days                |
| 1 year           | 19.5 days              |
| 2 years          | 20 days                |
| 3 years          | 20.5 days              |
| 4 years          | 21 days                |
| 5 years          | 21.24 days             |
| 6 years          | 21.5 days              |
| 7+ years         | 22 days                |

- **Maximum severance: 8 months of salary (cap)**
- Plus prorated vacation + prorated aguinaldo

#### Fondo de Capitalizacion Laboral (FCL)

- Employer deposits 3% monthly; after 3 years employee can withdraw
- Partially offsets severance obligation

### 8.7 Special Protections

- **Maternity leave:** 4 months (1 month before + 3 months after birth); paid by CCSS
- **Paternity leave:** Not explicitly mandated by law (some companies/CBAs grant it)
- **Fuero de maternidad:** Cannot terminate during pregnancy or breastfeeding
- **Disability:** CCSS covers temporary disability after 3 days; employer pays first 3 days (50%)
- **Unions:** Freedom of association; solidarismo (employer-employee savings associations) is common alternative
- **Anti-discrimination:** Labor Code prohibits discrimination; Law 2694 (workplace harassment)

---

## 9. Ecuador

**Governing law:** Codigo del Trabajo
**Key institutions:** IESS (Instituto Ecuatoriano de Seguridad Social), Ministerio del Trabajo

### 9.1 Minimum Wage (2026)

- **SBU (Salario Basico Unificado):** USD $482/month (Jan 2026; up from $470 in 2025)
- Sectoral minimum wages may be higher (set by Comisiones Sectoriales)
- Ecuador uses USD as legal currency

### 9.2 Working Hours

- **Standard:** 8 hours/day, 40 hours/week (one of the shortest in LatAm)
- **Overtime:** 150% for daytime (up to 4 extra hours/day); 200% for midnight to 6 AM
- **Weekends/holidays:** 200% premium
- Night shift (7 PM - 6 AM): 25% premium

### 9.3 Mandatory Benefits

#### Vacation

- 15 working days per year after 1 year of service
- Additional 1 day per year after 5 years of service (up to 15 additional days)
- Cannot be compensated in cash while employed

#### Decimo Tercer Sueldo (13th Month)

- 1 month salary per year
- Paid by December 24 (calculated on earnings from Dec 1 previous year to Nov 30)
- Employee can elect to receive it prorated monthly (1/12 each month)

#### Decimo Cuarto Sueldo (14th Month)

- 1 SBU (basic unified salary) regardless of actual salary
- Paid by:
  - March 15 (Costa/Galapagos region)
  - August 15 (Sierra/Oriente region)
- Employee can elect to receive it prorated monthly

#### Fondos de Reserva (Reserve Fund)

- 8.33% of monthly salary (equivalent to 1 month per year)
- Starts after employee completes 13 months of service with same employer
- Deposited monthly to IESS or paid directly to employee (employee's choice)

#### Utilidades (Profit Sharing)

- 15% of pre-tax profits distributed to employees:
  - 10% divided equally among all employees
  - 5% distributed proportionally by family dependents
- Mandatory for all companies with profits
- Among the highest profit-sharing rates in LatAm

### 9.4 Social Security Contributions (IESS)

| Concept                    | Employer %   | Employee %  |
|----------------------------|-------------|-------------|
| IESS (Social Security)     | 12.15%      | 9.45%       |

- Covers: pension, health, occupational risk, unemployment
- **Fondos de Reserva** (8.33%) is an additional employer cost after month 13
- **Total employer contribution:** ~12.15% + 8.33% (fondos de reserva) = ~20.5%
- **Total employer burden with bonuses + profit sharing:** ~38-45% above gross salary

### 9.5 Hiring Requirements

- **Contract types:** Indefinite (default since 2015 reform), fixed-term (max 2 years), seasonal, part-time
- **Probation period:** 90 days
- Written contract required; must be registered with Ministerio del Trabajo within 30 days
- Aviso de entrada to IESS within 15 days of hire

### 9.6 Termination Rules

#### Just Cause (Visto Bueno)

- Must be requested through Ministerio del Trabajo (Inspectoria del Trabajo)
- Inspector investigates and authorizes or denies the termination
- If approved: prorated benefits only

#### Without Cause (Despido Intempestivo)

**Indemnizacion:**

| Service Length      | Indemnization                                    |
|---------------------|--------------------------------------------------|
| Up to 3 years       | 3 months salary                                  |
| 3+ years            | 1 month salary per year of service (no cap)      |

- Plus: **Desahucio** (notice bonus): 25% of last monthly salary per year of service
- Plus: Prorated 13th + 14th month + fondos de reserva + vacation

### 9.7 Contractor vs Employee

- "Contrato de prestacion de servicios profesionales" for genuine contractors
- Strict classification: if worker has fixed schedule, exclusivity, or subordination = employee
- Misclassification: retroactive benefits + IESS contributions + fines
- IESS actively audits for unregistered workers

### 9.8 Special Protections

- **Maternity leave:** 12 weeks (2 pre + 10 post); 75% paid by IESS, 25% by employer
- **Paternity leave:** 10 days (15 for C-section; 25 for multiple births)
- **Adoption leave:** 15 days
- **Lactation break:** 2 hours/day for 12 months after birth
- **Disability:** Cannot terminate during medical leave; IESS subsidies apply
- **Anti-discrimination:** Constitutional protections; labor law prohibits discrimination
- **Unions:** Freedom of association; minimum 30 workers to form a union

---

## 10. Dominican Republic

**Governing law:** Codigo de Trabajo (Law 16-92)
**Key institutions:** TSS (Tesoreria de la Seguridad Social), DIDA, Ministerio de Trabajo

### 10.1 Minimum Wage (2025)

Varies by company size and sector:

| Category                    | Monthly DOP     | Approx. USD |
|-----------------------------|-----------------|-------------|
| Large companies (151+ empl) | DOP $27,989     | ~$475       |
| Medium companies (51-150)   | DOP $25,657     | ~$435       |
| Small companies (11-50)     | DOP $17,193     | ~$290       |
| Micro companies (1-10)      | DOP $15,860     | ~$270       |
| Free Trade Zones            | DOP $14,161     | ~$240       |

- Adjusted every 2-3 years by the Comite Nacional de Salarios

### 10.2 Working Hours

- **Standard:** 8 hours/day, 44 hours/week
- **Night shift (9 PM - 7 AM):** 8 hours = 6 hours normal equivalent
- **Overtime:** 135% for first 68 extra hours/month; beyond that, penalties apply
- Weekly rest: 36 consecutive hours
- Maximum: 80 overtime hours per quarter

### 10.3 Mandatory Benefits

#### Vacation (Vacaciones)

- 14 working days per year after 1 year of continuous service
- Increases to 18 days after 5 years of service
- Must be paid in advance at ordinary salary rate
- 30% vacation bonus (not always applied, depends on custom)

#### Salario de Navidad (Christmas Salary)

- 1/12 of total ordinary salary earned in the calendar year
- Paid by December 20
- Exempt from income tax and social security contributions

#### Bonificacion

- Not mandatory by law, but customary in some industries
- Some collective agreements require it

### 10.4 Social Security Contributions (TSS)

| Concept                    | Employer %   | Employee %  |
|----------------------------|-------------|-------------|
| Pension (AFP)              | 7.10%       | 2.87%       |
| Health (SFS)               | 7.09%       | 3.04%       |
| Occupational Risk (SRL)    | 1.10-1.20%  | 0%          |
| INFOTEP (Training)         | 1.00%       | 0%          |

- **Total employer contribution:** ~16.3-17.4% of gross salary
- **Total employer burden with Christmas salary + provisions:** ~28-32% above gross salary

### 10.5 Hiring Requirements

- **Contract types:** Indefinite (default), fixed-term (for specific work), seasonal
- **Probation:** Not formally regulated; implicit in first 3 months of employment
- Written contract not legally required but strongly recommended
- Registration with TSS mandatory

### 10.6 Termination Rules

#### Just Cause (Despido Justificado)

- Must be exercised within 15 days of employer learning of cause
- 48-hour notification to Ministerio de Trabajo and employee
- No severance; pending wages and prorated benefits only

#### Without Cause (Desahucio)

**Preaviso (Notice Period):**

| Service Length     | Notice Period |
|--------------------|---------------|
| 3-6 months         | 7 days        |
| 6-12 months        | 14 days       |
| 1+ years           | 28 days       |

**Cesantia (Severance):**

| Service Length       | Severance Amount         |
|----------------------|--------------------------|
| 3-6 months           | 6 days salary            |
| 6-12 months          | 13 days salary           |
| 1-5 years            | 21 days per year         |
| 5+ years             | 23 days per year         |

- **Cap:** Salary used for calculation cannot exceed 20x minimum wage
- Plus prorated Christmas salary and vacation

#### Employee Resignation (Dimision)

- Employee can resign with just cause and claim same severance as unjustified dismissal
- Must be exercised within 15 days of cause arising

### 10.7 Special Protections

- **Maternity leave:** 14 weeks (7 prenatal + 7 postnatal); paid 50% employer + 50% social security
- **Paternity leave:** 2 days
- **Fuero de maternidad:** Cannot terminate during pregnancy + 6 months post-birth
- **Disability:** Employer must hold position during medical leave; social security subsidies after day 4
- **Unions:** Freedom of association; collective bargaining permitted
- **Anti-discrimination:** Constitutional protections; specific laws against workplace harassment

---

## Contractor vs Employee Classification

### Universal Red Flags for Misclassification

Across all LatAm jurisdictions, courts and regulators evaluate these factors when determining
if a "contractor" is actually an employee:

| Factor                          | Employee Indicator        | Contractor Indicator    |
|---------------------------------|--------------------------|------------------------|
| Schedule                        | Fixed hours set by company | Flexible, self-managed |
| Tools/Equipment                 | Provided by company       | Own tools              |
| Exclusivity                     | Works only for 1 client   | Multiple clients       |
| Subordination                   | Takes orders/instructions | Autonomous decisions   |
| Integration                     | Part of core business     | Ancillary/specialized  |
| Payment                         | Regular salary            | Per project/invoice    |
| Place of work                   | Company premises          | Own office/remote      |
| Duration                        | Ongoing/indefinite        | Project-based          |
| Economic dependence             | >70-80% income from one source | Diversified       |

### Consequences of Misclassification by Country

| Country     | Back Benefits | Back Social Security | Fines         | Criminal Risk |
|-------------|--------------|---------------------|---------------|---------------|
| Mexico      | Yes          | Yes + surcharges    | Severe        | Yes (2021 reform) |
| Colombia    | Yes          | Yes + interest      | Yes           | Possible      |
| Brazil      | Yes + moral damages | Yes + interest | Severe   | No            |
| Argentina   | Yes          | Yes + interest      | Yes           | No            |
| Chile       | Yes          | Yes + surcharges    | Yes           | No            |
| Peru        | Yes          | Yes                 | Yes (SUNAFIL) | No            |
| Panama      | Yes          | Yes                 | Yes           | No            |
| Costa Rica  | Yes          | Yes + interest      | Yes           | No            |
| Ecuador     | Yes          | Yes + surcharges    | Yes           | No            |
| Dom. Rep.   | Yes          | Yes                 | Yes           | No            |

### When to Use Each

**Use an employee when:**
- The person works exclusively or primarily for you
- You control when, where, and how they work
- The role is part of your core business
- The engagement is ongoing/indefinite
- You provide the tools and workspace

**Use a contractor when:**
- The person has their own business/clients
- They control their own schedule and methods
- The work is a specific project with a defined scope
- They use their own tools and bear their own risk
- They invoice you (not on payroll)

---

## TypeScript Implementation

### Employer Cost Calculator

```typescript
/**
 * Kitz Payroll Estimation Tool
 * Calculates total employer cost for hiring in LatAm countries.
 *
 * IMPORTANT: These are estimates based on general rates. Actual costs
 * may vary based on industry, company size, location, and collective
 * bargaining agreements. Always verify with local payroll specialists.
 */

type LatAmCountry =
  | 'mexico'
  | 'colombia'
  | 'brazil'
  | 'argentina'
  | 'chile'
  | 'peru'
  | 'panama'
  | 'costa_rica'
  | 'ecuador'
  | 'dominican_republic';

interface EmployeeCost {
  country: LatAmCountry;
  grossMonthlySalary: number;
  currency: string;
  socialSecurity: number;
  healthInsurance: number;
  pension: number;
  housingFund: number;
  otherContributions: number;
  mandatoryBonuses: number;       // Prorated monthly
  vacationProvision: number;      // Prorated monthly
  severanceProvision: number;     // Prorated monthly (where applicable)
  totalMonthlyEmployerCost: number;
  totalAnnualEmployerCost: number;
  percentAboveGross: number;
}

interface CountryRates {
  currency: string;
  socialSecurityEmployer: number;
  healthInsuranceEmployer: number;
  pensionEmployer: number;
  housingFundRate: number;
  otherContributions: number;
  annualBonusMonths: number;         // e.g., 1.25 = 1.25 months/year
  vacationDaysYear1: number;
  severanceProvisionRate: number;    // Monthly accrual rate
}

const COUNTRY_RATES: Record<LatAmCountry, CountryRates> = {
  mexico: {
    currency: 'MXN',
    socialSecurityEmployer: 0.15,     // IMSS combined (varies by salary band)
    healthInsuranceEmployer: 0.0105,  // Gastos medicos pensionados
    pensionEmployer: 0.07,            // SAR + CEAV (2025 rate)
    housingFundRate: 0.05,            // INFONAVIT
    otherContributions: 0.03,         // State payroll tax (avg)
    annualBonusMonths: 1.04,          // Aguinaldo (15d=0.5mo) + Prima Vac (25% of 12d)
    vacationDaysYear1: 12,
    severanceProvisionRate: 0.0,      // Not accrued; paid at termination
  },
  colombia: {
    currency: 'COP',
    socialSecurityEmployer: 0.005,    // ARL (avg risk level)
    healthInsuranceEmployer: 0.085,   // EPS
    pensionEmployer: 0.12,            // AFP
    housingFundRate: 0.0,
    otherContributions: 0.09,         // SENA 2% + ICBF 3% + Caja 4%
    annualBonusMonths: 2.12,          // Prima (1mo) + Cesantias (1mo) + Interest (0.12mo)
    vacationDaysYear1: 15,
    severanceProvisionRate: 0.0,      // Cesantias serve as severance provision
  },
  brazil: {
    currency: 'BRL',
    socialSecurityEmployer: 0.20,     // INSS employer
    healthInsuranceEmployer: 0.0,     // Included in INSS
    pensionEmployer: 0.0,             // Included in INSS
    housingFundRate: 0.08,            // FGTS
    otherContributions: 0.058,        // RAT (2%) + S System (3.3%) + Salario Educacao (2.5%)
    annualBonusMonths: 1.33,          // 13th salary (1mo) + Vacation 1/3 bonus (0.33mo)
    vacationDaysYear1: 30,
    severanceProvisionRate: 0.0,      // FGTS serves as severance provision
  },
  argentina: {
    currency: 'ARS',
    socialSecurityEmployer: 0.0,      // Split below
    healthInsuranceEmployer: 0.06,    // Obra Social
    pensionEmployer: 0.1017,          // Jubilacion
    housingFundRate: 0.0,
    otherContributions: 0.0933,       // INSSJP(1.5%) + Asig Fam(4.44%) + FNE(0.89%) + ART(2.5%) + Life(0.5%)
    annualBonusMonths: 1.0,           // SAC / Aguinaldo
    vacationDaysYear1: 14,
    severanceProvisionRate: 0.0,
  },
  chile: {
    currency: 'CLP',
    socialSecurityEmployer: 0.0,      // Split below
    healthInsuranceEmployer: 0.0,     // Employee-funded
    pensionEmployer: 0.015,           // New employer contribution (2025-26)
    housingFundRate: 0.0,
    otherContributions: 0.0523,       // AFC(2.4%) + Mutual(0.95%) + SIS(1.88%)
    annualBonusMonths: 0.75,          // Gratificacion (Art.50: ~25% of annual, prorated)
    vacationDaysYear1: 15,
    severanceProvisionRate: 0.0,
  },
  peru: {
    currency: 'PEN',
    socialSecurityEmployer: 0.0,
    healthInsuranceEmployer: 0.09,    // ESSALUD
    pensionEmployer: 0.0,             // Employee-funded
    housingFundRate: 0.0,
    otherContributions: 0.0,
    annualBonusMonths: 3.18,          // Grat x2 (2mo) + 9% bonus (0.18mo) + CTS (1mo)
    vacationDaysYear1: 30,
    severanceProvisionRate: 0.0,
  },
  panama: {
    currency: 'USD',
    socialSecurityEmployer: 0.1225,   // CSS
    healthInsuranceEmployer: 0.0,     // Included in CSS
    pensionEmployer: 0.0,             // Included in CSS
    housingFundRate: 0.0,
    otherContributions: 0.025,        // Educational insurance (1.5%) + occupational risk (~1%)
    annualBonusMonths: 1.0,           // Decimo Tercer Mes
    vacationDaysYear1: 30,
    severanceProvisionRate: 0.0192,   // ~1 week per year = 7/365
  },
  costa_rica: {
    currency: 'CRC',
    socialSecurityEmployer: 0.0,      // Split below
    healthInsuranceEmployer: 0.0925,  // SEM
    pensionEmployer: 0.0525,          // IVM
    housingFundRate: 0.0,
    otherContributions: 0.1217,       // INA(1.5%) + IMAS(0.5%) + Asig(5%) + INS(2%) + FCL(3%) + BP(0.25%)
    annualBonusMonths: 1.0,           // Aguinaldo
    vacationDaysYear1: 14,
    severanceProvisionRate: 0.0,
  },
  ecuador: {
    currency: 'USD',
    socialSecurityEmployer: 0.1215,   // IESS
    healthInsuranceEmployer: 0.0,     // Included in IESS
    pensionEmployer: 0.0,             // Included in IESS
    housingFundRate: 0.0,
    otherContributions: 0.0833,       // Fondos de Reserva (after month 13)
    annualBonusMonths: 1.97,          // Decimo 3ro (1mo) + Decimo 4to (~1 SBU, varies)
    vacationDaysYear1: 15,
    severanceProvisionRate: 0.0,
  },
  dominican_republic: {
    currency: 'DOP',
    socialSecurityEmployer: 0.0,      // Split below
    healthInsuranceEmployer: 0.0709,  // SFS
    pensionEmployer: 0.071,           // AFP
    housingFundRate: 0.0,
    otherContributions: 0.022,        // SRL(1.2%) + INFOTEP(1%)
    annualBonusMonths: 1.0,           // Salario de Navidad
    vacationDaysYear1: 14,
    severanceProvisionRate: 0.0,
  },
};

function calculateEmployerCost(
  country: LatAmCountry,
  grossMonthlySalary: number
): EmployeeCost {
  const rates = COUNTRY_RATES[country];

  // Direct employer contributions (monthly)
  const socialSecurity = grossMonthlySalary * rates.socialSecurityEmployer;
  const healthInsurance = grossMonthlySalary * rates.healthInsuranceEmployer;
  const pension = grossMonthlySalary * rates.pensionEmployer;
  const housingFund = grossMonthlySalary * rates.housingFundRate;
  const otherContributions = grossMonthlySalary * rates.otherContributions;

  // Prorated mandatory bonuses (monthly provision)
  const mandatoryBonuses =
    (grossMonthlySalary * rates.annualBonusMonths) / 12;

  // Prorated vacation (monthly provision)
  const vacationProvision =
    (grossMonthlySalary * rates.vacationDaysYear1) / 365;

  // Severance provision (monthly accrual, where applicable)
  const severanceProvision =
    grossMonthlySalary * rates.severanceProvisionRate;

  const totalMonthlyEmployerCost =
    grossMonthlySalary +
    socialSecurity +
    healthInsurance +
    pension +
    housingFund +
    otherContributions +
    mandatoryBonuses +
    vacationProvision +
    severanceProvision;

  const totalAnnualEmployerCost = totalMonthlyEmployerCost * 12;

  const percentAboveGross =
    ((totalMonthlyEmployerCost - grossMonthlySalary) / grossMonthlySalary) *
    100;

  return {
    country,
    grossMonthlySalary,
    currency: rates.currency,
    socialSecurity: Math.round(socialSecurity * 100) / 100,
    healthInsurance: Math.round(healthInsurance * 100) / 100,
    pension: Math.round(pension * 100) / 100,
    housingFund: Math.round(housingFund * 100) / 100,
    otherContributions: Math.round(otherContributions * 100) / 100,
    mandatoryBonuses: Math.round(mandatoryBonuses * 100) / 100,
    vacationProvision: Math.round(vacationProvision * 100) / 100,
    severanceProvision: Math.round(severanceProvision * 100) / 100,
    totalMonthlyEmployerCost:
      Math.round(totalMonthlyEmployerCost * 100) / 100,
    totalAnnualEmployerCost:
      Math.round(totalAnnualEmployerCost * 100) / 100,
    percentAboveGross: Math.round(percentAboveGross * 10) / 10,
  };
}

// ---- Usage example ----
// const cost = calculateEmployerCost('mexico', 25000);
// console.log(cost);
// Output: { country: 'mexico', grossMonthlySalary: 25000, currency: 'MXN',
//           socialSecurity: 3750, healthInsurance: 262.5, pension: 1750,
//           housingFund: 1250, otherContributions: 750,
//           mandatoryBonuses: 2166.67, vacationProvision: 821.92,
//           severanceProvision: 0, totalMonthlyEmployerCost: 34751.09,
//           totalAnnualEmployerCost: 417013.04, percentAboveGross: 39.0 }
```

---

## Severance Calculator

```typescript
/**
 * Kitz Severance Calculator
 * Calculates severance obligations by country for unjustified dismissal.
 *
 * NOTE: These are simplified formulas. Actual calculations may involve
 * Daily Integrated Salary (Mexico), Collective Bargaining Agreement caps
 * (Argentina), UF caps (Chile), and other country-specific adjustments.
 */

type TerminationType = 'just_cause' | 'without_cause' | 'mutual_agreement';

interface SeveranceResult {
  country: LatAmCountry;
  terminationType: TerminationType;
  monthlySalary: number;
  yearsOfService: number;
  currency: string;
  severancePay: number;
  noticePeriodPay: number;
  seniorityPremium: number;
  otherPayments: number;
  totalSeveranceCost: number;
  breakdown: string[];
}

function calculateSeverance(
  country: LatAmCountry,
  monthlySalary: number,
  yearsOfService: number,
  terminationType: TerminationType
): SeveranceResult {
  const rates = COUNTRY_RATES[country];
  let severancePay = 0;
  let noticePeriodPay = 0;
  let seniorityPremium = 0;
  let otherPayments = 0;
  const breakdown: string[] = [];

  if (terminationType === 'just_cause') {
    breakdown.push(
      'Just cause termination: No severance. Only prorated benefits owed.'
    );
    // Prorated vacation + bonuses (simplified estimate)
    otherPayments = monthlySalary * 0.5; // Rough estimate for prorated benefits
    breakdown.push(
      `Estimated prorated benefits (vacation, bonuses): ${otherPayments.toFixed(2)}`
    );
  } else if (terminationType === 'without_cause') {
    switch (country) {
      case 'mexico': {
        // Constitutional indemnity: 3 months
        severancePay = monthlySalary * 3;
        breakdown.push(
          `Constitutional indemnity (3 months): ${severancePay.toFixed(2)}`
        );

        // 20 days per year of service
        const twentyDaysPay =
          (monthlySalary / 30) * 20 * yearsOfService;
        severancePay += twentyDaysPay;
        breakdown.push(
          `Seniority (20 days x ${yearsOfService} years): ${twentyDaysPay.toFixed(2)}`
        );

        // Prima de antiguedad: 12 days per year (capped at 2x min wage)
        const dailyMinWage = 315.04; // 2026 general zone
        const cappedDaily = Math.min(monthlySalary / 30, dailyMinWage * 2);
        seniorityPremium = cappedDaily * 12 * yearsOfService;
        breakdown.push(
          `Prima de antiguedad (12 days x ${yearsOfService} years, capped): ${seniorityPremium.toFixed(2)}`
        );

        // Notice: implied in the 3-month constitutional indemnity
        noticePeriodPay = 0;
        break;
      }

      case 'colombia': {
        // Indefinite contract formula
        if (yearsOfService <= 1) {
          severancePay = monthlySalary; // 30 days
          breakdown.push(`Year 1: 30 days = ${severancePay.toFixed(2)}`);
        } else if (yearsOfService <= 10) {
          severancePay =
            monthlySalary + (monthlySalary / 30) * 20 * (yearsOfService - 1);
          breakdown.push(
            `30 days (yr 1) + 20 days x ${yearsOfService - 1} years = ${severancePay.toFixed(2)}`
          );
        } else {
          severancePay =
            (monthlySalary / 30) * 45 +
            (monthlySalary / 30) * 40 * (yearsOfService - 1);
          breakdown.push(
            `45 days (yr 1) + 40 days x ${yearsOfService - 1} years = ${severancePay.toFixed(2)}`
          );
        }
        noticePeriodPay = 0; // No statutory notice for employer-initiated termination
        break;
      }

      case 'brazil': {
        // 40% penalty on FGTS balance
        const monthlyFGTS = monthlySalary * 0.08;
        const totalFGTSBalance = monthlyFGTS * yearsOfService * 12;
        severancePay = totalFGTSBalance * 0.4;
        breakdown.push(
          `40% FGTS penalty (balance: ${totalFGTSBalance.toFixed(2)}): ${severancePay.toFixed(2)}`
        );

        // Aviso previo: 30 days + 3 days per year (max 90 days)
        const noticeDays = Math.min(30 + 3 * yearsOfService, 90);
        noticePeriodPay = (monthlySalary / 30) * noticeDays;
        breakdown.push(
          `Aviso previo (${noticeDays} days): ${noticePeriodPay.toFixed(2)}`
        );
        break;
      }

      case 'argentina': {
        // 1 month per year of service (minimum 1 month)
        severancePay = monthlySalary * Math.max(yearsOfService, 1);
        breakdown.push(
          `Indemnizacion (${Math.max(yearsOfService, 1)} months): ${severancePay.toFixed(2)}`
        );

        // Notice period
        if (yearsOfService < 5) {
          noticePeriodPay = monthlySalary * 1;
          breakdown.push(`Preaviso (1 month): ${noticePeriodPay.toFixed(2)}`);
        } else {
          noticePeriodPay = monthlySalary * 2;
          breakdown.push(`Preaviso (2 months): ${noticePeriodPay.toFixed(2)}`);
        }

        // Integration of month
        otherPayments = monthlySalary * 0.5; // Estimate for month integration
        breakdown.push(
          `Integracion mes de despido (est.): ${otherPayments.toFixed(2)}`
        );
        break;
      }

      case 'chile': {
        // 1 month per year, capped at 11 months
        const cappedYears = Math.min(Math.ceil(yearsOfService), 11);
        // Monthly salary capped at 90 UF (~CLP 3,500,000)
        const cappedSalary = Math.min(monthlySalary, 3500000);
        severancePay = cappedSalary * cappedYears;
        breakdown.push(
          `Indemnizacion (${cappedYears} months, salary cap 90UF): ${severancePay.toFixed(2)}`
        );

        // 30 days notice
        noticePeriodPay = monthlySalary;
        breakdown.push(`Aviso previo (1 month): ${noticePeriodPay.toFixed(2)}`);
        break;
      }

      case 'peru': {
        // 1.5 months per year, capped at 12 months
        severancePay = Math.min(
          monthlySalary * 1.5 * yearsOfService,
          monthlySalary * 12
        );
        breakdown.push(
          `Indemnizacion (1.5 x ${yearsOfService} years, cap 12mo): ${severancePay.toFixed(2)}`
        );
        noticePeriodPay = 0; // No statutory notice period for employer
        break;
      }

      case 'panama': {
        // Prima de antiguedad: 1 week per year (from year 2)
        const primeYears = Math.max(yearsOfService - 1, 0);
        seniorityPremium = (monthlySalary / 4) * primeYears;
        breakdown.push(
          `Prima antiguedad (${primeYears} weeks): ${seniorityPremium.toFixed(2)}`
        );

        // Indemnizacion: 3.4 weeks per year
        severancePay = (monthlySalary / 4) * 3.4 * yearsOfService;
        breakdown.push(
          `Indemnizacion (3.4 wks x ${yearsOfService} yrs): ${severancePay.toFixed(2)}`
        );

        // 30 days notice
        noticePeriodPay = monthlySalary;
        breakdown.push(`Preaviso (1 month): ${noticePeriodPay.toFixed(2)}`);
        break;
      }

      case 'costa_rica': {
        // Sliding scale, cap at 8 months
        let cesantiaDays = 0;
        if (yearsOfService >= 7) {
          cesantiaDays = 22 * Math.min(yearsOfService, 8);
        } else if (yearsOfService >= 1) {
          const perYearDays = [0, 19.5, 20, 20.5, 21, 21.24, 21.5];
          for (let i = 0; i < Math.min(yearsOfService, 7); i++) {
            cesantiaDays += perYearDays[Math.min(i, 6)];
          }
        } else if (yearsOfService >= 0.5) {
          cesantiaDays = 14;
        } else if (yearsOfService >= 0.25) {
          cesantiaDays = 7;
        }
        severancePay = (monthlySalary / 30) * Math.min(cesantiaDays, 240);
        breakdown.push(
          `Cesantia (${cesantiaDays} days, cap 8mo): ${severancePay.toFixed(2)}`
        );

        // Notice
        if (yearsOfService >= 1) {
          noticePeriodPay = monthlySalary;
        } else if (yearsOfService >= 0.5) {
          noticePeriodPay = monthlySalary / 2;
        } else {
          noticePeriodPay = monthlySalary / 4;
        }
        breakdown.push(`Preaviso: ${noticePeriodPay.toFixed(2)}`);
        break;
      }

      case 'ecuador': {
        // Base: 3 months for <3 years; 1 month per year for 3+ years
        if (yearsOfService < 3) {
          severancePay = monthlySalary * 3;
          breakdown.push(
            `Indemnizacion (<3 yrs: 3 months): ${severancePay.toFixed(2)}`
          );
        } else {
          severancePay = monthlySalary * yearsOfService;
          breakdown.push(
            `Indemnizacion (${yearsOfService} months): ${severancePay.toFixed(2)}`
          );
        }

        // Desahucio: 25% of last salary per year
        const desahucio = monthlySalary * 0.25 * yearsOfService;
        otherPayments = desahucio;
        breakdown.push(
          `Desahucio (25% x ${yearsOfService} yrs): ${desahucio.toFixed(2)}`
        );
        break;
      }

      case 'dominican_republic': {
        // Cesantia
        let cesantiaDays = 0;
        if (yearsOfService < 0.5) {
          cesantiaDays = 6;
        } else if (yearsOfService < 1) {
          cesantiaDays = 13;
        } else if (yearsOfService <= 5) {
          cesantiaDays = 21 * yearsOfService;
        } else {
          cesantiaDays = 21 * 5 + 23 * (yearsOfService - 5);
        }
        severancePay = (monthlySalary / 30) * cesantiaDays;
        breakdown.push(
          `Cesantia (${cesantiaDays} days): ${severancePay.toFixed(2)}`
        );

        // Preaviso
        if (yearsOfService >= 1) {
          noticePeriodPay = (monthlySalary / 30) * 28;
        } else if (yearsOfService >= 0.5) {
          noticePeriodPay = (monthlySalary / 30) * 14;
        } else {
          noticePeriodPay = (monthlySalary / 30) * 7;
        }
        breakdown.push(`Preaviso: ${noticePeriodPay.toFixed(2)}`);
        break;
      }
    }
  } else if (terminationType === 'mutual_agreement') {
    // Only Brazil has a specific mutual agreement framework in law
    if (country === 'brazil') {
      const monthlyFGTS = monthlySalary * 0.08;
      const totalFGTSBalance = monthlyFGTS * yearsOfService * 12;
      severancePay = totalFGTSBalance * 0.2; // 20% instead of 40%
      breakdown.push(
        `20% FGTS penalty (mutual): ${severancePay.toFixed(2)}`
      );
      const noticeDays = Math.min(15 + 1.5 * yearsOfService, 45);
      noticePeriodPay = (monthlySalary / 30) * noticeDays;
      breakdown.push(
        `Aviso previo 50% (${noticeDays} days): ${noticePeriodPay.toFixed(2)}`
      );
    } else {
      breakdown.push(
        'Mutual agreement: Negotiate terms. No statutory formula in this country.'
      );
      severancePay = 0;
    }
  }

  const totalSeveranceCost =
    severancePay + noticePeriodPay + seniorityPremium + otherPayments;

  return {
    country,
    terminationType,
    monthlySalary,
    yearsOfService,
    currency: rates.currency,
    severancePay: Math.round(severancePay * 100) / 100,
    noticePeriodPay: Math.round(noticePeriodPay * 100) / 100,
    seniorityPremium: Math.round(seniorityPremium * 100) / 100,
    otherPayments: Math.round(otherPayments * 100) / 100,
    totalSeveranceCost: Math.round(totalSeveranceCost * 100) / 100,
    breakdown,
  };
}

// ---- Usage examples ----

// Mexico: Employee earning MXN 25,000/month, 5 years, unjustified dismissal
// const mx = calculateSeverance('mexico', 25000, 5, 'without_cause');
// Expected total: ~MXN 190,000+ (3mo const. + 100 days seniority + prima)

// Colombia: Employee earning COP 3,000,000/month, 3 years, without cause
// const co = calculateSeverance('colombia', 3000000, 3, 'without_cause');
// Expected total: ~COP 7,000,000 (30d + 20d x 2)

// Brazil: Employee earning BRL 5,000/month, 4 years, without cause
// const br = calculateSeverance('brazil', 5000, 4, 'without_cause');
// Expected total: ~BRL 14,700 (40% FGTS + 42-day notice)
```

---

## Quick Reference: "How Much Does It Really Cost to Hire Someone?"

For an SMB owner paying the **equivalent of USD $1,000/month gross salary**, here is the
approximate **total monthly employer cost** in each country:

| Country            | Gross (USD) | + Contributions | + Bonus Provision | Total Cost | % Above Gross |
|--------------------|-------------|-----------------|-------------------|------------|---------------|
| Mexico             | $1,000      | $310            | $87               | ~$1,430    | ~43%          |
| Colombia           | $1,000      | $300            | $177              | ~$1,530    | ~53%          |
| Brazil             | $1,000      | $338            | $111              | ~$1,530    | ~53%          |
| Argentina          | $1,000      | $260            | $83               | ~$1,380    | ~38%          |
| Chile              | $1,000      | $67             | $63               | ~$1,170    | ~17%          |
| Peru               | $1,000      | $90             | $265              | ~$1,400    | ~40%          |
| Panama             | $1,000      | $148            | $83               | ~$1,280    | ~28%          |
| Costa Rica         | $1,000      | $267            | $83               | ~$1,400    | ~40%          |
| Ecuador            | $1,000      | $205            | $164              | ~$1,420    | ~42%          |
| Dominican Republic | $1,000      | $164            | $83               | ~$1,290    | ~29%          |

> **Key takeaway for SMB owners:** In most LatAm countries, budget 30-55% above gross salary
> for total employer cost. Chile is the least expensive (employer contributions are low because
> pension and health are employee-funded). Brazil and Colombia are the most expensive when all
> mandatory benefits are included.

---

## Key Dates Calendar (Annual Employer Obligations)

| Date        | Country   | Obligation                                       |
|-------------|-----------|--------------------------------------------------|
| Jan 31      | Colombia  | Pay intereses sobre cesantias to employees        |
| Feb 14      | Colombia  | Deposit cesantias into employee fund accounts     |
| Mar 15      | Ecuador   | Decimo cuarto (Costa region)                     |
| Apr 15      | Panama    | Decimo tercer mes (1st installment)              |
| May 15      | Peru      | CTS deposit (Nov-Apr period)                     |
| May 30      | Mexico    | PTU (profit sharing) payment deadline            |
| Jun 30      | Colombia  | Prima de servicios (1st installment)             |
| Jun 30      | Argentina | SAC/Aguinaldo (1st installment)                  |
| Jul         | Peru      | Gratificacion (Fiestas Patrias)                  |
| Aug 15      | Panama    | Decimo tercer mes (2nd installment)              |
| Aug 15      | Ecuador   | Decimo cuarto (Sierra region)                    |
| Nov 15      | Peru      | CTS deposit (May-Oct period)                     |
| Nov 30      | Brazil    | 13 Salario (1st installment)                     |
| Dec 15      | Panama    | Decimo tercer mes (3rd installment)              |
| Dec 18      | Argentina | SAC/Aguinaldo (2nd installment)                  |
| Dec 20      | Mexico    | Aguinaldo payment deadline                       |
| Dec 20      | Colombia  | Prima de servicios (2nd installment)             |
| Dec 20      | Brazil    | 13 Salario (2nd installment)                     |
| Dec 20      | Costa Rica| Aguinaldo payment deadline                       |
| Dec 20      | Dom. Rep. | Salario de Navidad deadline                      |
| Dec 24      | Ecuador   | Decimo tercer sueldo deadline                    |
| Dec         | Peru      | Gratificacion (Navidad)                          |

---

## Sources and References

This intelligence brief was compiled from the following sources (accessed February 2026):

- Ley Federal del Trabajo (Mexico) -- payrollmexico.com, prodensa.com
- Codigo Sustantivo del Trabajo (Colombia) -- bizlatinhub.com, globalli.io
- CLT / Consolidacao das Leis do Trabalho (Brazil) -- playroll.com, acciyo.com
- Ley de Contrato de Trabajo No. 20.744 (Argentina) -- playroll.com, globalli.io
- Codigo del Trabajo (Chile) -- globallegalinsights.com, globalli.io
- DL 728 (Peru) -- papayaglobal.com, playroll.com, serviapgroup.com
- Codigo de Trabajo (Panama) -- bizlatinhub.com, usemultiplier.com
- Codigo de Trabajo (Costa Rica) -- bizlatinhub.com, crie.cr, playroll.com
- Codigo del Trabajo (Ecuador) -- playroll.com, papayaglobal.com, lawgratis.com
- Codigo de Trabajo Law 16-92 (Dominican Republic) -- bizlatinhub.com, drlawyer.com
- PWC Tax Summaries -- taxsummaries.pwc.com
- Littler Mendelson -- littler.com
- Baker McKenzie Insight -- bakermckenzie.com
- Holland & Knight -- hklaw.com
- Ogletree Deakins -- ogletree.com
- Rippling Worker Classification Guides -- rippling.com
- Deel Misclassification Guides -- deel.com
- Serviap Group -- serviapgroup.com
- WowRemoteTeams LatAm Minimum Wages -- wowremoteteams.com

> **IMPORTANT:** Labor laws in Latin America change frequently. Minimum wages are updated
> annually (or more often in countries like Argentina). Social security rates are adjusted
> periodically. Always verify current rates with local counsel or official government sources
> before making payroll decisions. This document should be refreshed quarterly.
