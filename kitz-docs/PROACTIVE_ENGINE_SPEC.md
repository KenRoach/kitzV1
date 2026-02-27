# KITZ OS — Proactive Engine Specification

> Version: 1.0 | Date: 2026-02-27
> KITZ is predictive, proactive, and of service — always.

---

## Principles

1. **PREDICTIVE** — "I see what's coming before you do"
2. **PROACTIVE** — "I already handled it"
3. **OF SERVICE** — "Everything I do saves you time or money"

Every KITZ action must pass one test: **"Did this save the owner TIME or MONEY?"**

---

## Architecture

The Proactive Engine runs 24/7 inside `kitz-brain` and uses all 280 tools.

```
Signal Watchers (scheduled scans)
  → Decision Engine (classify urgency + decide action)
    → Action Layer (execute using 280 tools)
      → Learning Loop (measure outcomes, improve predictions)
```

---

## Signal Watchers

### Every 15 Minutes
- Scan WhatsApp inbox → new messages?
- Scan email inbox → new emails?
- Check payment webhooks → money received?

### Every 1 Hour
- Calendar scan → conflicts? reminders due?
- Inventory scan → stock levels ok?
- Order scan → anything stuck > 3 days?
- Sentiment scan → angry customers?

### Every Day (6am)
- Lead scoring → re-score all contacts
- Churn prediction → who's about to leave?
- Cash flow forecast → runway update
- Content calendar → what's posting today?
- Compliance check → deadlines approaching?
- Performance metrics → what changed?

### Every Week (Sunday Night)
- Full business health scan
- Competitor monitoring
- Trend analysis (what's up, what's down)
- Service report (time + money saved)
- Next week prep (content, reminders, forecasts)

### Every Month (Last Day)
- P&L generation
- Tax estimate
- Customer lifetime value recalculation
- License/permit renewal check
- Price competitiveness check

---

## Decision Engine

| Urgency | Action | Examples |
|---------|--------|----------|
| CRITICAL | Act NOW + notify owner | Payment failed, angry VIP, system down, cash critical |
| IMPORTANT | Draft action + ask approval | Churn risk, overdue invoice, stock low, new hot lead |
| ROUTINE | Act silently + report in brief | Reminders, backups, scoring, FAQ auto-replies, receipts |
| INSIGHT | Save for weekly report | Trends, patterns, suggestions, optimizations |

---

## Predictive Intelligence

### Revenue & Cash Flow
| Signal | Prediction |
|--------|-----------|
| Sales velocity slowing | Revenue drop forecast with % and recommended action |
| Seasonal patterns | "Last December you did 3x. 45 days to prepare." |
| Cash in vs cash out trajectory | "Run out of cash March 15. Options to extend." |
| Invoice aging patterns | "Client ABC pays 12 days late. Expect payment March 11." |
| Revenue concentration | "68% from 3 clients. Diversify now." |

### Customer Behavior
| Signal | Prediction |
|--------|-----------|
| Purchase frequency drops | "Maria hasn't ordered in 21 days (avg 14). About to churn." |
| Sentiment trend in conversations | "3 customers said 'slow' this week. Delivery problem." |
| Order size patterns | "José's orders grew 20% monthly. Ready for bulk pricing." |
| Response time patterns | "Fast responders convert 4x. 3 leads replied fast — call NOW." |
| LTV trajectory | "Top 10 will generate $24K this year. 5 new leads match." |

### Inventory & Supply Chain
| Signal | Prediction |
|--------|-----------|
| Sales rate vs stock level | "Product A runs out in 8 days. Reorder takes 5. ORDER TODAY." |
| Demand spikes | "Product B up 300% this week. Double your next order." |
| Dead stock aging | "Product C hasn't sold in 47 days. $800 tied up. Discount." |

### Marketing
| Signal | Prediction |
|--------|-----------|
| Post engagement trends | "Reels get 5x more engagement. Shift 70% to video." |
| Best posting times | "Audience active Tue/Thu 7-9pm. Schedule for those windows." |
| Ad spend vs return | "Instagram ROAS below 2x. Reallocate to WhatsApp." |

### Operations
| Signal | Prediction |
|--------|-----------|
| Order volume vs capacity | "At 50+ orders/week (4 weeks away), quality drops. Hire now." |
| SLA breach patterns | "3-6pm is bottleneck. 67% of late orders from that window." |
| Calendar overload | "8 meetings + 0 focus blocks. Move 2 meetings?" |

---

## Proactive Auto-Actions

### Customer Care
| Trigger | Action |
|---------|--------|
| New lead (any channel) | Smart reply < 60 sec + CRM + score + drip |
| Customer silent 2x usual frequency | Draft win-back with personalized offer |
| Customer birthday | Birthday message + special offer |
| Negative sentiment detected | URGENT flag + empathy draft + owner alert |
| FAQ question | Answer from RAG instantly — no human needed |
| Order delivered | "How was it?" + NPS + Google review ask (24hr after) |

### Money
| Trigger | Action |
|---------|--------|
| Invoice hits due date | Payment reminder (WA + email), escalate at day 7, 14, 30 |
| Payment received | Auto-match invoice + receipt + cash flow update |
| Cash runway < 3 months | URGENT alert with 3 options to extend |
| End of month | Pre-generate revenue report, expenses, tax estimate, P&L |

### Inventory & Orders
| Trigger | Action |
|---------|--------|
| Stock below reorder point | Draft purchase order based on sell rate |
| Order stuck > 3 days | Flag at-risk + draft customer update |
| Dead stock > 60 days | Suggest discount/bundle + draft promo + margin calc |

### Marketing
| Trigger | Action |
|---------|--------|
| Post 3x above average | "Boost for $20?" → one-tap approve |
| No content in 3 days | Draft 3 ready-to-post options |
| Google review received | Draft response (thank/empathize) + CRM update |
| Email open rate < 15% | "Subject lines not working. 3 A/B tests ready." |

### Calendar & Time
| Trigger | Action |
|---------|--------|
| Meeting in 24 hours | Send reminder + confirmation flow |
| Calendar conflict | Notify + suggest 3 open slots |
| 4+ hours with no break | "Added 15-min break at 1pm. You need it." |

### Compliance
| Trigger | Action |
|---------|--------|
| Tax deadline approaching | Pre-generate report, escalating reminders at 15/7/3/1 days |
| License renewal approaching | Checklist + reminders at 60/30/14/7 days |
| New regulation detected | Auto-update invoices/processes + notify |

### Team
| Trigger | Action |
|---------|--------|
| Employee anniversary | Draft recognition message |
| SOP not followed | Flag deviation + offer to update SOP |
| Repeated customer question | Create auto-reply + add to website FAQ |

---

## Service Report

Every week, KITZ reports its own value:

```
KITZ WEEKLY SERVICE REPORT

TIME SAVED
• X hours — auto-replied to Y WhatsApp messages
• X hours — generated invoices, quotes
• X hours — scheduled appointments + reminders
• X hours — drafted follow-up messages
• X hours — scanned receipts into expense tracker
Total: X hours saved (= $Y at hourly rate)

MONEY IMPACT
• $X — collected overdue invoices (auto-followed up)
• $X — upsold via AI suggestion
• $X — prevented dead stock loss
• $X — caught errors before sending
Total: $X revenue protected/generated

PROBLEMS PREVENTED
• X customers about to churn — intervened
• X orders at risk of SLA breach — resolved
• X calendar conflicts — caught and rescheduled

AI BATTERY USED: X credits ($Y)
ROI THIS WEEK: $Z / $Y = Nx return
```

---

## Learning Loop

Every proactive action is measured:

| Action | Measure |
|--------|---------|
| Win-back sent | Did customer return? |
| Boost suggested | Did ROI improve? |
| Reorder alert | Did we stockout anyway? |
| Lead scored hot | Did they convert? |
| Content posted at optimal time | Better than other times? |
| Churn intervention | Did customer stay? |

Results feed back into predictions. KITZ gets smarter every week.

---

## A Day in the Life

| Time | KITZ Action |
|------|-------------|
| 2am | Backup all data |
| 3am | Re-score all leads |
| 4am | Run churn prediction |
| 5am | Update cash flow forecast + check competitor prices |
| 6am | Pre-generate brief + send 24hr reminders |
| 7am | Morning brief to owner |
| 8am+ | Real-time: auto-reply, score leads, route inquiries |
| Ongoing | Invoice reminders, order tracking, content scheduling |
| 5pm | Evening summary to owner |
| 7pm | Auto-post evening content (peak engagement) |
| 9pm | Suggest boosts for top-performing posts |
| 11pm | After-hours auto-reply, queue for morning |
| 12am | Cycle restarts. KITZ never sleeps. |

---

## Implementation

### Service: kitz-brain (enhanced)
- Current: daily/weekly cron agents (sales, ops, cfo)
- New: Add 15-minute, hourly, daily, weekly, monthly signal watchers
- New: Decision engine with urgency classification
- New: Learning loop with outcome tracking
- New: Prediction models (initially heuristic, later ML)

### Cron Schedule
```
*/15 * * * *  — inbox/payment watchers
0 * * * *     — hourly scans (calendar, inventory, orders, sentiment)
0 6 * * *     — daily intelligence run
0 17 * * *    — evening summary
0 22 * * 0    — weekly analysis (Sunday)
0 20 L * *    — monthly close (last day)
```

### AI Battery Budget
- Proactive engine: max 5 credits/day for background scanning
- Owner can adjust in settings
- ROI tracked: every credit spent must demonstrate >= 2x return
