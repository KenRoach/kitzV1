# Invoice Repos

> Module: Invoice Repos | Sources: 3 | Auto-generated from KITZ Knowledge Base (Batch 4)

---

## Invoicing

### InvoiceShelf (GitHub)
- **Priority:** `High`
- **URL:** https://github.com/InvoiceShelf/InvoiceShelf
- **Type:** Repo
- **Why KITZ needs it:** Open-source invoicing: estimates, payments, expenses, taxes, multi-currency

**Extracted Intelligence:**

Open-source web and mobile invoicing app. **1.6K stars**, 318 forks, 1,615 commits. AGPL-3.0 license.

**Features:** Track expenses/payments, professional invoices and estimates, installation wizard, email configuration, address customization, edit email before sending, Docker deployment, customer view, custom fields on invoices/estimates, multiple companies, recurring invoices, customer portal, Stripe payment integration, improved template system, modules/templates marketplace.

**Tech Stack:** Laravel (PHP), VueJS, React Native (mobile). Crowdin translations (multi-language).

**Origins:** Fork/inspiration from Crater Invoice.

**KITZ Relevance:** Comprehensive open-source invoicing. Multi-currency, recurring invoices, customer portal, Stripe integration. Laravel/Vue stack with React Native mobile.

---

### Crater Invoice (GitHub)
- **Priority:** `High`
- **URL:** https://github.com/crater-invoice-inc/crater
- **Type:** Repo
- **Why KITZ needs it:** Laravel invoicing solution: invoices, estimates, expenses, reports, mobile app

**Extracted Intelligence:**

Open-source invoicing app. **8.3K stars**, 1.7K forks, 1,292 commits. AGPL-3.0 license. **Last release: v6.0.6 (March 2022 -- appears unmaintained).**

**Tech Stack:** PHP 48%, Vue 40.3%, JS 8.1%, Blade 3.5%. Laravel + VueJS web, React Native mobile (Android + iOS).

**Roadmap (many incomplete):** Auto update, email config, installation wizard, Docker, custom fields, multiple companies, recurring invoices, customer portal, Stripe payments, white labeling, modules, API, blockchain, Web 3.0, accounting, vendors/bills, inventory, payment reminders, time tracking, payroll.

**Translations:** Arabic, French, Dutch, Serbian, German, Latvian.

**KITZ Relevance:** Historical reference. 8.3K stars but unmaintained since 2022. InvoiceShelf is the active fork. Roadmap shows complete invoicing solution requirements.

---

## Invoice Generator

### Invoify (GitHub)
- **Priority:** `Medium`
- **URL:** https://github.com/al1abb/invoify
- **Type:** Repo
- **Why KITZ needs it:** Next.js invoice generator: custom inputs, per-line tax, Shadcn UI, MIT license

**Extracted Intelligence:**

Web-based invoice generator. **6.2K stars**, 680 forks, 2,162 commits. **MIT license** (very permissive).

**Features:** Simple form to create invoices, browser storage, load/retrieve saved invoices, PDF download or email, multiple templates (2), live preview (real-time), export in JSON/XLSX/CSV/XML, i18n multi-language, themeable templates (custom colors), **custom inputs (e.g., VAT number)**, **per-line item tax**.

**Tech Stack:** Next.js 13, TypeScript, React, Shadcn-UI, Tailwind CSS, React Hook Form + Zod validation, Puppeteer (PDF), Nodemailer (email), Lucide Icons.

**Live Demo:** invoify.vercel.app

**Setup:** `git clone`, `npm install`, create `.env.local` for email, `npm run dev` at localhost:3000.

**KITZ Relevance:** HIGH. MIT license, Next.js/TypeScript stack, custom inputs (VAT number), per-line tax, multi-language, multi-format export -- all essential for LATAM invoicing. Shadcn UI provides clean interface pattern.
