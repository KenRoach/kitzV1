# CRM Repos

> Module: CRM Repos | Sources: 1 | Auto-generated from KITZ Knowledge Base (Batch 4)

---

## ERP Suite

### ERPNext (GitHub)
- **Priority:** `High`
- **URL:** https://github.com/frappe/erpnext
- **Type:** Repo
- **Why KITZ needs it:** Full ERP: accounting, inventory, CRM, HR, manufacturing, POS -- 100% open source

**Extracted Intelligence:**

Free and open-source ERP system. **32K stars**, 10.5K forks, 56,802 commits. GPL-3.0 license.

**Key Features:**
- **Accounting:** Full cash flow management, transaction recording, financial reports
- **Order Management:** Inventory, stock replenishment, sales orders, customers, suppliers, shipments, fulfillment
- **Manufacturing:** Production cycles, material consumption, capacity planning, subcontracting
- **Asset Management:** IT infrastructure to equipment, centralized across branches
- **Projects:** Internal/external delivery, task/timesheet/issue tracking

**Tech Stack:** Frappe Framework (Python + JavaScript full-stack with DB abstraction, auth, REST API), Frappe UI (Vue-based SPA library).

**Deployment:** Frappe Cloud (managed), Docker self-hosted (`docker compose -f pwd.yml up -d`, access localhost:8080, admin/admin), Manual install via bench CLI (MariaDB).

**Resources:** Frappe School (courses), official docs, discussion forum, Telegram group.

**KITZ Relevance:** HIGH. Covers full business ops stack: accounting, inventory, CRM, HR, POS. GPL-3.0 open source, Python/Vue stack. KITZ can study data models, integrate via REST API, reference UI patterns. Already popular in LATAM, supports multi-currency and localization. n8n lists ERPNext as supported integration.
