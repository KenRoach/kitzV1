# Inventory, Supply Chain & Trade Intelligence for LatAm SMBs

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Audience:** Kitz platform -- AI agents and SMB owners

---

## Table of Contents

1. [Part 1: Inventory Management](#part-1-inventory-management)
2. [Part 2: Supply Chain & Logistics](#part-2-supply-chain--logistics)
3. [Part 3: Import/Export & Trade](#part-3-importexport--trade)
4. [Part 4: TypeScript Implementations for Kitz](#part-4-typescript-implementations-for-kitz)
5. [Appendix: Resources & References](#appendix-resources--references)

---

## Part 1: Inventory Management

### 1.1 Inventory Valuation Methods for SMBs

SMBs across Latin America must choose an inventory costing method that aligns with both
their operational reality and tax requirements in their jurisdiction. The three primary
methods are FIFO, LIFO, and Weighted Average.

#### FIFO (First-In, First-Out)

- **How it works:** The oldest inventory items are recorded as sold first.
- **Best for:** Perishable goods (restaurants, bakeries, fresh produce vendors), fashion
  and seasonal retail where older stock must move first.
- **Tax implication:** In inflationary environments (common in LatAm), FIFO results in
  lower COGS and higher taxable income because older, cheaper goods are expensed first.
- **LatAm note:** FIFO is the most widely accepted method by tax authorities across
  Mexico (SAT), Colombia (DIAN), Brazil (Receita Federal), and Chile (SII). Under IFRS
  (adopted across most of LatAm), FIFO is explicitly permitted.

#### LIFO (Last-In, First-Out)

- **How it works:** The most recently acquired inventory is recorded as sold first.
- **Best for:** Commodities, building materials, and non-perishable bulk goods.
- **Tax implication:** In inflationary environments, LIFO produces higher COGS and lower
  taxable income -- a tax advantage.
- **LatAm note:** LIFO is **prohibited under IFRS**, which means it is not accepted in
  most LatAm countries that follow IFRS (Brazil, Mexico, Colombia, Chile, Argentina,
  Peru). LIFO is primarily a US GAAP concept. Kitz should default to FIFO or Weighted
  Average for LatAm markets.

#### Weighted Average Cost

- **How it works:** Each purchase is blended into a running average cost per unit.
  `Average Cost = Total Cost of Goods Available / Total Units Available`
- **Best for:** Homogeneous products (hardware stores, office supplies, beauty products),
  businesses with high-volume, low-variation SKUs.
- **Tax implication:** Produces moderate COGS figures that smooth out price fluctuations.
- **LatAm note:** Widely accepted across all LatAm jurisdictions. Particularly popular
  with Mexican SMBs and Brazilian micro-enterprises (MEIs) because of its simplicity.

#### Method Selection Matrix for Kitz

| Business Type            | Recommended Method  | Reason                                    |
|--------------------------|--------------------|--------------------------------------------|
| Restaurant / Food vendor | FIFO               | Perishable goods; spoilage prevention      |
| Retail clothing          | FIFO               | Seasonal stock; move older items first     |
| Hardware / tools         | Weighted Average    | Homogeneous items; price smoothing         |
| Beauty supplies          | Weighted Average    | Bulk purchases; stable unit costs          |
| Electronics reseller     | FIFO               | Rapid depreciation; move old stock first   |
| Raw materials / commodities | Weighted Average | Fungible goods; price fluctuation smoothing|

---

### 1.2 ABC Analysis (80/20 Rule for Inventory)

ABC analysis segments inventory into three categories based on their contribution to
total revenue or cost. This is critical for LatAm SMBs that operate with limited working
capital and cannot afford to tie up cash in slow-moving stock.

**Category definitions:**

- **A items (roughly 20% of SKUs, 80% of revenue):** High-value products that drive most
  of the business. These require tight inventory controls, frequent reorder cycles, and
  accurate demand forecasting.
- **B items (roughly 30% of SKUs, 15% of revenue):** Moderate-value products. Standard
  reorder procedures and periodic reviews are sufficient.
- **C items (roughly 50% of SKUs, 5% of revenue):** Low-value, high-quantity items.
  Minimal controls; bulk ordering to minimize per-unit cost.

**Implementation for Kitz:**

```
Step 1: Pull last 12 months of sales data per SKU
Step 2: Calculate annual revenue contribution per SKU
Step 3: Sort SKUs descending by revenue contribution
Step 4: Calculate cumulative percentage
Step 5: Assign categories:
        - A: SKUs contributing to first 80% of cumulative revenue
        - B: SKUs contributing to next 15%
        - C: Remaining SKUs
Step 6: Apply differentiated reorder rules per category
```

**LatAm practical guidance:**

- Many LatAm SMBs carry 200-500 SKUs in retail settings. ABC analysis typically
  identifies 40-100 A-items that deserve dedicated attention.
- In Mexico's tiendas de abarotes (corner stores), A-items are typically: soft drinks,
  beer, cigarettes, tortillas, and mobile phone prepaid cards.
- In Colombian tiendas, A-items include: rice, cooking oil, eggs, coffee, and cleaning
  products.

---

### 1.3 Just-in-Time for Service Businesses

Traditional JIT was designed for manufacturing (Toyota Production System), but LatAm
service businesses can adopt modified JIT principles:

- **Restaurants:** Order perishable ingredients daily or every 2-3 days based on
  reservation forecasts. Maintain par levels for staples (oils, dry goods) with weekly
  reorders.
- **Beauty salons:** Stock professional-grade products (hair color, treatments) based on
  appointment bookings for the week. Retail products for sale kept at par levels.
- **Repair shops:** Maintain common parts inventory; order specialty parts on demand with
  2-3 day lead time.
- **Consulting/professional services:** JIT applies to human resources -- schedule
  subcontractors and freelancers based on project pipeline rather than maintaining
  full-time overhead.

**Challenges in LatAm:**
- Unreliable supplier lead times (infrastructure, customs delays)
- Limited availability of same-day or next-day delivery outside major metros
- Payment terms often require upfront cash (reducing JIT flexibility)
- Seasonal disruptions (rainy season logistics, holiday supplier closures)

---

### 1.4 Par Levels and Reorder Points

#### Par Levels

A par level is the minimum quantity of a product that must be on hand at all times. When
stock drops to the par level, a reorder is triggered.

```
Par Level = (Average Daily Usage x Lead Time in Days) + Safety Stock
```

**Example for a Mexican restaurant:**
- Average daily usage of avocados: 30 units
- Supplier lead time: 2 days
- Safety stock: 15 units (one half-day buffer)
- Par level = (30 x 2) + 15 = 75 avocados

#### Reorder Point (ROP)

The reorder point is the inventory level at which a new purchase order should be placed.

```
Reorder Point = (Average Daily Demand x Average Lead Time) + Safety Stock
```

**Example for a Colombian electronics shop:**
- Average daily sales of USB cables: 8 units
- Average supplier lead time: 5 days
- Safety stock: 12 units
- Reorder point = (8 x 5) + 12 = 52 units

When inventory drops to 52 units, a purchase order should be placed automatically.

---

### 1.5 Safety Stock Calculation Formulas

Safety stock protects against two types of variability: demand variability and lead time
variability. There are multiple methods of increasing sophistication.

#### Method 1: Basic Fixed Safety Stock

```
Safety Stock = Average Daily Sales x Safety Days
```

Where "Safety Days" is a subjective buffer (typically 3-7 days for LatAm SMBs).

Example: 50 units/day x 5 days = 250 units safety stock

#### Method 2: Lead Time Demand Method

```
Safety Stock = (Max Daily Sales x Max Lead Time) - (Avg Daily Sales x Avg Lead Time)
```

This method accounts for worst-case demand combined with worst-case lead time.

Example:
- Max daily sales: 60 units; Max lead time: 8 days
- Avg daily sales: 45 units; Avg lead time: 5 days
- Safety stock = (60 x 8) - (45 x 5) = 480 - 225 = 255 units

#### Method 3: Statistical Safety Stock (Service Level Approach)

```
Safety Stock = Z x sigma_d x sqrt(L)
```

Where:
- Z = service level factor (Z = 1.28 for 90%, 1.65 for 95%, 2.33 for 99%)
- sigma_d = standard deviation of daily demand
- L = average lead time in days

This is the most rigorous method and is recommended for Kitz A-category items.

Example:
- Desired service level: 95% (Z = 1.65)
- Standard deviation of daily demand: 10 units
- Average lead time: 6 days
- Safety stock = 1.65 x 10 x sqrt(6) = 1.65 x 10 x 2.449 = 40.4 ~ 41 units

#### Method 4: Combined Variability (Demand + Lead Time)

```
Safety Stock = Z x sqrt((Avg Lead Time x sigma_d^2) + (Avg Demand^2 x sigma_LT^2))
```

Where sigma_LT = standard deviation of lead time.

This is the gold standard for situations where both demand and lead time are variable --
common in LatAm due to supplier inconsistencies.

---

### 1.6 Inventory Turnover Benchmarks by Industry

Inventory turnover measures how many times inventory is sold and replaced over a period.

```
Inventory Turnover = Cost of Goods Sold / Average Inventory Value
```

#### Benchmarks for LatAm-Relevant Industries

| Industry                     | Annual Turnover | Monthly Equivalent | Notes                                      |
|------------------------------|----------------:|-------------------:|--------------------------------------------|
| Restaurants (perishables)    |       48-96x    |          4-8x      | Higher = fresher food, less waste          |
| Grocery / mini-market        |       15-25x    |          1.2-2x    | Staples turn fast; dry goods slower        |
| Retail clothing              |        4-6x     |          0.3-0.5x  | Seasonal; markdowns drive end-of-cycle     |
| Electronics / tech           |        8-12x    |          0.7-1x    | Fast depreciation demands quick turnover   |
| Beauty supplies / cosmetics  |        6-8x     |          0.5-0.7x  | Mix of fast consumables + slow retail      |
| Hardware / ferreter&iacute;a |        4-6x     |          0.3-0.5x  | Long-tail SKUs drag average down           |
| Pharmacy / drugstore         |        8-12x    |          0.7-1x    | Prescription items turn faster             |
| Auto parts                   |        4-8x     |          0.3-0.7x  | Large variety; many slow movers            |
| Construction materials       |        6-10x    |          0.5-0.8x  | Project-based; lumpy demand                |

**LatAm-specific factors affecting turnover:**
- Higher turnover in inflationary economies (Argentina, Venezuela) as merchants avoid
  holding depreciating cash in inventory
- Lower turnover in countries with import restrictions (historically Argentina, Ecuador)
  where merchants stockpile imported goods
- Seasonal peaks: Christmas (Nov-Dec), Mothers Day (May in most LatAm), back-to-school
  (Jan-Feb in Southern Hemisphere, Aug-Sep in Northern)

---

### 1.7 Inventory Costing & Landed Cost

#### Landed Cost Components

Landed cost is the total cost of getting a product from the supplier's factory to the
SMB's shelf. For imported goods, this involves multiple cost layers.

```
Landed Cost = Product Cost
            + International Freight
            + Insurance
            + Customs Duties
            + VAT / Import Tax
            + Customs Broker Fees
            + Local Transportation
            + Warehousing
            + Currency Conversion Costs
            + Financing Costs
```

#### Currency Conversion Impact

For LatAm SMBs importing goods (especially from China, the US, or Europe), exchange rate
fluctuations can dramatically affect landed cost.

| Currency Pair   | Typical Annual Volatility | Hedging Available? |
|-----------------|--------------------------|-------------------|
| MXN/USD         | 8-15%                    | Yes (forwards)    |
| COP/USD         | 10-20%                   | Limited           |
| BRL/USD         | 12-25%                   | Yes (NDF market)  |
| CLP/USD         | 8-15%                    | Yes               |
| ARS/USD         | 50-200%+                 | Extremely limited |
| PEN/USD         | 5-10%                    | Limited           |

**Kitz guidance:** Always calculate landed cost using the exchange rate at the time of
payment (not at the time of order or delivery). For budgeting purposes, add a 5-10%
currency buffer for stable currencies (MXN, CLP, PEN) and 15-30% for volatile currencies
(ARS, COP, BRL).

#### Shrinkage / Loss Rates by Industry

| Industry                | Typical Shrinkage Rate | Primary Cause              |
|-------------------------|----------------------:|---------------------------|
| Grocery / perishables   | 2-5%                  | Spoilage, expiration       |
| Retail clothing         | 1.5-3%                | Theft, damage              |
| Electronics             | 0.5-1.5%              | Theft, defects             |
| Restaurants             | 3-8%                  | Spoilage, over-portioning  |
| Pharmacy                | 0.5-1%                | Expiration, damage         |
| Construction materials  | 2-4%                  | Breakage, theft on-site    |

**LatAm note:** In markets with higher theft rates (parts of Brazil, Mexico, Central
America), shrinkage can run 1-2 percentage points higher than global averages. Kitz
should allow configurable shrinkage rates per location.

---

## Part 2: Supply Chain & Logistics

### 2.1 Supplier Discovery in LatAm

#### International Import Sources

**Alibaba / AliExpress (China-based)**
- Most popular import source for LatAm SMBs purchasing electronics, accessories, tools,
  clothing, and beauty products.
- Typical lead times: 30-60 days by sea, 7-15 days by air
- Minimum order quantities (MOQs) vary widely: some as low as 1 unit (AliExpress),
  others 500+ (Alibaba factory direct)
- Payment: Alibaba Trade Assurance, letters of credit, wire transfer
- Risk mitigation: Use Alibaba Gold Suppliers; request samples before bulk orders;
  consider inspection services (SGS, Bureau Veritas)

**Mercado Libre Negocios (Regional B2B)**
- Launched in late 2024, Mercado Libre's B2B platform "Negocios" is designed for
  wholesale purchasing across Latin America.
- Over 4 million users authorized for wholesale purchases across the region.
- Available in Mexico and Chile with Brazil launching soon.
- Businesses link tax ID (RFC, RUT, etc.) to unlock wholesale pricing, volume discounts,
  and approved invoicing.
- Integrated with Mercado Pago for flexible financing options.
- Advantage: Domestic fulfillment infrastructure (Mercado Envios) means faster delivery
  than cross-border imports.

**Other B2B Platforms:**
- **B2B Chile:** Focused on connecting domestic and international suppliers with Chilean
  buyers across food & beverage, agriculture, machinery, and chemicals.
- **Solostocks:** Spanish B2B platform covering LatAm; wholesale and supplier discovery
  for multiple verticals.
- **Globy:** B2B matching platform for suppliers and buyers worldwide with LatAm coverage.
- **IndustryStock LatAm:** Industrial products and machinery directory.
- **DirectIndustry:** Online industrial exhibition; useful for capital equipment sourcing.

#### Local Wholesale Markets

These massive physical markets remain the backbone of supply for food, beverage, and
basic consumer goods SMBs across Latin America.

**Central de Abastos, Mexico City (CEDA)**
- Largest wholesale market in the world: 3.27 km2 (larger than Monaco)
- Over 2,000 businesses, 70,000+ employees, 300,000+ daily visitors
- Handles 30,000+ tonnes of merchandise daily
- 35% of all food consumed in Mexico passes through CEDA
- Open 24/7; specializes in produce, dry goods, and packaged foods
- Prices are 30-50% below retail for bulk purchases
- Accepts cash and increasingly digital payments

**CEAGESP, Sao Paulo, Brazil**
- Companhia de Entrepostos e Armazens Gerais de Sao Paulo
- Largest wholesale produce market in South America
- Handles approximately 12,000 tonnes of food daily
- Over 3,000 vendors across fresh produce, flowers, fish, and packaged goods
- Key pricing reference for all of Brazil's agricultural commerce

**Corabastos, Bogota, Colombia**
- Corporacion de Abastos de Bogota
- Colombia's largest wholesale food market
- Over 6,500 commercial stalls
- Handles approximately 12,500 tonnes of food daily
- Main distribution hub for produce sourced from Colombia's agricultural regions

**Other major wholesale markets:**
- **Mercado de Productores, Lima, Peru:** Main wholesale food market for the capital
- **Lo Valledor, Santiago, Chile:** Largest wholesale market in Chile for produce and
  meats
- **Mercado de Abasto, Buenos Aires, Argentina:** Historic wholesale market and
  distribution center

#### Government Supplier Registries

Most LatAm governments maintain registries that can double as supplier discovery tools:

| Country   | Registry                        | Purpose                                    |
|-----------|---------------------------------|--------------------------------------------|
| Mexico    | CompraNet                       | Government procurement portal              |
| Colombia  | SECOP / Colombia Compra Eficiente | Public procurement transparency system   |
| Brazil    | ComprasNet / Portal de Compras  | Federal government purchasing platform     |
| Chile     | ChileCompra / Mercado Publico   | Public procurement marketplace             |
| Peru      | OSCE / SEACE                    | Government contracting oversight           |
| Panama    | PanamaCompra                    | Government procurement portal              |

These registries list thousands of registered suppliers with verified tax IDs, product
categories, and fulfillment capabilities. Kitz agents can cross-reference these
registries to validate supplier legitimacy.

---

### 2.2 Logistics Providers

#### Last-Mile Delivery Platforms

These platforms are particularly valuable for SMBs that sell directly to consumers and
need flexible, on-demand delivery without maintaining their own fleet.

**Rappi**
- Founded in Bogota (2015); now the dominant multi-category delivery platform in LatAm
- Present in: Colombia, Mexico, Brazil, Argentina, Chile, Peru, Ecuador, Costa Rica,
  Uruguay
- Covers 60+ cities and 72+ municipalities in Colombia alone
- Key advantage: Presence in tier-2 and tier-3 cities overlooked by larger logistics
  players
- Amazon acquired a stake in Rappi (2025), signaling deeper e-commerce integration
- SMB use case: On-demand delivery for retail, food, pharmacy, and convenience items
- Commission: Typically 15-30% per order depending on category and volume

**PedidosYa (iFood in Brazil)**
- Owned by Delivery Hero (Germany)
- Dominant in: Argentina, Uruguay, Paraguay, Bolivia, Chile, Dominican Republic,
  Guatemala, Panama, and others
- In Brazil, Delivery Hero's iFood is the leading food delivery platform
- SMB use case: Restaurant delivery, grocery delivery, last-mile logistics
- Advantage: Deep penetration in smaller LatAm markets where Rappi has less presence

**Lalamove**
- Hong Kong-based, expanding across LatAm with focus on Mexico and Brazil
- Specializes in SME logistics: same-day and next-day deliveries
- Provides on-demand fleet access (motorcycles, vans, trucks)
- Ideal for: SMBs without logistics budgets or in-house fleet
- Transparent pricing; app-based booking; real-time tracking

**99 (DiDi subsidiary)**
- Ride-hailing turned logistics; operates primarily in Brazil
- 99Entrega: Same-day delivery service using driver network
- Advantage: Massive existing driver fleet provides rapid fulfillment

#### Parcel Shipping & Courier Services

| Provider       | Country Focus    | Strengths                                     | SMB Features                      |
|----------------|-----------------|-----------------------------------------------|-----------------------------------|
| Servientrega   | Colombia (HQ), Ecuador, Peru, US | 2,000+ vehicles, 3,700+ branches | Route optimization, real-time tracking |
| Estafeta       | Mexico           | 1,200+ contact points, 40+ years experience   | National air + ground network     |
| Correios       | Brazil           | Government postal service; widest coverage     | SEDEX (express), PAC (economy)    |
| Blue Express   | Chile            | E-commerce fulfillment, warehousing            | Evolved from Lan Courier (2008)   |
| Enviaflores    | Mexico           | Specialized in delicate/perishable goods       | Cold chain capability             |
| Inter Rapidisimo| Colombia        | Domestic parcel, money orders                  | Rural coverage                    |
| Chilexpress    | Chile            | Domestic parcel, e-commerce integration        | API for automated shipping        |
| Deprisa        | Colombia         | Part of Avianca group; express courier         | Air-based speed advantage         |

**Negotiating tip for SMBs:** Most carriers offer volume discounts starting at 50-100
monthly shipments. Kitz should aggregate shipping volume data and alert SMBs when they
cross discount thresholds.

#### Freight & Cross-Border Logistics

**Major international carriers with LatAm operations:**

| Carrier | LatAm Coverage | Key Service               | SMB Offering              |
|---------|---------------|---------------------------|---------------------------|
| DHL     | All major markets | Express, freight, supply chain | DHL Express Easy for SMBs |
| FedEx   | All major markets | Express, ground, freight  | FedEx One Rate for predictable pricing |
| UPS     | All major markets | Express, freight, logistics | UPS Digital Access Program |
| Maersk  | Port-to-port   | Ocean freight, intermodal | Maersk Spot for instant quotes |

**Regional freight providers:**
- **Solistica (Mexico/LatAm):** Largest Mexican logistics company; warehouse management,
  distribution, freight.
- **Andreani (Argentina):** Leading logistics provider in Argentina; e-commerce
  fulfillment.
- **Total Express (Brazil):** E-commerce logistics; last-mile delivery.
- **Cubbo (Mexico):** Tech-enabled fulfillment for e-commerce SMBs.

**Cross-border payment solutions:**
- **dLocal:** Payment processing enabling cross-border transactions across 40+ LatAm
  markets. Handles FX conversion, local payment methods.
- **Ebanx:** Brazilian fintech processing cross-border payments; enables international
  suppliers to accept local payment methods (Boleto, OXXO, PSE, etc.).
- **Payoneer:** Popular with LatAm SMBs importing from Alibaba; multi-currency accounts.

---

### 2.3 Shipping Cost Optimization

#### Rate Negotiation Strategies

1. **Volume commitment:** Guarantee a minimum monthly shipment count in exchange for
   discounted per-shipment rates (typically 10-25% savings).
2. **Multi-carrier strategy:** Maintain accounts with 2-3 carriers; use competition to
   leverage better pricing. Kitz can auto-route to cheapest option per shipment.
3. **Contract length:** Annual contracts with quarterly volume reviews offer better rates
   than spot pricing.
4. **Off-peak shipping:** Avoid peak seasons (Nov-Dec, Valentine's, Mother's Day) for
   non-urgent freight. Rates can spike 20-40% during peaks.

#### Consolidation Strategies

- **Order consolidation:** Batch multiple small orders into a single shipment. If a
  retailer orders from 5 suppliers in the same city, combine into one pickup.
- **Warehouse consolidation:** Use a bonded warehouse or fulfillment center near major
  ports (Manzanillo, Santos, Buenaventura, Callao) to consolidate imports before
  inland distribution.
- **Milk run scheduling:** For regular B2B deliveries, establish fixed routes visiting
  multiple customers on a schedule (common for beverage and food distributors in LatAm).

#### Zone-Based Pricing

Most LatAm carriers use zone-based pricing similar to the US model:

```
Zone 1: Same city / metropolitan area        (lowest cost)
Zone 2: Same state / department / region
Zone 3: Adjacent states / regions
Zone 4: National (distant states)
Zone 5: Remote / rural areas                 (highest cost; 2-5x Zone 1)
```

**Kitz optimization:** Automatically identify customer clusters by zone and suggest
optimal fulfillment points. An SMB in Guadalajara shipping 40% of orders to CDMX might
benefit from a small satellite inventory in CDMX.

#### Free Shipping Thresholds

Free shipping is a powerful conversion tool for e-commerce SMBs, but the threshold must
be calculated carefully.

```
Minimum Free Shipping Threshold = Average Shipping Cost / Target Gross Margin

Example:
- Average shipping cost: MXN 120
- Target gross margin: 35%
- Minimum threshold = 120 / 0.35 = MXN 343

Recommended threshold: MXN 499 (round up to psychologically appealing number)
This provides margin headroom and encourages larger basket sizes.
```

**LatAm benchmarks for free shipping thresholds:**
- Mexico: MXN 499-999 (varies by category)
- Colombia: COP 80,000-150,000
- Brazil: BRL 99-199
- Chile: CLP 20,000-40,000
- Argentina: Highly variable due to inflation; frequently updated

---

## Part 3: Import/Export & Trade

### 3.1 Free Trade Agreements Map

Latin America is covered by a complex web of overlapping trade agreements. Understanding
these agreements is critical for SMBs importing raw materials or finished goods, as
preferential tariff rates can reduce landed costs by 5-35%.

#### USMCA (United States-Mexico-Canada Agreement)

- **Members:** United States, Mexico, Canada
- **Effective:** July 1, 2020 (replaced NAFTA)
- **Key provisions:**
  - Duty-free treatment for qualifying North American goods
  - Rules of origin require minimum regional value content (typically 75% for autos,
    varying by product)
  - Certificate of origin requires 9 data elements for preferential treatment
  - Digital trade chapter: No customs duties on digital products
  - De minimis threshold: USD $117 for Mexico (duty-free entry for low-value shipments)
- **2026 review:** The USMCA is subject to a joint review in 2026. If renewed, it
  continues for 16 years with a subsequent review in 2032.
- **SMB impact:** Mexican SMBs importing US goods or exporting to the US benefit from
  zero or reduced tariffs on most manufactured goods, agricultural products, and textiles
  meeting rules of origin.

#### Pacific Alliance (Alianza del Pacifico)

- **Members:** Mexico, Colombia, Peru, Chile
- **Effective:** 2016 (protocol entered into force)
- **Observer states:** 60+ countries including the US, Canada, and EU members
- **Key provisions:**
  - 92% of tariffs eliminated upon entry into force (2016)
  - Remaining tariffs phased to zero by 2030 (most by 2020)
  - Free movement of people (tourist visa elimination among members)
  - Joint stock exchange integration (MILA -- Mercado Integrado Latinoamericano)
  - Combined GDP: ~USD $2 trillion (9th largest economy if counted as one)
  - Combined exports: ~USD $680 billion (roughly 2x Mercosur's export value)
- **SMB impact:** A Colombian SMB can source goods from Mexico, Peru, or Chile duty-free
  for most product categories. This is particularly valuable for textiles, agricultural
  goods, and manufactured products.

#### Mercosur (Mercado Comun del Sur)

- **Full members:** Brazil, Argentina, Uruguay, Paraguay
- **Associate members:** Bolivia (accession in progress), Chile, Colombia, Ecuador,
  Guyana, Peru, Suriname
- **Key provisions:**
  - Common External Tariff (CET): Average 11.5%, ranging from 0% to 35% ad valorem
  - Free trade zone among full members (most goods traded duty-free internally)
  - National List of Exceptions (LETEC) allows members to deviate from CET:
    - Brazil and Argentina: up to 150 exceptions (expanding to 150 by 2028)
    - Uruguay: up to 275 exceptions (by 2029)
    - Paraguay: up to 699 exceptions (by 2030)
  - 2025 update: Mercosur expanded exceptions and temporarily removed some tariffs amid
    global trade tensions
- **EU-Mercosur agreement:** Landmark deal reached in late 2024 after 25+ years of
  negotiation; pending ratification. Would create one of the world's largest free trade
  zones.
- **SMB impact:** Brazilian SMBs can import from Argentina, Uruguay, and Paraguay
  duty-free. The CET applies to goods from outside the bloc.

#### CAFTA-DR (Dominican Republic-Central America FTA)

- **Members:** United States, Costa Rica, El Salvador, Guatemala, Honduras, Nicaragua,
  Dominican Republic
- **Effective:** 2006-2009 (staggered entry by country)
- **Key provisions:**
  - Immediately eliminated tariffs on 80% of US non-textile manufactured goods exports
  - Immediately eliminated tariffs on 50% of US agricultural goods exports
  - Remaining agricultural tariffs phased out over 15-20 years
  - Flexible rules of origin encouraging regional integration
  - Total US trade with CAFTA-DR: ~$108.5 billion (2022)
- **SMB impact:** Central American SMBs importing US goods (machinery, inputs, tech)
  benefit from zero or declining tariffs. Textile and apparel manufacturers in the region
  benefit from preferential access to the US market.

#### CAN (Andean Community / Comunidad Andina)

- **Members:** Bolivia, Colombia, Ecuador, Peru
- **Established:** 1969 (Cartagena Agreement)
- **Key provisions:**
  - Free trade zone since 1993: duty-free trade among members for virtually all goods
  - Common external tariff covering 90% of imports (agreed 1994)
  - Coordination of economic and trade policies
  - Andean Customs Value Declaration required for imports over USD $5,000 FOB
- **SMB impact:** Colombian SMBs can source from Ecuador, Peru, and Bolivia duty-free.
  Particularly relevant for agricultural products, textiles, and basic manufactures.

#### CARICOM (Caribbean Community)

- **Members:** 15 Caribbean nations including Jamaica, Trinidad & Tobago, Barbados,
  Guyana, Suriname, Bahamas, Belize, and others
- **Key provisions:**
  - CARICOM Single Market and Economy (CSME): Free movement of goods, services, capital,
    and skilled labor
  - Common External Tariff ranging from 0-20%
  - Special provisions for less-developed country members
- **SMB impact:** Relevant for SMBs operating across Caribbean markets or sourcing
  Caribbean products (rum, sugar, spices, seafood).

#### Bilateral Agreements Matrix

The following table shows key bilateral FTAs relevant to LatAm SMBs:

| Country  | FTAs with                                                              |
|----------|------------------------------------------------------------------------|
| Mexico   | US/Canada (USMCA), EU, Japan, Israel, EFTA, Colombia, Chile, Peru, Central America, and 40+ more |
| Colombia | US, EU, South Korea, Costa Rica, Pacific Alliance, CAN, Mercosur (associate) |
| Brazil   | Mercosur partners, Israel, Egypt, India (partial), EU (pending Mercosur deal) |
| Chile    | US, EU, China, Japan, South Korea, Australia, Canada, EFTA, Pacific Alliance, and 60+ more |
| Peru     | US, EU, China, Japan, South Korea, Canada, EFTA, Pacific Alliance, CAN |
| Panama   | US, EU, Central America, Taiwan, Singapore, and others                  |

**Chile is the most connected LatAm economy by FTAs**, with agreements covering over
65 countries. Chilean SMBs have preferential access to virtually all major global markets.

---

### 3.2 Import Documentation by Country

#### Mexico

| Document                    | Description                                              | Required? |
|-----------------------------|----------------------------------------------------------|-----------|
| Pedimento de Importacion    | Official customs declaration; cornerstone of clearance    | Mandatory |
| RFC (Registro Federal de Contribuyentes) | Mexican tax ID; must be active with SAT    | Mandatory |
| Commercial Invoice (Spanish)| Itemized invoice with prices, quantities, Incoterms      | Mandatory |
| Bill of Lading / Airway Bill| Transport document proving title to goods                | Mandatory |
| Packing List                | Detailed list of package contents, weights, dimensions    | Mandatory |
| Certificate of Origin       | Required for preferential tariff treatment under FTAs     | If claiming FTA |
| Normas Oficiales Mexicanas (NOMs) | Product safety/performance compliance certificates | For regulated goods |
| Padron de Importadores      | Importer registry enrollment at SAT                      | Mandatory |

**Key requirements:**
- Only a licensed Mexican customs broker (agente aduanal) can file the Pedimento
- Clearance is done electronically through SAAI (Sistema Aduanero Automatizado Integral)
- Importer must have an active RFC and advanced electronic signature (e.firma) from SAT
- USMCA origin certification requires 9 data elements for preferential rates
- De minimis threshold: USD $117 (goods below this value enter duty-free)

#### Colombia

| Document                        | Description                                          | Required? |
|---------------------------------|------------------------------------------------------|-----------|
| Declaracion de Importacion      | Customs import declaration filed with DIAN            | Mandatory |
| RUT (Registro Unico Tributario) | Tax registry; must include Code 23 (Importer)        | Mandatory |
| NIT (Numero de Identificacion Tributaria) | Tax ID number obtained via RUT          | Mandatory |
| Commercial Invoice              | Detailed invoice with product descriptions and values | Mandatory |
| Bill of Lading / Airway Bill    | Transport document                                   | Mandatory |
| Packing List                    | Package contents and dimensions                      | Mandatory |
| Andean Customs Value Declaration| Required when import value >= USD $5,000 FOB          | Conditional |
| Certificate of Origin           | For FTA preferential tariff treatment                 | If claiming FTA |
| Import Registration (Registro de Importacion) | Prior registration for certain goods  | For regulated goods |

**Key requirements:**
- Mandatory Advance Declaration: Must be submitted at least 48 hours before goods arrive
  (DIAN new regulation, full implementation expected Q1 2026)
- Failure to submit advance declaration: Fine of 1% of FOB value, max 300 UVT per
  transport document
- Customs broker required for commercial imports
- IVA (VAT) on imports: 19% standard rate
- Customs duty rates: 0-35% depending on product and origin

#### Brazil

| Document                        | Description                                          | Required? |
|---------------------------------|------------------------------------------------------|-----------|
| Declaracao de Importacao (DI)   | Electronic import declaration via Siscomex            | Mandatory |
| CNPJ (Cadastro Nacional da Pessoa Juridica) | Corporate tax ID (14 digits)          | Mandatory |
| RADAR (Habilitacao no Siscomex) | Authorization to operate in Siscomex system           | Mandatory |
| Commercial Invoice              | Detailed invoice; must match DI exactly               | Mandatory |
| Bill of Lading / Airway Bill    | Transport document                                   | Mandatory |
| Packing List                    | Package details                                      | Mandatory |
| Certificate of Origin           | For Mercosur or other FTA preferential rates          | If claiming FTA |
| LI (Licenca de Importacao)      | Import license for certain controlled goods           | For regulated goods |
| NF-e (Nota Fiscal Eletronica)   | Electronic invoice for domestic movement post-customs | Mandatory |

**Key requirements:**
- Foreign companies cannot import directly; must have a Brazilian subsidiary with CNPJ
- RADAR registration with Receita Federal is mandatory to access Siscomex
- RADAR categories: Express (up to USD $50,000/semester), Limited (up to USD
  $150,000/semester), Unlimited
- Siscomex is the integrated foreign trade system handling all import/export declarations
- Taxes on imports: II (Import Tax: 0-35%), IPI (manufactured goods tax: 0-300%+),
  PIS/COFINS (social contributions: ~11.75% combined), ICMS (state VAT: 17-25%)
- Brazil is known for having one of the most complex and costly import regimes in LatAm

#### Chile

| Document                        | Description                                          | Required? |
|---------------------------------|------------------------------------------------------|-----------|
| Declaracion de Ingreso (DIN)    | Import declaration filed with Servicio Nacional de Aduanas | Mandatory |
| RUT (Rol Unico Tributario)      | Chilean tax ID number                                | Mandatory |
| Commercial Invoice              | Detailed invoice with values and descriptions         | Mandatory |
| Bill of Lading / Airway Bill    | Transport document proving title                     | Mandatory |
| Packing List                    | Package details                                      | Mandatory |
| Importer Affidavit              | Sworn statement on merchandise prices (form from customs agent) | Mandatory |
| Certificate of Origin           | For FTA preferential tariff treatment                 | If claiming FTA |
| DUS (Documento Unico de Salida) | **Export** document (not import)                     | For exports |

**Key requirements:**
- Customs agent (agente de aduanas) required for imports over USD $1,000 FOB
- For imports under USD $1,000 FOB: Importer can self-clear with original bill of lading,
  commercial invoice, and power of attorney (if using third party)
- General import duty: 6% ad valorem (one of the lowest in LatAm, reflecting Chile's
  open trade policy)
- IVA on imports: 19%
- Chile's extensive FTA network means effective duty rates are 0% for goods from
  most major trading partners

#### Panama

| Document                        | Description                                          | Required? |
|---------------------------------|------------------------------------------------------|-----------|
| Declaracion de Aduanas          | Customs declaration filed with Autoridad Nacional de Aduanas | Mandatory |
| RUC (Registro Unico de Contribuyente) | Taxpayer ID                                  | Mandatory |
| Commercial Invoice              | Detailed invoice                                     | Mandatory |
| Bill of Lading / Airway Bill    | Transport document                                   | Mandatory |
| Packing List                    | Package details                                      | Mandatory |
| Certificate of Origin           | For FTA preferential treatment                        | If claiming FTA |
| Aviso de Operacion              | Business operation notice                            | Mandatory |

**Key requirements:**
- Panama's Colon Free Zone (Zona Libre de Colon) is the largest free trade zone in the
  Western Hemisphere and second largest in the world
- Goods entering the Colon Free Zone are exempt from import duties
- Standard import duty: 0-15% (relatively low)
- ITBMS (VAT equivalent): 7%

#### Common Documents Across All Countries

1. **Commercial Invoice:** Must include seller/buyer details, product descriptions,
   quantities, unit prices, total values, Incoterms, payment terms, and HS codes.
2. **Packing List:** Itemized list of contents per package with weights and dimensions.
3. **Bill of Lading (ocean) / Airway Bill (air) / Carta de Porte (land):** Transport
   contract and proof of title to goods.
4. **Certificate of Origin:** Required to claim preferential tariff rates under FTAs.
   Format varies by agreement.
5. **Insurance Certificate:** Proof of cargo insurance covering the shipment.
6. **Phytosanitary / Health Certificates:** Required for food, agricultural, and animal
   products (issued by exporting country's authority).

---

### 3.3 Landed Cost Calculator

#### Detailed Component Breakdown

```
Total Landed Cost = CIF Value + Customs Duties + Taxes + Fees

Where:
  CIF Value      = Product Cost (FOB) + International Freight + Insurance
  Customs Duties = CIF Value x Duty Rate (adjusted for FTA preferences)
  Taxes          = (CIF Value + Customs Duties) x VAT Rate
  Fees           = Broker Fees + Port Charges + Documentation + Local Transport
```

**Incoterms impact on cost allocation:**

| Incoterm | Seller Responsible For                          | Buyer Responsible For                    |
|----------|------------------------------------------------|------------------------------------------|
| EXW      | Product only                                    | All transport, insurance, customs         |
| FOB      | Product + domestic transport to port + export   | Ocean freight, insurance, import customs  |
| CIF      | Product + freight + insurance to destination port | Import customs, local transport          |
| DDP      | Everything including import duties and taxes     | Nothing (delivered duty paid)             |

Most LatAm SMB imports use FOB or CIF terms. Kitz should default to FOB and calculate
all downstream costs.

---

### 3.4 Tariff Lookup Resources

#### Harmonized System (HS) Codes

The Harmonized System is a standardized numerical method of classifying traded products,
maintained by the World Customs Organization (WCO).

**Structure:**
```
HS Code: XXXX.XX.XX.XX
         |    |  |  |
         |    |  |  +-- National subheading (country-specific, 2-4 additional digits)
         |    |  +----- Subheading (6 digits, internationally standardized)
         |    +-------- Heading (4 digits)
         +------------- Chapter (2 digits)
```

**Example:** HS 6109.10 = T-shirts, singlets, and other vests, of cotton
- Chapter 61: Knitted or crocheted articles of apparel
- Heading 6109: T-shirts, singlets, and other vests
- Subheading 6109.10: Of cotton

**Per-country tariff databases:**

| Country   | Tariff Database                | URL / Access                           |
|-----------|-------------------------------|----------------------------------------|
| Mexico    | SIAVI (SAT)                   | economia-snci.gob.mx                   |
| Colombia  | Arancel de Aduanas (DIAN)     | muisca.dian.gov.co                     |
| Brazil    | TEC (Tarifa Externa Comum)    | siscomex.gov.br                        |
| Chile     | Arancel Aduanero Nacional     | aduana.cl                              |
| Peru      | Arancel de Aduanas (SUNAT)    | sunat.gob.pe                           |
| Panama    | Arancel Nacional (ANA)        | ana.gob.pa                             |
| Global    | WTO Tariff Download Facility  | tariffdata.wto.org                     |
| Global    | Customs Info Database          | customsinfo.com (free registration)    |
| Global    | FindHS.codes                  | findhs.codes                           |

**Preferential tariff rates under FTAs:**
- When importing goods that qualify under an FTA, the preferential tariff rate can be
  significantly lower (often 0%) compared to the MFN (Most Favored Nation) rate.
- To claim preferential rates, the importer must present a valid Certificate of Origin
  or origin declaration meeting the specific FTA's requirements.
- Rules of origin vary by FTA and product: typically require a minimum percentage of
  regional value content or a change in tariff classification.

---

### 3.5 Customs & Compliance

#### Customs Broker Requirements by Country

| Country   | Broker Required?                              | Licensing                                |
|-----------|----------------------------------------------|------------------------------------------|
| Mexico    | Yes, for all commercial imports               | Licensed by SAT; ~900 active brokers     |
| Colombia  | Yes, for commercial imports                   | Licensed by DIAN; registered as customs user |
| Brazil    | Yes, or can use a trading company             | Registered despachante aduaneiro         |
| Chile     | Yes, for imports over USD $1,000 FOB          | Licensed agente de aduanas              |
| Peru      | Yes, for imports over USD $2,000 FOB          | Licensed by SUNAT                       |
| Panama    | Yes, for commercial imports                   | Licensed corredor de aduanas            |

#### Documentation Retention Requirements

| Country   | Retention Period | Authority |
|-----------|-----------------|-----------|
| Mexico    | 5 years         | SAT       |
| Colombia  | 5 years         | DIAN      |
| Brazil    | 5 years         | Receita Federal |
| Chile     | 5 years         | SNA (Aduanas) |
| Peru      | 5 years         | SUNAT     |
| Panama    | 5 years         | ANA       |

Most LatAm countries require 5-year retention of all customs documentation. Kitz should
store digital copies of all trade documents with timestamps and immutable records.

#### Prohibited/Restricted Goods (Common Across LatAm)

- **Prohibited:** Narcotics, counterfeit goods, weapons (without permits), hazardous
  waste, endangered species products (CITES), child pornography material
- **Restricted (require special permits):** Pharmaceuticals, chemicals, firearms,
  explosives, radioactive materials, certain agricultural products, used vehicles (varies
  by country), used tires, certain electronics (require homologation)

#### Anti-Dumping Duties

- Mexico, Brazil, Colombia, and Argentina are the most active users of anti-dumping
  measures in LatAm
- Common targets: Chinese steel, textiles, chemicals, and certain manufactured goods
- Anti-dumping duties can add 10-200%+ to the normal tariff rate
- Kitz should maintain a watchlist of products subject to anti-dumping duties in each
  target market

---

## Part 4: TypeScript Implementations for Kitz

### 4.1 Inventory Management Engine

```typescript
// ============================================================
// Kitz Inventory Management Module
// ============================================================

// --- Types ---

type InventoryMethod = 'FIFO' | 'WEIGHTED_AVERAGE';

type ABCCategory = 'A' | 'B' | 'C';

interface InventoryItem {
  sku: string;
  name: string;
  category: ABCCategory;
  currentStock: number;
  unitCost: number;
  reorderPoint: number;
  safetyStock: number;
  parLevel: number;
  leadTimeDays: number;
  averageDailySales: number;
  maxDailySales: number;
  stdDevDailySales: number;
  stdDevLeadTime: number;
  annualRevenue: number;
  shrinkageRate: number;         // decimal, e.g. 0.03 for 3%
  method: InventoryMethod;
}

interface InventoryBatch {
  batchId: string;
  sku: string;
  quantity: number;
  unitCost: number;
  receivedDate: Date;
  expirationDate?: Date;
}

interface SaleRecord {
  sku: string;
  quantitySold: number;
  saleDate: Date;
  unitPrice: number;
}

interface InventoryTurnoverResult {
  sku: string;
  turnoverRatio: number;
  daysOfInventory: number;
  assessment: 'HEALTHY' | 'SLOW_MOVING' | 'OVERSTOCK' | 'UNDERSTOCK';
}

interface ReorderAlert {
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  estimatedStockoutDate: Date;
  urgency: 'CRITICAL' | 'WARNING' | 'NORMAL';
}

// --- Safety Stock Calculations ---

/**
 * Basic fixed safety stock: Average daily sales * safety days
 */
function calculateBasicSafetyStock(
  avgDailySales: number,
  safetyDays: number
): number {
  return Math.ceil(avgDailySales * safetyDays);
}

/**
 * Lead time demand method:
 * (Max daily sales * Max lead time) - (Avg daily sales * Avg lead time)
 */
function calculateLeadTimeSafetyStock(
  maxDailySales: number,
  maxLeadTimeDays: number,
  avgDailySales: number,
  avgLeadTimeDays: number
): number {
  const worstCase = maxDailySales * maxLeadTimeDays;
  const normalCase = avgDailySales * avgLeadTimeDays;
  return Math.ceil(worstCase - normalCase);
}

/**
 * Statistical safety stock using service level (Z-score):
 * Z * sigma_demand * sqrt(lead_time)
 */
function calculateStatisticalSafetyStock(
  serviceLevel: number,      // e.g. 0.95 for 95%
  stdDevDailySales: number,
  avgLeadTimeDays: number
): number {
  const zScore = getZScore(serviceLevel);
  return Math.ceil(zScore * stdDevDailySales * Math.sqrt(avgLeadTimeDays));
}

/**
 * Combined variability safety stock (demand + lead time):
 * Z * sqrt((avgLeadTime * sigma_demand^2) + (avgDemand^2 * sigma_leadTime^2))
 */
function calculateCombinedSafetyStock(
  serviceLevel: number,
  avgDailySales: number,
  stdDevDailySales: number,
  avgLeadTimeDays: number,
  stdDevLeadTimeDays: number
): number {
  const zScore = getZScore(serviceLevel);
  const demandVariance = avgLeadTimeDays * Math.pow(stdDevDailySales, 2);
  const leadTimeVariance = Math.pow(avgDailySales, 2) * Math.pow(stdDevLeadTimeDays, 2);
  return Math.ceil(zScore * Math.sqrt(demandVariance + leadTimeVariance));
}

/**
 * Lookup Z-score for common service levels.
 * Covers the most common service levels used by SMBs.
 */
function getZScore(serviceLevel: number): number {
  const zScoreTable: Record<number, number> = {
    0.85: 1.04,
    0.90: 1.28,
    0.95: 1.65,
    0.97: 1.88,
    0.98: 2.05,
    0.99: 2.33,
    0.995: 2.58,
    0.999: 3.09,
  };

  const closest = Object.keys(zScoreTable)
    .map(Number)
    .reduce((prev, curr) =>
      Math.abs(curr - serviceLevel) < Math.abs(prev - serviceLevel)
        ? curr
        : prev
    );

  return zScoreTable[closest];
}

// --- Reorder Point ---

/**
 * Calculate the reorder point for an inventory item.
 * ROP = (Avg Daily Demand * Avg Lead Time) + Safety Stock
 */
function calculateReorderPoint(
  avgDailySales: number,
  avgLeadTimeDays: number,
  safetyStock: number
): number {
  return Math.ceil(avgDailySales * avgLeadTimeDays + safetyStock);
}

/**
 * Calculate the Economic Order Quantity (EOQ).
 * Minimizes total inventory cost (ordering + holding).
 *
 * EOQ = sqrt((2 * D * S) / H)
 * D = annual demand, S = cost per order, H = holding cost per unit per year
 */
function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number
): number {
  return Math.ceil(Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit));
}

// --- ABC Analysis ---

interface ABCAnalysisResult {
  sku: string;
  name: string;
  annualRevenue: number;
  revenuePercentage: number;
  cumulativePercentage: number;
  category: ABCCategory;
}

/**
 * Perform ABC analysis on a list of inventory items.
 * Classifies items by revenue contribution (80/15/5 rule).
 */
function performABCAnalysis(items: InventoryItem[]): ABCAnalysisResult[] {
  const totalRevenue = items.reduce((sum, item) => sum + item.annualRevenue, 0);

  const sorted = [...items].sort((a, b) => b.annualRevenue - a.annualRevenue);

  let cumulative = 0;
  return sorted.map((item) => {
    const revenuePercentage = (item.annualRevenue / totalRevenue) * 100;
    cumulative += revenuePercentage;

    let category: ABCCategory;
    if (cumulative <= 80) {
      category = 'A';
    } else if (cumulative <= 95) {
      category = 'B';
    } else {
      category = 'C';
    }

    return {
      sku: item.sku,
      name: item.name,
      annualRevenue: item.annualRevenue,
      revenuePercentage: Math.round(revenuePercentage * 100) / 100,
      cumulativePercentage: Math.round(cumulative * 100) / 100,
      category,
    };
  });
}

// --- Inventory Turnover ---

/**
 * Calculate inventory turnover ratio and days of inventory.
 * Turnover = COGS / Average Inventory Value
 * Days of Inventory = 365 / Turnover
 */
function calculateInventoryTurnover(
  cogs: number,
  averageInventoryValue: number,
  industryBenchmark?: { min: number; max: number }
): InventoryTurnoverResult & { cogs: number; averageInventoryValue: number } {
  const turnoverRatio =
    averageInventoryValue > 0 ? cogs / averageInventoryValue : 0;
  const daysOfInventory = turnoverRatio > 0 ? 365 / turnoverRatio : Infinity;

  let assessment: InventoryTurnoverResult['assessment'] = 'HEALTHY';
  if (industryBenchmark) {
    if (turnoverRatio < industryBenchmark.min * 0.7) {
      assessment = 'OVERSTOCK';
    } else if (turnoverRatio < industryBenchmark.min) {
      assessment = 'SLOW_MOVING';
    } else if (turnoverRatio > industryBenchmark.max * 1.3) {
      assessment = 'UNDERSTOCK';
    }
  }

  return {
    sku: 'ALL',
    turnoverRatio: Math.round(turnoverRatio * 100) / 100,
    daysOfInventory: Math.round(daysOfInventory),
    assessment,
    cogs,
    averageInventoryValue,
  };
}

// --- FIFO Cost Tracking ---

/**
 * Process a sale using FIFO method.
 * Consumes inventory from oldest batches first.
 * Returns the total COGS for the sale.
 */
function processFIFOSale(
  batches: InventoryBatch[],
  quantityToSell: number
): { cogs: number; remainingBatches: InventoryBatch[] } {
  // Sort batches by received date (oldest first)
  const sorted = [...batches].sort(
    (a, b) => a.receivedDate.getTime() - b.receivedDate.getTime()
  );

  let remaining = quantityToSell;
  let cogs = 0;
  const updatedBatches: InventoryBatch[] = [];

  for (const batch of sorted) {
    if (remaining <= 0) {
      updatedBatches.push(batch);
      continue;
    }

    if (batch.quantity <= remaining) {
      // Consume entire batch
      cogs += batch.quantity * batch.unitCost;
      remaining -= batch.quantity;
      // Batch is fully consumed; do not add to updatedBatches
    } else {
      // Partially consume batch
      cogs += remaining * batch.unitCost;
      updatedBatches.push({
        ...batch,
        quantity: batch.quantity - remaining,
      });
      remaining = 0;
    }
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient inventory: ${remaining} units could not be fulfilled`
    );
  }

  return { cogs: Math.round(cogs * 100) / 100, remainingBatches: updatedBatches };
}

// --- Weighted Average Cost Tracking ---

/**
 * Calculate the new weighted average cost after receiving a new batch.
 */
function updateWeightedAverage(
  currentStock: number,
  currentAvgCost: number,
  newQuantity: number,
  newUnitCost: number
): { totalStock: number; newAvgCost: number } {
  const totalStock = currentStock + newQuantity;
  const totalValue = currentStock * currentAvgCost + newQuantity * newUnitCost;
  const newAvgCost = totalStock > 0 ? totalValue / totalStock : 0;

  return {
    totalStock,
    newAvgCost: Math.round(newAvgCost * 100) / 100,
  };
}

// --- Reorder Alert Engine ---

/**
 * Scan inventory and generate reorder alerts.
 * Returns items at or below their reorder point.
 */
function generateReorderAlerts(items: InventoryItem[]): ReorderAlert[] {
  const alerts: ReorderAlert[] = [];
  const now = new Date();

  for (const item of items) {
    if (item.currentStock <= item.reorderPoint) {
      const daysUntilStockout =
        item.averageDailySales > 0
          ? item.currentStock / item.averageDailySales
          : Infinity;

      const estimatedStockoutDate = new Date(now);
      estimatedStockoutDate.setDate(
        estimatedStockoutDate.getDate() + Math.floor(daysUntilStockout)
      );

      // Suggested order: enough to reach par level + cover lead time
      const suggestedOrderQuantity = Math.max(
        item.parLevel - item.currentStock + item.averageDailySales * item.leadTimeDays,
        0
      );

      let urgency: ReorderAlert['urgency'];
      if (daysUntilStockout <= item.leadTimeDays) {
        urgency = 'CRITICAL'; // Will stock out before new order arrives
      } else if (daysUntilStockout <= item.leadTimeDays * 1.5) {
        urgency = 'WARNING';
      } else {
        urgency = 'NORMAL';
      }

      alerts.push({
        sku: item.sku,
        name: item.name,
        currentStock: item.currentStock,
        reorderPoint: item.reorderPoint,
        suggestedOrderQuantity: Math.ceil(suggestedOrderQuantity),
        estimatedStockoutDate,
        urgency,
      });
    }
  }

  // Sort by urgency: CRITICAL first, then WARNING, then NORMAL
  const urgencyOrder = { CRITICAL: 0, WARNING: 1, NORMAL: 2 };
  return alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}
```

---

### 4.2 Landed Cost Calculator

```typescript
// ============================================================
// Kitz Landed Cost Calculator
// ============================================================

// --- Types ---

interface LandedCostInput {
  // Product
  productCostFOB: number;           // Cost of goods at port of origin
  quantity: number;                  // Number of units
  productCurrency: string;          // Currency of product cost (e.g. 'USD', 'CNY')

  // Shipping
  internationalFreight: number;     // Sea/air/land freight cost
  freightCurrency: string;          // Currency of freight cost
  insuranceCost: number;            // Cargo insurance premium
  insuranceCurrency: string;

  // Customs & Taxes
  hsCode: string;                   // Harmonized System code
  customsDutyRate: number;          // Decimal (e.g. 0.10 for 10%)
  vatRate: number;                  // Decimal (e.g. 0.16 for 16% IVA)
  additionalTaxRates: TaxComponent[]; // Other taxes (IPI in Brazil, etc.)
  antiDumpingDutyRate?: number;     // If applicable

  // Fees
  customsBrokerFee: number;         // Fixed or percentage-based broker fee
  brokerFeeIsPercentage: boolean;   // true if broker charges % of CIF
  portHandlingCharges: number;      // Loading/unloading at port
  documentationFees: number;        // Paperwork, certificates
  inspectionFees: number;           // If physical inspection required
  localTransportCost: number;       // Port/airport to warehouse

  // FX
  targetCurrency: string;           // Destination currency (e.g. 'MXN')
  exchangeRates: ExchangeRateMap;   // Map of currency pair rates
  fxBufferPercent: number;          // Currency volatility buffer (e.g. 0.05 for 5%)

  // FTA
  ftaApplicable: boolean;           // Is an FTA rate being claimed?
  ftaPreferentialDutyRate?: number; // Reduced duty rate under FTA
}

interface TaxComponent {
  name: string;         // e.g. 'IPI', 'PIS', 'COFINS', 'ICMS'
  rate: number;         // Decimal
  base: TaxBase;        // What the tax is calculated on
}

type TaxBase = 'CIF' | 'CIF_PLUS_DUTY' | 'CIF_PLUS_DUTY_PLUS_TAXES' | 'CUSTOM';

interface ExchangeRateMap {
  [currencyPair: string]: number;   // e.g. { 'USD_MXN': 17.25, 'CNY_USD': 0.14 }
}

interface LandedCostResult {
  // Per-unit costs
  unitProductCost: number;
  unitFreightCost: number;
  unitInsuranceCost: number;
  unitCIFValue: number;
  unitCustomsDuty: number;
  unitVAT: number;
  unitAdditionalTaxes: number;
  unitFees: number;
  unitTotalLandedCost: number;

  // Total costs
  totalProductCost: number;
  totalFreightCost: number;
  totalInsuranceCost: number;
  totalCIFValue: number;
  totalCustomsDuty: number;
  totalVAT: number;
  totalAdditionalTaxes: number;
  totalFees: number;
  totalLandedCost: number;

  // Analysis
  dutyPercentOfTotal: number;
  taxPercentOfTotal: number;
  logisticsPercentOfTotal: number;
  landedCostMultiplier: number;     // Total landed / product cost ratio
  effectiveDutyRate: number;        // All duties as % of product cost
  currency: string;

  // Breakdown
  taxBreakdown: { name: string; amount: number }[];
  feeBreakdown: { name: string; amount: number }[];

  // FTA savings
  ftaSavings?: number;
}

// --- Core Calculator ---

function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const {
    productCostFOB,
    quantity,
    productCurrency,
    internationalFreight,
    freightCurrency,
    insuranceCost,
    insuranceCurrency,
    customsDutyRate,
    vatRate,
    additionalTaxRates,
    antiDumpingDutyRate,
    customsBrokerFee,
    brokerFeeIsPercentage,
    portHandlingCharges,
    documentationFees,
    inspectionFees,
    localTransportCost,
    targetCurrency,
    exchangeRates,
    fxBufferPercent,
    ftaApplicable,
    ftaPreferentialDutyRate,
  } = input;

  // Step 1: Convert all amounts to target currency
  const productInTarget = convertCurrency(
    productCostFOB,
    productCurrency,
    targetCurrency,
    exchangeRates,
    fxBufferPercent
  );

  const freightInTarget = convertCurrency(
    internationalFreight,
    freightCurrency,
    targetCurrency,
    exchangeRates,
    fxBufferPercent
  );

  const insuranceInTarget = convertCurrency(
    insuranceCost,
    insuranceCurrency,
    targetCurrency,
    exchangeRates,
    fxBufferPercent
  );

  // Step 2: Calculate CIF value
  const totalCIFValue = productInTarget + freightInTarget + insuranceInTarget;

  // Step 3: Calculate customs duties
  const effectiveDutyRate =
    ftaApplicable && ftaPreferentialDutyRate !== undefined
      ? ftaPreferentialDutyRate
      : customsDutyRate;

  let totalCustomsDuty = totalCIFValue * effectiveDutyRate;

  // Add anti-dumping duty if applicable
  if (antiDumpingDutyRate && antiDumpingDutyRate > 0) {
    totalCustomsDuty += totalCIFValue * antiDumpingDutyRate;
  }

  // Step 4: Calculate VAT and additional taxes
  const vatBase = totalCIFValue + totalCustomsDuty;
  const totalVAT = vatBase * vatRate;

  let totalAdditionalTaxes = 0;
  const taxBreakdown: { name: string; amount: number }[] = [
    { name: 'VAT/IVA', amount: round(totalVAT) },
  ];

  for (const tax of additionalTaxRates) {
    let taxBase: number;
    switch (tax.base) {
      case 'CIF':
        taxBase = totalCIFValue;
        break;
      case 'CIF_PLUS_DUTY':
        taxBase = totalCIFValue + totalCustomsDuty;
        break;
      case 'CIF_PLUS_DUTY_PLUS_TAXES':
        taxBase = totalCIFValue + totalCustomsDuty + totalVAT + totalAdditionalTaxes;
        break;
      default:
        taxBase = totalCIFValue + totalCustomsDuty;
    }
    const taxAmount = taxBase * tax.rate;
    totalAdditionalTaxes += taxAmount;
    taxBreakdown.push({ name: tax.name, amount: round(taxAmount) });
  }

  // Step 5: Calculate fees
  const brokerFee = brokerFeeIsPercentage
    ? totalCIFValue * customsBrokerFee
    : customsBrokerFee;

  const totalFees =
    brokerFee + portHandlingCharges + documentationFees + inspectionFees + localTransportCost;

  const feeBreakdown: { name: string; amount: number }[] = [
    { name: 'Customs broker', amount: round(brokerFee) },
    { name: 'Port handling', amount: round(portHandlingCharges) },
    { name: 'Documentation', amount: round(documentationFees) },
    { name: 'Inspection', amount: round(inspectionFees) },
    { name: 'Local transport', amount: round(localTransportCost) },
  ];

  // Step 6: Calculate total landed cost
  const totalLandedCost =
    totalCIFValue + totalCustomsDuty + totalVAT + totalAdditionalTaxes + totalFees;

  // Step 7: Calculate FTA savings
  let ftaSavings: number | undefined;
  if (ftaApplicable && ftaPreferentialDutyRate !== undefined) {
    const dutyWithoutFTA = totalCIFValue * customsDutyRate;
    const dutyWithFTA = totalCIFValue * ftaPreferentialDutyRate;
    ftaSavings = round(dutyWithoutFTA - dutyWithFTA);
  }

  // Step 8: Build result
  return {
    unitProductCost: round(productInTarget / quantity),
    unitFreightCost: round(freightInTarget / quantity),
    unitInsuranceCost: round(insuranceInTarget / quantity),
    unitCIFValue: round(totalCIFValue / quantity),
    unitCustomsDuty: round(totalCustomsDuty / quantity),
    unitVAT: round(totalVAT / quantity),
    unitAdditionalTaxes: round(totalAdditionalTaxes / quantity),
    unitFees: round(totalFees / quantity),
    unitTotalLandedCost: round(totalLandedCost / quantity),

    totalProductCost: round(productInTarget),
    totalFreightCost: round(freightInTarget),
    totalInsuranceCost: round(insuranceInTarget),
    totalCIFValue: round(totalCIFValue),
    totalCustomsDuty: round(totalCustomsDuty),
    totalVAT: round(totalVAT),
    totalAdditionalTaxes: round(totalAdditionalTaxes),
    totalFees: round(totalFees),
    totalLandedCost: round(totalLandedCost),

    dutyPercentOfTotal: round((totalCustomsDuty / totalLandedCost) * 100),
    taxPercentOfTotal:
      round(((totalVAT + totalAdditionalTaxes) / totalLandedCost) * 100),
    logisticsPercentOfTotal:
      round(
        ((freightInTarget + insuranceInTarget + totalFees) / totalLandedCost) * 100
      ),
    landedCostMultiplier: round(totalLandedCost / productInTarget),
    effectiveDutyRate: round((totalCustomsDuty / productInTarget) * 100),
    currency: targetCurrency,

    taxBreakdown,
    feeBreakdown,
    ftaSavings,
  };
}

// --- Currency Conversion ---

function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRateMap,
  bufferPercent: number
): number {
  if (fromCurrency === toCurrency) return amount;

  const directKey = `${fromCurrency}_${toCurrency}`;
  const inverseKey = `${toCurrency}_${fromCurrency}`;

  let rate: number;
  if (rates[directKey]) {
    rate = rates[directKey];
  } else if (rates[inverseKey]) {
    rate = 1 / rates[inverseKey];
  } else {
    // Try via USD as intermediary
    const toUSD = rates[`${fromCurrency}_USD`] || (1 / (rates[`USD_${fromCurrency}`] || 1));
    const fromUSD = rates[`USD_${toCurrency}`] || (1 / (rates[`${toCurrency}_USD`] || 1));
    rate = toUSD * fromUSD;
  }

  // Apply FX buffer (unfavorable direction for buyer)
  const bufferedRate = rate * (1 + bufferPercent);
  return amount * bufferedRate;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

// --- Country-Specific Presets ---

interface CountryTaxPreset {
  country: string;
  vatRate: number;
  avgDutyRate: number;
  additionalTaxes: TaxComponent[];
  brokerFeeEstimate: number;
  brokerFeeIsPercentage: boolean;
  notes: string;
}

const COUNTRY_TAX_PRESETS: CountryTaxPreset[] = [
  {
    country: 'MX',
    vatRate: 0.16,
    avgDutyRate: 0.10,
    additionalTaxes: [],
    brokerFeeEstimate: 0.005,     // ~0.5% of CIF
    brokerFeeIsPercentage: true,
    notes: 'IVA 16%. DTA (Derecho de Tramite Aduanero) 0.8% of CIF applies separately.',
  },
  {
    country: 'CO',
    vatRate: 0.19,
    avgDutyRate: 0.10,
    additionalTaxes: [],
    brokerFeeEstimate: 0.005,
    brokerFeeIsPercentage: true,
    notes: 'IVA 19%. Advance declaration required 48h before arrival (DIAN).',
  },
  {
    country: 'BR',
    vatRate: 0.0,  // Brazil uses cascading taxes instead of a single VAT
    avgDutyRate: 0.14,
    additionalTaxes: [
      { name: 'IPI', rate: 0.10, base: 'CIF_PLUS_DUTY' },
      { name: 'PIS', rate: 0.0207, base: 'CIF_PLUS_DUTY' },
      { name: 'COFINS', rate: 0.0965, base: 'CIF_PLUS_DUTY' },
      { name: 'ICMS', rate: 0.18, base: 'CIF_PLUS_DUTY_PLUS_TAXES' },
    ],
    brokerFeeEstimate: 0.01,
    brokerFeeIsPercentage: true,
    notes:
      'Brazil has the most complex import tax structure in LatAm. ' +
      'ICMS varies by state (17-25%). IPI varies by product (0-300%+). ' +
      'Effective total tax burden can reach 60-100%+ of product cost.',
  },
  {
    country: 'CL',
    vatRate: 0.19,
    avgDutyRate: 0.06,
    additionalTaxes: [],
    brokerFeeEstimate: 0.004,
    brokerFeeIsPercentage: true,
    notes:
      'IVA 19%. General duty 6% but effectively 0% for most goods ' +
      'due to Chile\'s extensive FTA network (65+ countries).',
  },
  {
    country: 'PE',
    vatRate: 0.18,
    avgDutyRate: 0.06,
    additionalTaxes: [
      { name: 'IPM', rate: 0.02, base: 'CIF_PLUS_DUTY' },
    ],
    brokerFeeEstimate: 0.005,
    brokerFeeIsPercentage: true,
    notes: 'IGV 18% + IPM 2% = effective 20% tax on imports.',
  },
  {
    country: 'PA',
    vatRate: 0.07,
    avgDutyRate: 0.08,
    additionalTaxes: [],
    brokerFeeEstimate: 0.005,
    brokerFeeIsPercentage: true,
    notes:
      'ITBMS 7%. Colon Free Zone goods exempt from duties. ' +
      'One of the lowest tax burdens in LatAm for imports.',
  },
];

/**
 * Get the tax preset for a given country code.
 */
function getCountryPreset(countryCode: string): CountryTaxPreset | undefined {
  return COUNTRY_TAX_PRESETS.find(
    (p) => p.country === countryCode.toUpperCase()
  );
}

// --- Usage Example ---

/*
const exampleInput: LandedCostInput = {
  productCostFOB: 5000,            // USD 5,000 worth of electronics from China
  quantity: 100,                    // 100 units
  productCurrency: 'USD',

  internationalFreight: 800,       // USD 800 ocean freight
  freightCurrency: 'USD',
  insuranceCost: 60,               // USD 60 cargo insurance
  insuranceCurrency: 'USD',

  hsCode: '8517.12',               // Mobile phones
  customsDutyRate: 0.10,           // 10% MFN duty
  vatRate: 0.16,                   // 16% IVA (Mexico)
  additionalTaxRates: [],
  antiDumpingDutyRate: 0,

  customsBrokerFee: 0.005,         // 0.5% of CIF
  brokerFeeIsPercentage: true,
  portHandlingCharges: 150,        // USD 150
  documentationFees: 50,           // USD 50
  inspectionFees: 0,
  localTransportCost: 200,         // USD 200 port to warehouse

  targetCurrency: 'MXN',
  exchangeRates: { 'USD_MXN': 17.25 },
  fxBufferPercent: 0.05,           // 5% currency buffer

  ftaApplicable: false,
  ftaPreferentialDutyRate: undefined,
};

const result = calculateLandedCost(exampleInput);
console.log(`Landed cost per unit: ${result.currency} ${result.unitTotalLandedCost}`);
console.log(`Landed cost multiplier: ${result.landedCostMultiplier}x`);
console.log(`FTA savings: ${result.ftaSavings ?? 'N/A'}`);
*/
```

---

### 4.3 Free Shipping Threshold Calculator

```typescript
// ============================================================
// Free Shipping Threshold Calculator for E-commerce SMBs
// ============================================================

interface FreeShippingInput {
  averageOrderValue: number;        // Current AOV
  averageShippingCost: number;      // Avg cost to fulfill an order
  grossMarginPercent: number;       // Target gross margin (decimal)
  currency: string;
  conversionLiftPercent?: number;   // Expected conversion increase from free shipping
  aovLiftPercent?: number;          // Expected AOV increase when threshold is set
}

interface FreeShippingResult {
  minimumViableThreshold: number;   // Break-even threshold
  recommendedThreshold: number;     // Rounded up for psychology
  currentAOV: number;
  projectedAOV: number;
  marginAtThreshold: number;        // Gross margin % at the threshold
  annualShippingCostAbsorbed: number;
  currency: string;
}

function calculateFreeShippingThreshold(
  input: FreeShippingInput,
  monthlyOrders: number
): FreeShippingResult {
  const {
    averageOrderValue,
    averageShippingCost,
    grossMarginPercent,
    currency,
    aovLiftPercent = 0.15, // Default 15% AOV lift when threshold is introduced
  } = input;

  // Minimum threshold: shipping cost must be covered by margin
  const minimumViableThreshold = averageShippingCost / grossMarginPercent;

  // Recommended: set above current AOV to encourage upsell
  const projectedAOV = averageOrderValue * (1 + aovLiftPercent);
  let recommendedThreshold = Math.max(minimumViableThreshold, projectedAOV);

  // Round up to psychologically appealing number
  recommendedThreshold = roundToPsychologicalPrice(recommendedThreshold, currency);

  // Calculate margin at threshold
  const marginAtThreshold =
    ((recommendedThreshold * grossMarginPercent - averageShippingCost) /
      recommendedThreshold) *
    100;

  // Estimate annual shipping cost absorbed
  // Assume 60% of orders will qualify for free shipping
  const qualifyingOrders = monthlyOrders * 12 * 0.6;
  const annualShippingCostAbsorbed = qualifyingOrders * averageShippingCost;

  return {
    minimumViableThreshold: round(minimumViableThreshold),
    recommendedThreshold: round(recommendedThreshold),
    currentAOV: averageOrderValue,
    projectedAOV: round(projectedAOV),
    marginAtThreshold: round(marginAtThreshold),
    annualShippingCostAbsorbed: round(annualShippingCostAbsorbed),
    currency,
  };
}

/**
 * Round to psychologically appealing price points by currency.
 */
function roundToPsychologicalPrice(value: number, currency: string): number {
  const thresholds: Record<string, number[]> = {
    MXN: [199, 299, 399, 499, 599, 699, 799, 999, 1499, 1999, 2999],
    COP: [50000, 80000, 100000, 120000, 150000, 200000, 250000, 300000, 500000],
    BRL: [49, 69, 79, 99, 129, 149, 199, 249, 299, 399, 499],
    CLP: [9990, 14990, 19990, 24990, 29990, 39990, 49990, 59990, 79990, 99990],
    PEN: [49, 69, 79, 99, 129, 149, 199, 249, 299],
    USD: [25, 35, 49, 59, 75, 99, 149, 199, 249, 299],
  };

  const available = thresholds[currency] || thresholds['USD'];
  // Find the smallest threshold >= value
  const match = available.find((t) => t >= value);
  return match || Math.ceil(value / 100) * 100 - 1;
}
```

---

### 4.4 FTA Eligibility Checker

```typescript
// ============================================================
// Free Trade Agreement Eligibility Checker
// ============================================================

interface FTARule {
  agreementName: string;
  agreementCode: string;
  members: string[];           // ISO country codes
  preferentialDutyRate: number; // Default preferential rate (0 for most)
  rulesOfOrigin: string;       // Description of origin requirements
  certificationRequired: string;
  effectiveDate: string;
  notes: string;
}

const FTA_DATABASE: FTARule[] = [
  {
    agreementName: 'USMCA',
    agreementCode: 'USMCA',
    members: ['US', 'MX', 'CA'],
    preferentialDutyRate: 0,
    rulesOfOrigin: 'Regional Value Content (RVC) varies by product. Autos: 75%. Most goods: tariff shift or RVC of 35-60%.',
    certificationRequired: 'USMCA Certificate of Origin with 9 required data elements. Self-certification permitted.',
    effectiveDate: '2020-07-01',
    notes: 'Subject to 2026 joint review. De minimis USD $117 for Mexico.',
  },
  {
    agreementName: 'Pacific Alliance',
    agreementCode: 'PA',
    members: ['MX', 'CO', 'PE', 'CL'],
    preferentialDutyRate: 0,
    rulesOfOrigin: '92% of goods duty-free since 2016. Remaining goods phased to 0% by 2030. Standard tariff shift or RVC rules.',
    certificationRequired: 'Pacific Alliance Certificate of Origin.',
    effectiveDate: '2016-05-01',
    notes: 'Combined GDP ~USD $2 trillion. 60+ observer states.',
  },
  {
    agreementName: 'Mercosur Internal',
    agreementCode: 'MERCOSUR',
    members: ['BR', 'AR', 'UY', 'PY'],
    preferentialDutyRate: 0,
    rulesOfOrigin: 'Mercosur rules of origin: typically 60% RVC or change in tariff heading.',
    certificationRequired: 'Mercosur Certificate of Origin.',
    effectiveDate: '1995-01-01',
    notes: 'CET averages 11.5% for non-members. Bolivia accession in progress.',
  },
  {
    agreementName: 'CAFTA-DR',
    agreementCode: 'CAFTA-DR',
    members: ['US', 'CR', 'SV', 'GT', 'HN', 'NI', 'DO'],
    preferentialDutyRate: 0,
    rulesOfOrigin: 'Flexible rules of origin encouraging regional integration. Tariff shift or RVC depending on product.',
    certificationRequired: 'CAFTA-DR Certificate of Origin (CBP Form 450).',
    effectiveDate: '2006-03-01',
    notes: '80% of non-textile manufactured goods duty-free immediately. Remaining ag tariffs phasing out over 20 years.',
  },
  {
    agreementName: 'Andean Community (CAN)',
    agreementCode: 'CAN',
    members: ['BO', 'CO', 'EC', 'PE'],
    preferentialDutyRate: 0,
    rulesOfOrigin: 'CAN rules of origin: typically 50% RVC or change in tariff subheading.',
    certificationRequired: 'CAN Certificate of Origin.',
    effectiveDate: '1993-01-01',
    notes: 'Free trade zone since 1993. Common external tariff covers 90% of imports.',
  },
  {
    agreementName: 'CARICOM',
    agreementCode: 'CARICOM',
    members: ['JM', 'TT', 'BB', 'GY', 'SR', 'BS', 'BZ', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'HT', 'MS'],
    preferentialDutyRate: 0,
    rulesOfOrigin: 'CARICOM rules of origin: goods must be wholly produced or substantially transformed within CARICOM.',
    certificationRequired: 'CARICOM Certificate of Origin.',
    effectiveDate: '1973-08-01',
    notes: 'CSME for free movement of goods, services, capital, and skilled labor. CET 0-20%.',
  },
];

interface FTACheckResult {
  eligible: boolean;
  applicableAgreements: {
    agreementName: string;
    agreementCode: string;
    preferentialDutyRate: number;
    certificationRequired: string;
    estimatedSavingsPercent: number;
    rulesOfOrigin: string;
  }[];
  bestAgreement?: string;
  bestSavingsPercent?: number;
}

/**
 * Check which FTAs apply between an origin and destination country.
 * Returns all applicable agreements sorted by potential savings.
 */
function checkFTAEligibility(
  originCountry: string,
  destinationCountry: string,
  mfnDutyRate: number
): FTACheckResult {
  const origin = originCountry.toUpperCase();
  const destination = destinationCountry.toUpperCase();

  const applicable = FTA_DATABASE.filter(
    (fta) => fta.members.includes(origin) && fta.members.includes(destination)
  );

  if (applicable.length === 0) {
    return { eligible: false, applicableAgreements: [] };
  }

  const agreements = applicable.map((fta) => {
    const savings = mfnDutyRate - fta.preferentialDutyRate;
    return {
      agreementName: fta.agreementName,
      agreementCode: fta.agreementCode,
      preferentialDutyRate: fta.preferentialDutyRate,
      certificationRequired: fta.certificationRequired,
      estimatedSavingsPercent: round(savings * 100),
      rulesOfOrigin: fta.rulesOfOrigin,
    };
  });

  // Sort by highest savings first
  agreements.sort((a, b) => b.estimatedSavingsPercent - a.estimatedSavingsPercent);

  return {
    eligible: true,
    applicableAgreements: agreements,
    bestAgreement: agreements[0].agreementName,
    bestSavingsPercent: agreements[0].estimatedSavingsPercent,
  };
}
```

---

## Appendix: Resources & References

### A. Key Trade and Logistics Portals

| Resource                             | URL                                    | Purpose                              |
|--------------------------------------|----------------------------------------|--------------------------------------|
| WTO Tariff Data                      | tariffdata.wto.org                     | Global tariff lookup                 |
| Customs Info Database                | customsinfo.com                        | Duty/tax estimation for 160+ countries |
| FindHS.codes                         | findhs.codes                           | HS code search engine                |
| US Census Bureau Schedule B          | census.gov/foreign-trade/schedules/b   | HS code finder                       |
| Mexico SAT (Tax Authority)           | sat.gob.mx                             | RFC, Pedimento, customs              |
| Colombia DIAN                        | dian.gov.co                            | RUT, import declarations             |
| Brazil Siscomex                      | siscomex.gov.br                        | Import/export declarations           |
| Chile Servicio Nacional de Aduanas   | aduana.cl                              | Chilean customs                      |
| Peru SUNAT                           | sunat.gob.pe                           | Peruvian customs and tax             |
| Panama ANA                           | ana.gob.pa                             | Panamanian customs                   |
| Mercado Libre Negocios               | mercadolibre.com                       | B2B wholesale marketplace            |
| Alibaba                              | alibaba.com                            | International B2B sourcing           |
| IDB (Inter-American Development Bank)| iadb.org                               | Trade data and research              |

### B. Government Procurement Portals (Supplier Discovery)

| Country   | Portal                 | URL                         |
|-----------|------------------------|-----------------------------|
| Mexico    | CompraNet              | compranet.hacienda.gob.mx   |
| Colombia  | SECOP                  | colombiacompra.gov.co       |
| Brazil    | ComprasNet             | comprasnet.gov.br           |
| Chile     | ChileCompra            | chilecompra.cl              |
| Peru      | SEACE                  | seace.gob.pe                |
| Panama    | PanamaCompra           | panamacompra.gob.pa         |

### C. Industry Benchmarks Quick Reference

| Metric                  | Restaurant | Retail Clothing | Electronics | Grocery |
|-------------------------|------------|-----------------|-------------|---------|
| Inventory Turnover (yr) | 48-96x     | 4-6x            | 8-12x       | 15-25x  |
| Gross Margin            | 60-70%     | 45-65%          | 20-35%      | 25-35%  |
| Shrinkage Rate          | 3-8%       | 1.5-3%          | 0.5-1.5%    | 2-5%    |
| Safety Stock Days       | 1-2 days   | 14-30 days      | 7-14 days   | 3-7 days|
| Reorder Lead Time       | 1-3 days   | 14-60 days      | 7-30 days   | 2-7 days|

### D. FTA Coverage Matrix

The following matrix shows which country pairs are covered by trade agreements,
enabling Kitz to automatically flag potential duty savings.

```
Origin \ Dest  | MX | CO | BR | CL | PE | US | AR | PA | CR | GT | HN | SV | DO | EC | BO | UY | PY
---------------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----
MX             |    | PA | -- | PA | PA | US | -- | BI | BI | BI | BI | BI | -- | -- | -- | -- | --
CO             | PA |    | -- | PA | CA | BI | -- | BI | BI | BI | -- | -- | -- | CA | CA | -- | --
BR             | -- | -- |    | MS | -- | -- | MS | -- | -- | -- | -- | -- | -- | -- | -- | MS | MS
CL             | PA | PA | MS |    | PA | BI | BI | BI | BI | -- | -- | -- | -- | -- | -- | -- | --
PE             | PA | CA | -- | PA |    | BI | -- | BI | -- | -- | -- | -- | -- | CA | CA | -- | --
US             | US | BI | -- | BI | BI |    | -- | BI | CD | CD | CD | CD | CD | -- | -- | -- | --

Legend: PA=Pacific Alliance, US=USMCA, MS=Mercosur, CA=CAN, CD=CAFTA-DR, BI=Bilateral, --=No FTA
```

### E. Kitz Implementation Priorities

**Phase 1 (MVP):**
- Inventory tracking with FIFO and Weighted Average
- Basic reorder point alerts
- ABC analysis
- Single-country landed cost calculator (Mexico first)

**Phase 2 (Growth):**
- Multi-country landed cost calculator with FTA checker
- Supplier discovery integration (Mercado Libre Negocios API)
- Shipping rate comparison across 2-3 carriers
- Inventory turnover reporting with industry benchmarks

**Phase 3 (Scale):**
- Automated customs documentation generation
- Real-time exchange rate integration
- Predictive demand forecasting (ML-based)
- Multi-warehouse inventory optimization
- Cross-border compliance monitoring

---

*This intelligence document is maintained as a living reference for the Kitz platform.
All trade agreement details, tariff rates, and regulatory requirements should be
verified against current government sources before use in production decisions.
Trade regulations change frequently -- automated monitoring of official gazettes
and customs bulletins is recommended.*

---

**Research Sources:**

- [Grand View Research - Latin America Supply Chain Management Market](https://www.grandviewresearch.com/horizon/outlook/supply-chain-management-market/latin-america)
- [Americas Market Intelligence - Supply Chain Opportunities 2026](https://americasmi.com/insights/2026-latin-america-supply-chain-opportunities/)
- [Americas Market Intelligence - LatAm Logistics Outlook 2025](https://americasmi.com/insights/latin-america-logistics-outlook-2025/)
- [Solistica - LatAm Logistics Challenges 2025](https://blog.solistica.com/en/challenges-and-opportunities-in-latin-american-logistics-for-2025-)
- [USTR - CAFTA-DR](https://ustr.gov/trade-agreements/free-trade-agreements/cafta-dr-dominican-republic-central-america-fta)
- [Wikipedia - Pacific Alliance](https://en.wikipedia.org/wiki/Pacific_Alliance)
- [Mercosur - Frequently Asked Questions](https://www.mercosur.int/en/about-mercosur/frequently-asked-questions)
- [Trade.gov - Mexico Import Requirements](https://www.trade.gov/country-commercial-guides/mexico-import-requirements-and-documentation)
- [Trade.gov - Colombia Import Requirements](https://www.trade.gov/country-commercial-guides/colombia-import-requirements-and-documentation)
- [Trade.gov - Brazil Customs Regulations](https://www.trade.gov/country-commercial-guides/brazil-customs-regulations)
- [Trade.gov - Chile Import Requirements](https://www.trade.gov/country-commercial-guides/chile-import-requirements-and-documentation)
- [FedEx - What Is Landed Cost](https://www.fedex.com/en-us/small-business/articles-insights/what-is-landed-cost.html)
- [DHL - Landed Cost Meaning and Calculation](https://www.dhl.com/discover/en-global/logistics-advice/essential-guides/landed-cost-meaning-formula-calculation)
- [Americas Market Intelligence - Top E-commerce Delivery Firms LatAm](https://americasmi.com/insights/top-e-commerce-delivery-firms-latin-america/)
- [Americas Market Intelligence - Rappi Business Model Impact](https://americasmi.com/insights/rappi-evolving-business-model-impact-latam-logistics/)
- [Digital Commerce 360 - Mercado Libre Negocios B2B](https://www.digitalcommerce360.com/2025/09/23/mercado-libre-negocios-expands-b2b/)
- [Trade.gov - Harmonized System Codes](https://www.trade.gov/harmonized-system-hs-codes)
- [MercoPress - Mercosur Tariff Updates 2025](https://en.mercopress.com/2025/07/02/mercosur-widens-list-of-external-tariff-free-goods)
- [Wikipedia - Central de Abasto](https://en.wikipedia.org/wiki/Central_de_Abasto)
- [IDB - Pacific Alliance Tariff Elimination](https://www.iadb.org/en/news/presidents-pacific-alliance-agree-total-elimination-tariffs)
