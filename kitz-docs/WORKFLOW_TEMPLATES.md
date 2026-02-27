# KITZ OS — Pre-Built Workflow Templates (25)

> Version: 1.0 | Date: 2026-02-27
> All workflows deployable with `workflow_createFromTemplate`
> All workflows respect draft-first policy for outbound messages

---

## Sales Workflows (4)

### WF-01: New Lead → Instant Response
**Trigger:** New WhatsApp/email/web message from unknown contact
```
→ crm_createContact (auto-create lead)
→ funnel_scoreLeads (score 0-100)
→ brain:analyzeSentiment (gauge intent)
→ brain:generateSmartReply (draft 3 options)
→ outbound_sendWhatsApp (best reply, < 60 sec) [draft-first]
→ drip_enrollContact (nurture sequence)
→ IF score > 70: notify owner "HOT LEAD"
→ drive_autoSave (log to CRM Sheet)
```

### WF-02: Lead Goes Cold → Win-Back
**Trigger:** No response from lead in 7 days
```
→ funnel_scoreLeads (re-score)
→ IF score dropped > 20 points:
  → marketing_generateContent (win-back message)
  → outbound_sendWhatsApp (personalized offer) [draft-first]
  → calendar_addEvent (follow-up in 3 days)
→ IF still no response after 14 days:
  → voice_call_start (AI calls them)
→ IF still no response after 30 days:
  → crm_updateContact (tag: dormant)
  → funnel_moveContact (archive stage)
```

### WF-03: Quote Sent → Follow-Up Machine
**Trigger:** quote_create completed
```
→ Day 1: outbound_sendWhatsApp ("Sent your quote") [draft-first]
→ Day 3: outbound_sendWhatsApp ("Any questions?") [draft-first]
→ Day 5: outbound_sendEmail (quote + testimonial) [draft-first]
→ Day 7: voice_call_start ("Checking in on quote")
→ Day 10: outbound_sendWhatsApp (expiry warning) [draft-first]
→ Day 14: llm_strategize (new approach or let go?)
→ IF accepted at any point: STOP + orders_createOrder
```

### WF-04: Deal Won → Full Onboarding
**Trigger:** funnel_moveContact → "won" stage
```
→ orders_createOrder (from quote)
→ invoice_create (auto-generate)
→ storefronts_create (payment link)
→ outbound_sendWhatsApp (invoice + payment link) [draft-first]
→ drip_enrollContact (onboarding sequence)
→ calendar_addEvent (kickoff call in 2 days)
→ crm_updateContact (tag: customer, remove: lead)
→ drive_upload (all docs to client folder)
```

---

## Order & Fulfillment Workflows (3)

### WF-05: Order Placed → Full Pipeline
**Trigger:** orders_createOrder
```
→ outbound_sendWhatsApp ("Order confirmed!") [draft-first]
→ invoice_fromOrder (auto-generate invoice)
→ inventory_adjustStock (deduct ordered items)
→ IF stock < reorder point: proactive_restockAlert
→ payments_summary (update daily revenue)
→ calendar_addEvent (fulfillment deadline)
→ crm_updateContact (last_order: today)
→ sheets_appendRow (add to Sales Sheet)
→ drive_upload (invoice to Drive)
```

### WF-06: Order Shipped → Delivery Tracking
**Trigger:** orders_updateOrder → status: "shipped"
```
→ outbound_sendWhatsApp ("Your order shipped!") [draft-first]
→ Day 1: outbound_sendWhatsApp (tracking update)
→ Delivery day: "Arriving today!"
→ Day +1: "How was everything?" + NPS survey
→ IF positive: "Leave us a Google review?"
→ IF negative: flag URGENT + empathy response + owner notified
```

### WF-07: Order Stuck → Escalation
**Trigger:** Order age > 3 days AND status ≠ shipped
```
→ Day 3: flag yellow + notify ops
→ Day 5: flag orange + draft customer update
→ Day 7: flag RED + notify owner + draft apology + discount offer
→ crm_updateContact (tag: at-risk)
→ funnel_suggestNextAction (recovery plan)
```

---

## Payment Workflows (3)

### WF-08: Payment Received → Full Reconciliation
**Trigger:** payments_processWebhook
```
→ invoice_markPaid (match to invoice)
→ outbound_sendWhatsApp ("Payment received!") [draft-first]
→ outbound_sendEmail (receipt PDF)
→ crm_updateContact (payment history updated)
→ sheets_appendRow (log to Revenue Sheet)
→ predict_cashflow (update forecast)
→ drive_upload (receipt to Drive)
→ IF first purchase: trigger WF-04 onboarding
→ IF repeat: track frequency pattern
```

### WF-09: Invoice Overdue → Escalation Ladder
**Trigger:** Invoice due_date passed
```
→ Day 1: outbound_sendWhatsApp (friendly reminder) [draft-first]
→ Day 3: outbound_sendEmail (formal reminder) [draft-first]
→ Day 7: voice_call_start (personal call)
→ Day 14: outbound_sendWhatsApp (urgency + payment link) [draft-first]
→ Day 21: outbound_sendEmail (final notice) [draft-first]
→ Day 30: notify owner "Escalate or write off?"
→ Each step: crm_updateContact (tag: overdue-Xd)
→ IF paid at any step: STOP + thank you + receipt
```

### WF-10: End of Month → Auto-Close Books
**Trigger:** Last day of month, 8pm
```
→ expense_tracker (finalize all entries)
→ advisor_invoiceTax (calculate tax owed)
→ artifact_generateDocument (P&L report)
→ artifact_generateDocument (cash flow statement)
→ predict_cashflow (next month forecast)
→ predict_revenue (next quarter forecast)
→ deck_create (monthly business review deck)
→ sheets_export (financial data to Sheets)
→ outbound_sendEmail (reports to owner)
→ drive_upload (all financial docs archived)
```

---

## Marketing Workflows (3)

### WF-11: Content Engine → Always-On Social
**Trigger:** Every Monday 6am (weekly batch)
```
→ brand_get (tone, language, colors)
→ rag_search (trending topics, industry insights)
→ llm_strategize (week's content strategy)
→ marketing_generateContent × 7 (daily posts)
→ image_generate × 7 (visuals for each)
→ promo_create × 7 (formatted per platform)
→ marketing_translateContent × 7 (ES + EN)
→ predict_bestTime (optimal posting times)
→ Schedule all 7 posts across the week
→ outbound_sendWhatsApp (preview to owner for approval)
```

### WF-12: Post Published → Engagement Loop
**Trigger:** content_publish completed
```
→ Wait 4 hours
→ content_measure (check performance)
→ IF engagement > 3x average:
  → content_suggestBoost ("Boost for $15?")
  → Owner approves → content_promote
→ IF engagement < 0.5x average:
  → llm_analyze ("Why did this underperform?")
  → proactive_learningLoop (don't repeat pattern)
→ Wait 24 hours → content_measure (final stats)
```

### WF-13: Google Review → Auto-Respond
**Trigger:** New Google review detected
```
→ brain:analyzeSentiment (positive/negative)
→ IF 4-5 stars:
  → Draft thank you response
  → crm_updateContact (tag: advocate)
  → In 3 days: ask for referral
→ IF 1-3 stars:
  → URGENT notify owner
  → Draft empathetic response + resolution
  → crm_updateContact (tag: unhappy)
  → calendar_addEvent (follow-up call)
```

---

## Customer Lifecycle Workflows (4)

### WF-14: Customer Birthday → Delight
**Trigger:** CRM birthday field = tomorrow
```
→ marketing_generateContent (birthday message)
→ image_generate (branded birthday graphic)
→ outbound_sendWhatsApp (message + graphic) [draft-first]
→ storefronts_create (birthday discount link)
→ outbound_sendWhatsApp (discount link) [draft-first]
```

### WF-15: Customer Milestone → Celebrate
**Trigger:** Customer reaches: 10th order / $1000 spent / 1-year anniversary
```
→ marketing_generateContent (celebration message)
→ outbound_sendWhatsApp (personalized congrats) [draft-first]
→ storefronts_create (VIP discount)
→ crm_updateContact (tag: VIP / loyal)
```

### WF-16: Churn Detected → Save the Customer
**Trigger:** predict_churn flags customer at risk
```
→ memory_search (purchase history, complaints)
→ llm_strategize (personalized save plan)
→ Day 1: outbound_sendWhatsApp ("We miss you") [draft-first]
→ Day 3: outbound_sendEmail (value + exclusive offer) [draft-first]
→ Day 5: voice_call_start (personal check-in)
→ Day 7: outbound_sendWhatsApp (final offer) [draft-first]
→ IF re-engages: celebrate + update score
→ IF doesn't: crm_updateContact (churned) + learningLoop
```

### WF-17: NPS Survey → Action on Feedback
**Trigger:** crm_submitFeedback received
```
→ IF score 9-10 (Promoter):
  → "Thank you! Would you refer a friend?"
  → Generate referral link
  → Ask for Google review
→ IF score 7-8 (Passive):
  → "What would make us a 10?"
  → Store feedback for improvement
→ IF score 0-6 (Detractor):
  → URGENT notify owner
  → "Can we make it right?"
  → calendar_addEvent (call within 24 hours)
```

---

## HR & Team Workflows (3)

### WF-18: New Hire → Full Onboarding
**Trigger:** New employee added to HR
```
→ artifact_generateDocument (offer letter)
→ doc_sign (send for signature)
→ calendar_addEvent (Day 1 schedule)
→ outbound_sendEmail (welcome + access links)
→ sop_list (assign required SOPs)
→ calendar_addEvent (30-day check-in)
→ calendar_addEvent (90-day review)
→ drive_createFolder (employee folder)
```

### WF-19: Shift Published → Notify All
**Trigger:** shift_schedule updated
```
→ FOR each employee:
  → merge_renderMessage (personalized schedule)
  → outbound_sendWhatsApp (shifts this week) [draft-first]
  → calendar_addEvent (sync to their calendar)
→ IF conflict: notify manager + suggest swap
```

### WF-20: Payroll Day → Auto-Process
**Trigger:** 1st or 15th of month
```
→ time_tracker (pull hours per employee)
→ advisor_employerCost (calculate per employee)
→ artifact_generateDocument (payslips)
→ outbound_sendEmail (payslip to each employee)
→ sheets_appendRow (log payroll expense)
→ predict_cashflow (update after payroll)
→ drive_upload (payslips to HR folder)
```

---

## Appointment Workflows (2)

### WF-21: Booking → Full Lifecycle
**Trigger:** Customer books via booking_page
```
→ calendar_addEvent (confirmed slot)
→ crm_createContact (if new customer)
→ outbound_sendWhatsApp ("Confirmed!") [draft-first]
→ outbound_sendEmail (confirmation + .ics file)
→ 24hr before: reminder (WhatsApp + Email + SMS)
→ 2hr before: WhatsApp "on the way" reminder
→ After: "How was your visit?" + NPS
→ IF positive: Google review request
→ "Book your next appointment?" + booking link
```

### WF-22: No-Show → Recovery
**Trigger:** Appointment time + 15 min, no check-in
```
→ outbound_sendWhatsApp ("We missed you") [draft-first]
→ crm_updateContact (tag: no-show, count: +1)
→ IF first no-show: free reschedule
→ IF second: require prepayment next time
→ IF third: flag for owner decision
→ calendar_findSlot (suggest new times)
→ predict_churn (assess risk)
```

---

## Compliance & Admin Workflows (3)

### WF-23: Tax Deadline → Auto-Prepare
**Trigger:** 15 days before tax deadline (country-specific)
```
→ expense_tracker (finalize period)
→ advisor_invoiceTax (calculate obligation)
→ artifact_generateDocument (tax summary)
→ Day 15: "Tax due in 15 days: $X"
→ Day 7: "Tax due in 7 days. Report ready."
→ Day 3: "Tax due in 3 days."
→ Day 1: URGENT "Tax due TOMORROW"
→ archive_store (tax documents archived)
→ drive_upload (to Tax folder)
```

### WF-24: License Renewal → Auto-Remind
**Trigger:** 60 days before expiration
```
→ Day 60: "License expires in 60 days"
→ Day 30: "Renewal checklist ready"
→ Day 14: "Renewal required in 2 weeks"
→ Day 7: URGENT "Renew now or risk fine"
→ rag_search (country-specific renewal process)
→ artifact_generateDocument (renewal checklist)
```

### WF-25: Document Received → Auto-File
**Trigger:** Email/WhatsApp with attachment received
```
→ doc_scan (extract structured data)
→ llm_analyze (classify: invoice/receipt/contract/quote/ID/other)
→ archive_store (auto-tag + file)
→ IF invoice: expense_tracker + drive_upload (Invoices/)
→ IF contract: flag for review + doc_sign
→ IF receipt: media_scan_receipt + categorize
→ notify owner: "Filed {{type}} from {{sender}}"
→ drive_upload (organized by type + date)
```

---

## Custom Workflows

Users create unlimited custom workflows with natural language:

```
"Every Friday at 5pm, send me sales + unpaid invoices + next week's calendar"
"When someone fills my form, add to CRM and send welcome WhatsApp"
"If any order isn't shipped in 48 hours, text me"
"After every sale, ask for Google review 3 days later"
"On the 1st, generate invoices for recurring clients"
"When a customer sends a photo, scan it and add to catalog"
"Every Sunday night, plan my social media and send drafts"
```

Each custom workflow uses `workflow_create` → AI parses intent → maps to tools → generates workflow → user approves → deployed.
