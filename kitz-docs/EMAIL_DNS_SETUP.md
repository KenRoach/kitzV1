# KITZ Email DNS Setup — kitz.services (GoDaddy)

## Overview

KITZ sends transactional + marketing emails from `kitz.services` via **Resend** (primary) and **SendGrid** (fallback). This guide covers the DNS records needed on GoDaddy to authenticate email and prevent deliverability issues.

## Sender Addresses

| Address | Purpose |
|---------|---------|
| `hello@kitz.services` | Welcome emails, onboarding, support |
| `noreply@kitz.services` | Transactional (invoices, receipts, notifications) |
| `kitz@kitz.services` | AI-generated content, artifact previews |
| `team@kitz.services` | Internal/team notifications |

---

## Step 1: Verify Domain on Resend

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click **Add Domain** → enter `kitz.services`
3. Resend will show DNS records to add — follow steps below

---

## Step 2: Add DNS Records on GoDaddy

Go to **GoDaddy → My Products → kitz.services → DNS Management**

### MX Records (for receiving email — optional)

If you want to receive email at kitz.services (e.g., via Google Workspace or Zoho):

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | @ | `feedback-smtp.us-east-1.amazonses.com` | 10 | 1 Hour |

> **Note:** If using Google Workspace, replace with Google's MX records instead. If you only need to SEND (not receive), skip MX.

### SPF Record

Authorizes Resend + SendGrid to send on behalf of kitz.services:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | @ | `v=spf1 include:amazonses.com include:sendgrid.net ~all` | 1 Hour |

> Resend uses Amazon SES under the hood. The `~all` soft-fails unauthorized senders.

### DKIM Records (from Resend dashboard)

Resend provides 3 CNAME records for DKIM signing. Add all three:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `resend._domainkey` | *(copy from Resend dashboard)* | 1 Hour |
| CNAME | `s1._domainkey` | *(copy from Resend dashboard)* | 1 Hour |
| CNAME | `s2._domainkey` | *(copy from Resend dashboard)* | 1 Hour |

> The exact CNAME values are generated when you add the domain in Resend. Copy them exactly.

### DMARC Record

Tells receivers what to do with emails that fail SPF/DKIM:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@kitz.services; pct=100` | 1 Hour |

> Start with `p=quarantine`. After 2 weeks of clean reports, upgrade to `p=reject`.

### Return-Path / Bounce Tracking (Resend)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `bounces` | `feedback-smtp.us-east-1.amazonses.com` | 1 Hour |

---

## Step 3: Verify on Resend

1. Go back to Resend dashboard → Domains → `kitz.services`
2. Click **Verify** — Resend checks DNS propagation (can take 5-60 min)
3. All records should show green checkmarks

---

## Step 4: SendGrid Fallback (Optional)

If using SendGrid as fallback:

1. Go to [sendgrid.com → Settings → Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
2. Authenticate `kitz.services` domain
3. Add SendGrid's CNAME records (typically `s1._domainkey`, `s2._domainkey`)
4. Since Resend DKIM may conflict, use SendGrid's link branding instead

> SPF already includes `sendgrid.net` from Step 2.

---

## Step 5: Set Environment Variables

```bash
# .env (root or kitz-email-connector)
RESEND_API_KEY=re_xxxxxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxxxxx  # optional fallback
FROM_EMAIL=KITZ <kitz@kitz.services>
FROM_EMAIL_NOREPLY=KITZ <noreply@kitz.services>
FROM_EMAIL_HELLO=KITZ <hello@kitz.services>
```

---

## Verification Checklist

- [ ] Domain added on Resend dashboard
- [ ] SPF TXT record added on GoDaddy
- [ ] 3x DKIM CNAME records added on GoDaddy
- [ ] DMARC TXT record added on GoDaddy
- [ ] Bounce CNAME record added on GoDaddy
- [ ] Domain verified (green) on Resend
- [ ] `RESEND_API_KEY` set in `.env`
- [ ] `FROM_EMAIL` set to `KITZ <kitz@kitz.services>`
- [ ] Send test email: `curl -X POST https://api.resend.com/emails -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d '{"from":"KITZ <kitz@kitz.services>","to":"your@email.com","subject":"KITZ Test","html":"<h1>KITZ is live!</h1>"}'`

---

## DNS Propagation

GoDaddy DNS changes typically propagate in 15-60 minutes. You can check propagation at:
- [mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx) — enter `kitz.services`
- [dnschecker.org](https://dnschecker.org) — check specific record types
